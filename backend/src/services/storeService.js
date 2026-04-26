import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { User, Signal, News, Airdrop } from '../models/index.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

class StoreService {
    constructor() {
        this.mutex = Promise.resolve();
        const dbUrl = config.databaseUrl || '';
        this.useMongo = dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://');
    }

    async init() {
        if (!this.useMongo) {
            try {
                await fs.mkdir(DATA_DIR, { recursive: true });
            } catch (err) {
                console.error("StoreService: Failed to ensure data dir", err);
            }
        }
    }

    // Atomic Lock for JSON files
    async lock(fn) {
        if (this.useMongo) return fn(); // MongoDB handles its own concurrency

        let release;
        const lockPromise = new Promise(resolve => release = resolve);
        const previousLock = this.mutex;
        this.mutex = previousLock.then(() => lockPromise);

        try {
            await previousLock;
            return await fn();
        } finally {
            release();
        }
    }

    _getModel(collection) {
        switch (collection) {
            case 'users': return User;
            case 'signals': return Signal;
            case 'news': return News;
            case 'airdrop': return Airdrop;
            default: 
                return mongoose.models[collection] || mongoose.model(collection, new mongoose.Schema({}, { strict: false }));
        }
    }

    async read(collection) {
        if (this.useMongo) {
            const Model = this._getModel(collection);
            return Model.find({}).lean(); // lean() returns plain JSON objects like fs.readFile
        }

        const filePath = path.join(DATA_DIR, `${collection}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            try {
                return JSON.parse(data);
            } catch (parseError) {
                console.error(`StoreService: Corrupted JSON in ${collection}.json, resetting to default.`, parseError);
                // Return appropriate default based on common collection types
                return collection.includes('config') || collection.includes('settings') ? {} : [];
            }
        } catch (error) {
            if (error.code === 'ENOENT') return collection.includes('config') || collection.includes('settings') ? {} : [];
            throw error;
        }
    }

    async write(collection, data) {
        if (this.useMongo) {
            console.warn(`Direct write() called on Mongo store for ${collection}. This replaces the WHOLE collection.`);
            const Model = this._getModel(collection);
            await Model.deleteMany({});
            return Model.insertMany(data);
        }

        return this.lock(async () => {
            const filePath = path.join(DATA_DIR, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
            await fs.rename(tempPath, filePath);
        });
    }

    async findOne(collection, query) {
        if (this.useMongo) {
            const Model = this._getModel(collection);
            return Model.findOne(query).lean();
        }

        const items = await this.read(collection);
        return items.find(item => Object.keys(query).every(key => item[key] === query[key]));
    }

    async create(collection, item) {
        if (this.useMongo) {
            const Model = this._getModel(collection);
            if (!item.id) item.id = Math.random().toString(36).substr(2, 9);
            const doc = new Model(item);
            await doc.save();
            return doc.toObject();
        }

        return this.lock(async () => {
            const items = await this.read(collection);
            if (!item.id) item.id = Math.random().toString(36).substr(2, 9);
            item.createdAt = new Date().toISOString();
            items.push(item);

            // Inline file write to prevent deadlocks with nested locks
            const filePath = path.join(DATA_DIR, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(items, null, 2));
            await fs.rename(tempPath, filePath);

            return item;
        });
    }

    async update(collection, predicate, updateFn) {
        if (this.useMongo) {
            // Mongo update is trickier because we pass a function in the old API
            // Let's fetch it, modify it, and save it. This isn't atomic in Mongo, but mimics the old logic perfectly
            const items = await this.read(collection);
            const index = items.findIndex(predicate);
            if (index === -1) return null;

            const updatedItemMetadata = updateFn(items[index]);
            const Model = this._getModel(collection);
            const updatedDoc = await Model.findOneAndUpdate(
                { id: items[index].id }, // Assumes we use 'id'
                { $set: updatedItemMetadata },
                { new: true }
            );
            return updatedDoc ? updatedDoc.toObject() : null;
        }

        return this.lock(async () => {
            const items = await this.read(collection);
            const index = items.findIndex(predicate);
            if (index === -1) return null;

            const updatedItem = updateFn(items[index]);
            items[index] = { ...items[index], ...updatedItem };

            const filePath = path.join(DATA_DIR, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(items, null, 2));
            await fs.rename(tempPath, filePath);

            return items[index];
        });
    }
}

export const store = new StoreService();
