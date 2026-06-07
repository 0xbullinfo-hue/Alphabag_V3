import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

class StoreService {
    constructor() {
        this.mutex = Promise.resolve();
    }

    async init() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
        } catch (err) {
            console.error("StoreService: Failed to ensure data dir", err);
        }
    }

    // Atomic Lock for JSON files
    async lock(fn) {
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

    async read(collection) {
        const filePath = path.join(DATA_DIR, `${collection}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            try {
                return JSON.parse(data);
            } catch (parseError) {
                console.error(`StoreService: Corrupted JSON in ${collection}.json, resetting to default.`, parseError);
                return collection.includes('config') || collection.includes('settings') ? {} : [];
            }
        } catch (error) {
            if (error.code === 'ENOENT') return collection.includes('config') || collection.includes('settings') ? {} : [];
            throw error;
        }
    }

    async write(collection, data) {
        return this.lock(async () => {
            const filePath = path.join(DATA_DIR, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
            await fs.rename(tempPath, filePath);
        });
    }

    async findOne(collection, query) {
        const items = await this.read(collection);
        return items.find(item => Object.keys(query).every(key => item[key] === query[key]));
    }

    async create(collection, item) {
        return this.lock(async () => {
            const items = await this.read(collection);
            if (!item.id) item.id = Math.random().toString(36).substr(2, 9);
            item.createdAt = new Date().toISOString();
            items.push(item);

            const filePath = path.join(DATA_DIR, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(items, null, 2));
            await fs.rename(tempPath, filePath);

            return item;
        });
    }

    async update(collection, predicate, updateFn) {
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
