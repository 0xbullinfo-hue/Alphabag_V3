import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TradeSignal } from '../types';
import {
    Radio, Lock, Rocket, Target, Gift, Clock,
    MessageSquare, Volume2, Copy, History, Layers, ExternalLink, Loader2, ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import Swal from 'sweetalert2';

// Simulated premium "preview" data for the read-only Alpha Phase
const DEMO_SIGNALS: TradeSignal[] = [
    {
        id: 'demo-1',
        pair: 'SOL/USDC',
        category: 'DEGEN',
        type: 'BUY',
        risk: 'HIGH',
        status: 'ACTIVE',
        entry: '***', // Masked
        targets: ['***', '***', '***'],
        stopLoss: '***',
        narrative: 'Accumulation pattern observed across top 50 whale wallets. Anticipating major liquidity sweep to the upside ahead of upcoming network upgrade. Early positioning is critical.',
        timestamp: 'Just now',
        contractAddress: '***',
        socialLinks: { twitter: '#', telegram: '#', website: '#' }
    },
    {
        id: 'demo-2',
        pair: 'PEPE/SOL',
        category: 'LONGTERM',
        type: 'BUY',
        risk: 'MEDIUM',
        status: 'ACTIVE',
        entry: '***',
        targets: ['***', '***'],
        stopLoss: '***',
        narrative: 'Strong relative strength against the wider market dump. On-chain volume is surging. Breaking key resistance zone, targeting a 300% narrative leg up.',
        timestamp: '2 hours ago',
        contractAddress: '***',
    },
    {
        id: 'demo-3',
        pair: 'NEW/PROJECT',
        category: 'AIRDROPS',
        type: 'AIRDROP',
        risk: 'LOW',
        status: 'ACTIVE',
        entry: '***',
        targets: ['***'],
        stopLoss: '***',
        narrative: 'Highly classified seed-round token entering public sale. Team allocated massive supply for community airdrop. Secure your wallet interactions rapidly to qualify.',
        timestamp: '5 hours ago',
        relevantInfo: '***',
        socialLinks: { twitter: '#' }
    }
];

const CATEGORIES = ['ALL', 'DEGEN', 'SHORT', 'LONGTERM', 'AIRDROPS'];

export const AlphaCalls: React.FC = () => {
    const { user, token } = useAuth();
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const res = await api.get('/api/signals');
                // Use demo data if backend is empty (for the read-only showcase)
                if (!res.data || res.data.length === 0) {
                    setSignals(DEMO_SIGNALS);
                } else {
                    setSignals(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch signals, using demo data", error);
                setSignals(DEMO_SIGNALS);
            } finally {
                setLoading(false);
            }
        };
        fetchSignals();
    }, [token]);

    const copyToClipboard = (text: string) => {
        if (text.includes('***')) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Data Encrypted. Unlock required.',
                showConfirmButton: false,
                timer: 2000,
                background: '#1E2329',
                color: '#FCBA03'
            });
            return;
        }
        navigator.clipboard.writeText(text);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Copied to clipboard',
            showConfirmButton: false,
            timer: 1500,
            background: '#1E2329',
            color: '#FFF'
        });
    };

    return (
        <div className="relative min-h-[calc(100vh-12rem)] flex flex-col pb-20 max-w-6xl mx-auto">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-alphabag-yellow/10 rounded-lg border border-alphabag-yellow/20">
                            <Radio className="text-alphabag-yellow animate-pulse" size={20} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative">
                            Classified <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Alphas</span>
                        </h1>
                    </div>
                    <p className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest pl-1">
                        High-conviction setups • Early Mems • Airdrops
                    </p>
                </div>

                <div className="bg-alphabag-yellow/10 border border-alphabag-yellow/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-yellow/5">
                    <ShieldAlert size={14} className="text-alphabag-yellow" />
                    <span className="text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.2em] relative top-px">
                        E2E Encryption Active
                    </span>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar pb-4 mb-6 gap-2 px-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeCategory === cat 
                            ? 'bg-alphabag-yellow text-alphabag-black shadow-[0_0_15px_rgba(252,213,53,0.3)]' 
                            : 'bg-black/40 border border-white/5 text-alphabag-subtext hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-32 flex flex-col items-center">
                    <Loader2 size={40} className="animate-spin text-alphabag-yellow mb-6 shadow-glow-yellow/50 rounded-full" />
                    <p className="text-xs font-bold uppercase tracking-widest text-alphabag-subtext animate-pulse">Decrypting Alpha Stream...</p>
                </div>
            ) : signals.length === 0 ? (
                <div className="text-center py-32 glass-panel rounded-3xl mx-2">
                    <Target size={48} className="mx-auto text-alphabag-subtext mb-6 opacity-30" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Active Intelligence</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-alphabag-subtext">The Alpha stream is currently silent. Stand by for targets.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {signals.filter(s => activeCategory === 'ALL' || s.category === activeCategory).map((signal, index) => {
                        const isMasked = signal.entry === '***';
                        
                        // Theme definitions based on category
                        const theme = signal.category === 'DEGEN' 
                            ? { color: 'purple-500', bg: 'purple-500/10', border: 'purple-500/20', icon: <Rocket size={20} /> }
                            : signal.category === 'LONGTERM'
                                ? { color: 'blue-500', bg: 'blue-500/10', border: 'blue-500/20', icon: <Layers size={20} /> }
                                : { color: 'alphabag-yellow', bg: 'alphabag-yellow/10', border: 'alphabag-yellow/20', icon: <Gift size={20} /> };

                        return (
                            <div 
                                key={signal.id} 
                                className={`glass-panel p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 border border-${theme.border} hover:border-${theme.color}/40`}
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Background Ambient Glow */}
                                <div className={`absolute -top-32 -right-32 w-64 h-64 bg-${theme.bg} rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000`}></div>
                                
                                {/* Header Section */}
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-${theme.border} bg-[#0c0c0c] text-${theme.color} shadow-lg shadow-${theme.bg}`}>
                                            {theme.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black text-white tracking-tight leading-none">{signal.pair}</h3>
                                                {signal.status === 'HIT' && (
                                                    <span className="text-[8px] px-2 py-0.5 rounded border border-green-500 text-green-500 font-bold uppercase tracking-widest">Target Hit</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-[0.2em] bg-${theme.bg} text-${theme.color}`}>
                                                    {signal.category}
                                                </span>
                                                <span className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest flex items-center">
                                                    <Clock size={10} className="mr-1 opacity-70" /> {signal.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action button */}
                                    <button 
                                        onClick={() => copyToClipboard(isMasked ? '***' : `${signal.pair} details`)}
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-alphabag-subtext hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                {/* Narrative Section */}
                                <div className="mb-6 relative z-10">
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                                        <Target size={12} /> Strategic Thesis
                                    </p>
                                    <div className="relative">
                                        <p className={`text-sm text-zinc-300 font-medium leading-[1.6] ${isMasked ? 'blur-sm select-none opacity-50' : ''}`}>
                                            {signal.narrative}
                                        </p>
                                        {isMasked && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] text-white uppercase border border-white/10 shadow-xl flex items-center gap-2">
                                                    <Lock size={12} className="text-alphabag-yellow" /> Classified Intel
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics Matrix */}
                                <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col justify-center relative overflow-hidden group/metric">
                                        <span className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest mb-1.5">Entry Zone</span>
                                        <span className={`font-mono text-sm font-bold ${isMasked ? 'text-zinc-600 blur-[2px]' : 'text-white'}`}>{signal.entry}</span>
                                        {isMasked && <Lock size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700" />}
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col justify-center relative overflow-hidden group/metric">
                                        <span className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest mb-1.5">Exit Target</span>
                                        <div className="flex flex-wrap gap-1">
                                            {signal.targets?.map((t, i) => (
                                                <span key={i} className={`font-mono text-sm font-bold ${isMasked ? 'text-zinc-600 blur-[2px]' : `text-${theme.color}`}`}>{t}</span>
                                            ))}
                                        </div>
                                        {isMasked && <Lock size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700" />}
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col justify-center relative overflow-hidden group/metric">
                                        <span className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest mb-1.5">Stop Loss</span>
                                        <span className={`font-mono text-sm font-bold ${isMasked ? 'text-zinc-600 blur-[2px]' : 'text-red-500'}`}>{signal.stopLoss}</span>
                                        {isMasked && <Lock size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700" />}
                                    </div>
                                </div>

                                {/* Footer Data */}
                                {(signal.contractAddress || signal.socialLinks) && (
                                    <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                                        {signal.contractAddress && (
                                            <div className="flex gap-2 items-center flex-1 max-w-[60%]">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">CA:</span>
                                                <code className={`text-[10px] font-mono truncate px-2 py-1 rounded bg-[#111] border border-white/10 ${isMasked ? 'text-zinc-600 blur-[2px]' : 'text-white'}`}>
                                                    {signal.contractAddress}
                                                </code>
                                            </div>
                                        )}
                                        
                                        {!isMasked && signal.socialLinks && (
                                            <div className="flex gap-2">
                                                {signal.socialLinks.twitter && (
                                                    <a href={signal.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20"><ExternalLink size={12} /></a>
                                                )}
                                                {signal.socialLinks.telegram && (
                                                    <a href={signal.socialLinks.telegram} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"><MessageSquare size={12} /></a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

