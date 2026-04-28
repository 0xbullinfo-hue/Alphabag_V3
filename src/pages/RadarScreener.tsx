import React, { useState } from 'react';
import { TrendingUp, Users, MessageSquare, Share2, Filter, Search, ArrowUpRight, Flame, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../components/hooks/useDebounce';

interface ProjectHeat {
    id: string;
    name: string;
    symbol: string;
    heatIndex: number;
    engagement24h: number;
    mentions24h: number;
    holders: number;
    priceChange: number;
    isVerified: boolean;
}

const MOCK_HEAT_DATA: ProjectHeat[] = [
    { id: '1', name: 'AlphaBAG', symbol: 'BAG', heatIndex: 98, engagement24h: 12500, mentions24h: 450, holders: 2500, priceChange: 12.5, isVerified: true },
    { id: '2', name: 'Binance Cat', symbol: 'BCAT', heatIndex: 85, engagement24h: 8200, mentions24h: 310, holders: 12000, priceChange: -2.4, isVerified: false },
    { id: '3', name: 'Solana Killer', symbol: 'SOLK', heatIndex: 72, engagement24h: 5400, mentions24h: 120, holders: 850, priceChange: 45.2, isVerified: false },
    { id: '4', name: 'Degen DAO', symbol: 'DEGEN', heatIndex: 68, engagement24h: 4100, mentions24h: 95, holders: 3200, priceChange: 5.1, isVerified: true },
    { id: '5', name: 'Moon Mission', symbol: 'MOON', heatIndex: 45, engagement24h: 1200, mentions24h: 40, holders: 500, priceChange: -15.8, isVerified: false },
];

export const RadarScreener: React.FC = () => {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const filtered = MOCK_HEAT_DATA.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        p.symbol.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center flex-wrap gap-3">
                        Radar <span className="text-alphabag-yellow">Screener</span>
                        <div className="px-2 py-0.5 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded text-[10px] text-alphabag-yellow font-black uppercase tracking-widest not-italic">Organic Heat</div>
                        <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-black uppercase tracking-widest flex items-center gap-1 mt-2 md:mt-0 not-italic">
                            <AlertTriangle size={10} /> DEMO DATA
                        </div>
                    </h1>
                    <p className="text-alphabag-subtext text-sm mt-1">Real-time community engagement ranking. No paid boosts allowed.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-muted" />
                        <input 
                            type="text"
                            placeholder="Search Projects..."
                            className="bg-alphabag-darkgray border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-alphabag-yellow/50 outline-none w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="border-white/5 text-alphabag-subtext gap-2">
                        <Filter size={14} /> Filter
                    </Button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border-t-alphabag-yellow/30 bg-alphabag-darkgray/50 rounded-2xl shadow-glass">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted"># Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted">Project</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-center">Heat Index</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Engagement</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Mentions</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">24h Change</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filtered.map((project, index) => (
                                <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5 font-mono text-sm text-alphabag-muted">
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-alphabag-black border border-white/5 rounded-lg flex items-center justify-center font-black text-alphabag-yellow relative overflow-hidden">
                                                {project.symbol[0]}
                                                {index === 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-alphabag-yellow"></div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-white text-sm uppercase tracking-tight">{project.name}</span>
                                                    {project.isVerified && <div className="w-3 h-3 bg-alphabag-green rounded-full flex items-center justify-center"><CheckCircle size={8} className="text-black" /></div>}
                                                </div>
                                                <div className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest">{project.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Flame size={14} className={index < 2 ? 'text-orange-500' : 'text-alphabag-muted'} />
                                                <span className={`font-black text-lg tabular-nums ${index < 2 ? 'text-white' : 'text-alphabag-subtext'}`}>{project.heatIndex}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${index < 2 ? 'bg-alphabag-yellow shadow-[0_0_10px_rgba(252,213,53,0.5)]' : 'bg-alphabag-muted'}`}
                                                    style={{ width: `${project.heatIndex}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-sm tabular-nums text-white">
                                        {project.engagement24h.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-sm tabular-nums text-white">
                                        {project.mentions24h}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-sm tabular-nums">
                                        <span className={project.priceChange >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}>
                                            {project.priceChange >= 0 ? '+' : ''}{project.priceChange}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 text-alphabag-muted hover:text-alphabag-yellow transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100">
                                            <ArrowUpRight size={16} />
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

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
