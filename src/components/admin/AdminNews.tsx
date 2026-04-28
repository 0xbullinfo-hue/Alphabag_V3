
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Trash2, Plus, Newspaper } from 'lucide-react';
import { NewsItem } from '../../types';

export const AdminNews: React.FC = () => {
    const { token } = useAuth();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        imageUrl: '',
        source: 'AlphaBAG Intel',
        isPremium: false
    });

    const fetchNews = async () => {
        try {
            const res = await api.get('/api/news');
            setNews(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/api/admin/news', formData);
            setFormData({ title: '', summary: '', imageUrl: '', source: 'AlphaBAG Intel', isPremium: false });
            fetchNews();
        } catch (error) {
            alert('Failed to post news');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this news item?')) return;
        try {
            await api.delete(`/api/admin/news/${id}`);
            fetchNews();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* FORM */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                <div className="flex items-center mb-6 text-alphabag-yellow">
                    <Newspaper size={24} className="mr-3" />
                    <h2 className="font-black text-xl uppercase tracking-widest">Broadcast News</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Headline"
                            required
                            className="bg-alphabag-black/40 border border-alphabag-gray rounded-lg px-4 py-3 text-white focus:border-alphabag-yellow outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Source"
                            className="bg-alphabag-black/40 border border-alphabag-gray rounded-lg px-4 py-3 text-white focus:border-alphabag-yellow outline-none"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <input
                            type="text"
                            placeholder="Image URL (e.g. https://imgur.com/...)"
                            className="bg-alphabag-black/40 border border-alphabag-gray rounded-lg px-4 py-3 text-white focus:border-alphabag-yellow outline-none"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                    </div>
                    <textarea
                        placeholder="Summary / Content"
                        required
                        className="w-full bg-alphabag-black/40 border border-alphabag-gray rounded-lg px-4 py-3 text-white focus:border-alphabag-yellow outline-none h-32"
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-sm font-bold text-alphabag-subtext cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPremium}
                                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                className="w-4 h-4 rounded border-alphabag-gray bg-alphabag-black/40 text-alphabag-yellow focus:ring-alphabag-yellow"
                            />
                            <span>Premium Content (Ultimate Only)</span>
                        </label>
                        <Button type="submit" disabled={isLoading} className="bg-alphabag-yellow text-black hover:bg-yellow-400">
                            <Plus size={18} className="mr-2" />
                            {isLoading ? 'Broadcasting...' : 'Publish Intel'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-alphabag-subtext uppercase tracking-widest mb-4 opacity-70">Active Broadcasts</h3>
                {news.map(item => (
                    <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-alphabag-dark border border-alphabag-gray rounded-xl p-4 hover:border-alphabag-gray/70 transition-colors">
                        <div>
                            <h4 className="font-bold text-white text-md">{item.title}</h4>
                            <p className="text-xs text-alphabag-subtext mt-1">{item.summary.substring(0, 80)}...</p>
                        </div>
                        <div className="flex items-center mt-3 md:mt-0 gap-4">
                            {item.isPremium && <span className="text-[10px] bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-1 rounded font-bold uppercase">PREMIUM</span>}
                            <div className="text-[10px] text-alphabag-subtext">{new Date(item.date).toLocaleDateString()}</div>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-white transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
