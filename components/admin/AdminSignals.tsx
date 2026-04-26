
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Trash2, Plus, Radio } from 'lucide-react';
import { TradeSignal } from '../../types';

export const AdminSignals: React.FC = () => {
    const { token } = useAuth();
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        pair: '',
        type: 'LONG',
        category: 'SWING',
        entry: '',
        stopLoss: '',
        targets: '',
        narrative: '',
        description: '',
        socialLinks: { twitter: '', telegram: '', website: '' },
        relevantInfo: '',
        contractAddress: '',
        status: 'ACTIVE'
    });

    const fetchSignals = async () => {
        try {
            // Note: Public/Admin endpoints might differ slightly? 
            // We use public for fetching list, admin for delete/create.
            const res = await api.get('/api/signals');
            setSignals(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSignals();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const targetsArray = formData.targets.split(',').map(t => t.trim());
            const payload = {
                ...formData,
                targets: targetsArray,
                risk: 'MEDIUM', // Default for now
            };

            if (editingId) {
                await api.put(`/api/admin/signals/${editingId}`, payload);
            } else {
                await api.post('/api/admin/signals', { ...payload, status: 'ACTIVE' });
            }

            resetForm();
            fetchSignals();
        } catch (error: any) {
            console.error("Signal Save Error:", error.response?.data || error.message);
            alert(`Failed to save signal: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            pair: '', type: 'LONG', category: 'SWING',
            entry: '', stopLoss: '', targets: '', narrative: '',
            description: '', socialLinks: { twitter: '', telegram: '', website: '' }, relevantInfo: '',
            contractAddress: '',
            status: 'ACTIVE'
        });
        setEditingId(null);
    };

    const handleEdit = (signal: TradeSignal) => {
        if (signal.id) setEditingId(signal.id);
        setFormData({
            pair: signal.pair,
            type: signal.type,
            category: signal.category || 'SWING',
            entry: signal.entry,
            stopLoss: signal.stopLoss || '',
            // @ts-ignore
            targets: Array.isArray(signal.targets) ? signal.targets.join(', ') : signal.targets,
            narrative: signal.narrative || '',
            description: signal.description || '',
            socialLinks: {
                twitter: signal.socialLinks?.twitter || '',
                telegram: signal.socialLinks?.telegram || '',
                website: signal.socialLinks?.website || ''
            },
            relevantInfo: signal.relevantInfo || '',
            // @ts-ignore
            contractAddress: signal.contractAddress || '',
            status: signal.status || 'ACTIVE'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this signal?')) return;
        try {
            await api.delete(`/api/admin/signals/${id}`);
            fetchSignals();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.put(`/api/admin/signals/${id}`, { status: newStatus });
            fetchSignals();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl p-1 shadow-2xl overflow-hidden">
                {/* Visual Header / Tabs */}
                {/* Mapping Categories to nice tabs */}
                <div className="grid grid-cols-5 bg-alphabag-black/50 p-1 rounded-t-3xl border-b border-alphabag-gray overflow-x-auto">
                    {(['SWING', 'SCALPS', 'LONGTERM', 'DEGEN', 'AIRDROP'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFormData({ ...formData, category: cat })}
                            className={`py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all rounded-xl ${formData.category === cat
                                ? 'bg-alphabag-yellow text-black shadow-[0_0_15px_rgba(252,213,53,0.3)]'
                                : 'text-alphabag-subtext hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: INPUTS */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-xl uppercase tracking-widest text-white flex items-center">
                                <Radio size={24} className="mr-3 text-alphabag-blue" />
                                {editingId ? 'Edit Signal' : 'Issue New Alpha'}
                            </h2>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={resetForm} className="text-alphabag-red hover:bg-white/5">
                                    Cancel Edit
                                </Button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Signal Type & Pair */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Asset Pair</label>
                                    <input
                                        type="text" placeholder="BTC/USDT" required
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-mono font-bold focus:border-alphabag-yellow outline-none transition-colors"
                                        value={formData.pair || ''}
                                        onChange={e => setFormData({ ...formData, pair: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Action</label>
                                    <select
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-bold focus:border-alphabag-yellow outline-none appearance-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="LONG">LONG 🟢</option>
                                        <option value="SHORT">SHORT 🔴</option>
                                        <option value="BUY">SPOT BUY 🔵</option>
                                        <option value="DEGEN">DEGEN 🚀</option>
                                        <option value="AIRDROP">AIRDROP 🪂</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Fields based on Category */}
                            {['DEGEN', 'AIRDROP'].includes(formData.category) ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Contract Address</label>
                                            <input type="text" placeholder="0x..." className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-mono text-sm outline-none focus:border-alphabag-yellow"
                                                value={formData.contractAddress} onChange={e => setFormData({ ...formData, contractAddress: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Website</label>
                                            <input type="text" placeholder="https://..." className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white outline-none focus:border-alphabag-yellow"
                                                value={formData.socialLinks.website} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Twitter</label>
                                            <input type="text" placeholder="URL" className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white outline-none focus:border-alphabag-yellow"
                                                value={formData.socialLinks.twitter} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Telegram</label>
                                            <input type="text" placeholder="URL" className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white outline-none focus:border-alphabag-yellow"
                                                value={formData.socialLinks.telegram} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, telegram: e.target.value } })} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Entry Zone</label>
                                        <input type="text" placeholder="1.20 - 1.25" className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-mono focus:border-alphabag-yellow outline-none"
                                            value={formData.entry} onChange={e => setFormData({ ...formData, entry: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Stop Loss</label>
                                        <input type="text" placeholder="1.10" className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-mono focus:border-alphabag-yellow outline-none"
                                            value={formData.stopLoss} onChange={e => setFormData({ ...formData, stopLoss: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Targets</label>
                                        <input type="text" placeholder="1.4, 1.6, 2.0" className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white font-mono focus:border-alphabag-yellow outline-none"
                                            value={formData.targets} onChange={e => setFormData({ ...formData, targets: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {formData.category !== 'LONGTERM' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Narrative / Thesis</label>
                                        <textarea
                                            placeholder="Why are we bullish? Short naming..."
                                            required={formData.category !== 'LONGTERM'}
                                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white focus:border-alphabag-yellow outline-none h-20 resize-none"
                                            value={formData.narrative}
                                            onChange={e => setFormData({ ...formData, narrative: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Deep Dive (Optional)</label>
                                        <textarea
                                            placeholder="Detailed analysis..."
                                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white focus:border-alphabag-yellow outline-none h-32 resize-none"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext pl-1">Extra Info</label>
                                <input
                                    type="text"
                                    placeholder="Launch Date, Market Cap, specific instructions..."
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl py-4 px-4 text-white outline-none focus:border-alphabag-yellow"
                                    value={formData.relevantInfo}
                                    onChange={e => setFormData({ ...formData, relevantInfo: e.target.value })}
                                />
                            </div>

                            {editingId && (
                                <div className="bg-alphabag-yellow/10 border border-alphabag-yellow/30 p-4 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-bold text-alphabag-yellow uppercase tracking-widest">Update Signal Status</span>
                                    <select
                                        className="bg-alphabag-black border border-alphabag-yellow/30 rounded px-3 py-2 text-white text-xs outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="HIT">HIT 🎯</option>
                                        <option value="LOSS">LOSS ❌</option>
                                        <option value="CLOSED">CLOSED 🔒</option>
                                        <option value="PENDING">PENDING ⏳</option>
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isLoading} className="bg-alphabag-yellow text-black font-black uppercase tracking-widest px-8 hover:bg-yellow-400">
                                    {editingId ? 'Update & Broadcast' : 'Publish Signal'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE SIGNALS LIST */}
                    <div className="lg:col-span-5">
                        <div className="bg-alphabag-black/50 border border-alphabag-gray rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
                            <h3 className="text-xs font-black text-alphabag-subtext uppercase tracking-widest mb-6 opacity-70 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                                Live Feed
                            </h3>

                            <div className="space-y-3 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                                {signals.length === 0 && (
                                    <div className="text-center py-10 text-alphabag-subtext italic">No active signals</div>
                                )}
                                {signals.map(s => (
                                    <div key={s.id} className="group bg-alphabag-dark hover:bg-white/5 border border-alphabag-gray rounded-xl p-4 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase ${s.type === 'LONG' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    s.type === 'SHORT' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {s.type}
                                                </div>
                                                <span className="text-xs font-bold text-alphabag-subtext uppercase">{s.category}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(s)} className="text-alphabag-subtext hover:text-white transition-colors">
                                                    <Plus size={14} className="rotate-45" /> {/* Edit Icon replacement? No, let's use text or proper icon */}
                                                    <span className="text-[10px] uppercase font-bold">Edit</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-black text-white text-lg">{s.pair}</h4>
                                            {s.status === 'HIT' && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-full font-bold">HIT</span>}
                                            {s.status === 'LOSS' && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">LOSS</span>}
                                            {s.status === 'ACTIVE' && <span className="text-[10px] bg-alphabag-blue/20 text-alphabag-blue px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                                        </div>

                                        <div className="flex gap-2 mt-3 pt-3 border-t border-alphabag-border">
                                            <button onClick={() => handleStatusUpdate(s.id, 'HIT')} className="flex-1 text-[10px] py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded hover:bg-green-500 hover:text-black font-bold uppercase transition-colors">
                                                Target Hit
                                            </button>
                                            <button onClick={() => handleStatusUpdate(s.id, 'LOSS')} className="flex-1 text-[10px] py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500 hover:text-white font-bold uppercase transition-colors">
                                                Stop Hit
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="px-3 text-alphabag-subtext hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
