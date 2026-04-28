import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Trash2, Radio, Save, Send, AlertTriangle, Plus, Activity } from 'lucide-react';

interface Whale {
    id: string;
    address: string;
    name: string;
    threshold: number;
    chain: string;
}

export const AdminWhales: React.FC = () => {
    const [whales, setWhales] = useState<Whale[]>([]);
    const [settings, setSettings] = useState({ telegramBotToken: '', telegramChatId: '' });
    const [newWhale, setNewWhale] = useState({ address: '', name: '', threshold: 100000, chain: 'ETH' });
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [wRes, sRes] = await Promise.all([
                api.get('/api/admin/whales'),
                api.get('/api/admin/settings')
            ]);
            setWhales(wRes.data);
            setSettings({
                telegramBotToken: sRes.data.telegramBotToken || '',
                telegramChatId: sRes.data.telegramChatId || ''
            });
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            await api.post('/api/admin/settings', settings);
            alert('Settings Saved');
        } catch (e) {
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleTestAlert = async () => {
        setTesting(true);
        try {
            await api.post('/api/admin/test-alert', {});
            alert('Test Alert Sent! Check Telegram.');
        } catch (e) {
            alert('Failed to send test alert. Check Bot Token / Chat ID.');
        } finally {
            setTesting(false);
        }
    };

    const handleAddWhale = async () => {
        if (!newWhale.address) return;
        try {
            const res = await api.post('/api/admin/whales', newWhale);
            setWhales([...whales, res.data.item]);
            setNewWhale({ address: '', name: '', threshold: 100000, chain: 'ETH' });
        } catch (e) {
            alert('Failed to add whale');
        }
    };

    const handleDeleteWhale = async (id: string) => {
        if (!confirm('Stop tracking this whale?')) return;
        try {
            await api.delete(`/api/admin/whales/${id}`);
            setWhales(whales.filter(w => w.id !== id));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Whale Alert Hub</h2>
                    <p className="text-alphabag-subtext text-sm">Configure Telegram alerts and manage tracked wallets</p>
                </div>
                <div className="px-3 py-1 bg-alphabag-green/20 border border-alphabag-green/30 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-alphabag-green animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold text-alphabag-green">Network Active</span>
                </div>
            </div>

            {/* Telegram Settings */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Send className="text-blue-400" size={24} />
                    <h3 className="font-black text-lg text-white uppercase tracking-tighter">Telegram Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-2">Bot Token</label>
                        <input
                            type="text"
                            value={settings.telegramBotToken}
                            onChange={e => setSettings({ ...settings, telegramBotToken: e.target.value })}
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl px-4 py-3 text-white focus:border-alphabag-yellow outline-none font-mono text-sm"
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        />
                        <p className="text-[10px] text-alphabag-subtext mt-2">Create via <a href="https://t.me/BotFather" target="_blank" className="text-alphabag-yellow hover:underline">@BotFather</a></p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-2">Channel Chat ID</label>
                        <input
                            type="text"
                            value={settings.telegramChatId}
                            onChange={e => setSettings({ ...settings, telegramChatId: e.target.value })}
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl px-4 py-3 text-white focus:border-alphabag-yellow outline-none font-mono text-sm"
                            placeholder="-1001234567890"
                        />
                        <p className="text-[10px] text-alphabag-subtext mt-2">Add bot to channel as Admin first</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button onClick={handleSaveSettings} disabled={loading} className="font-black uppercase tracking-widest px-8">
                        <Save size={16} className="mr-2" /> Save Config
                    </Button>
                    <Button variant="secondary" onClick={handleTestAlert} disabled={testing || !settings.telegramBotToken} className="font-black uppercase tracking-widest px-8 border-alphabag-gray hover:border-blue-500 hover:text-blue-500">
                        {testing ? 'Sending...' : <><Radio size={16} className="mr-2" /> Test Alert</>}
                    </Button>
                </div>
            </div>

            {/* Watchlist */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Activity className="text-alphabag-yellow" size={24} />
                        <h3 className="font-black text-lg text-white uppercase tracking-tighter">Whale Watchlist</h3>
                    </div>
                    <span className="text-xs font-bold text-alphabag-subtext bg-alphabag-black px-3 py-1 rounded-full">{whales.length} Monitored</span>
                </div>

                {/* Add Form */}
                <div className="bg-alphabag-black/30 rounded-xl p-4 mb-6 border border-alphabag-gray/50 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-2">Wallet Address</label>
                        <input
                            type="text"
                            value={newWhale.address}
                            onChange={e => setNewWhale({ ...newWhale, address: e.target.value })}
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-2 text-white text-xs font-mono"
                            placeholder="0x..."
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-2">Label</label>
                        <input
                            type="text"
                            value={newWhale.name}
                            onChange={e => setNewWhale({ ...newWhale, name: e.target.value })}
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-2 text-white text-xs"
                            placeholder="e.g. Vitalik"
                        />
                    </div>
                    <div className="w-full md:w-1/6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-2">Min Value ($)</label>
                        <input
                            type="number"
                            value={newWhale.threshold}
                            onChange={e => setNewWhale({ ...newWhale, threshold: parseFloat(e.target.value) })}
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-2 text-white text-xs"
                        />
                    </div>
                    <Button onClick={handleAddWhale} disabled={!newWhale.address} size="sm" className="h-[38px] px-6 font-black uppercase">
                        <Plus size={16} /> Add
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-alphabag-subtext uppercase tracking-widest font-black border-b border-alphabag-gray">
                            <tr>
                                <th className="pb-4 pl-4">Identity</th>
                                <th className="pb-4">Address</th>
                                <th className="pb-4">Alert Threshold</th>
                                <th className="pb-4 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray/10 text-xs">
                            {whales.map(whale => (
                                <tr key={whale.id} className="hover:bg-alphabag-gray/5">
                                    <td className="py-4 pl-4 font-bold text-white">{whale.name}</td>
                                    <td className="py-4 font-mono text-alphabag-subtext">{whale.address}</td>
                                    <td className="py-4 text-alphabag-green font-bold"> &gt; ${whale.threshold.toLocaleString()}</td>
                                    <td className="py-4 text-right pr-4">
                                        <button onClick={() => handleDeleteWhale(whale.id)} className="text-alphabag-subtext hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
