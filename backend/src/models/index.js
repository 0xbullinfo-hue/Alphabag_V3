import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    wallets: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date }
}, { strict: false }); // strict false allows arbitrary data to match existing JSON structures

const SignalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const NewsSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const AirdropSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

export const User = mongoose.model('User', UserSchema);
export const Signal = mongoose.model('Signal', SignalSchema);
export const News = mongoose.model('News', NewsSchema);
export const Airdrop = mongoose.model('Airdrop', AirdropSchema);
