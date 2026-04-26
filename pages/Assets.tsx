import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPortfolioHistory } from '../services/mockData';
import { PortfolioItem, PortfolioHistoryPoint } from '../types';
import { Button } from '../components/ui/Button';
import { Eye, ChevronUp, ChevronDown, Download, PieChart as PieChartIcon, Plus } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Sparkline } from '../components/ui/Sparkline';
import { UpgradeCmd } from '../components/UpgradeCmd';
import { HistoryPage } from './History';
import { AddTransactionModal } from '../components/AddTransactionModal';

const COLORS = [
    '#FCD535', // Yellow
    '#0ECB81', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F6465D', // Red
    '#848E9C', // Gray
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#D946EF', // Fuchsia
    '#06B6D4'  // Cyan
];

interface AssetsProps {
    onSync?: () => void;
    isSyncing?: boolean;
}

export const Assets: React.FC<AssetsProps> = () => {
    const { portfolioItems, hideSmallBalances, toggleHideSmallBalances, isSyncing } = useWallet();
    const navigate = useNavigate();

    // Sort items by value descending logic moved here or ensuring parent sorts it?
    // Parent context might filter but sorting is UI concern.
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | '90D' | 'ALL'>('ALL');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Context method
    const { addManualTransaction } = useWallet() as any; // Cast as any because the types file might not be fully synced in this runtime view

    const sortedItems = [...portfolioItems].sort((a, b) => b.value - a.value);

    // Apply Filters
    const filteredItems = hideSmallBalances
        ? sortedItems.filter(item => item.value >= 1)
        : sortedItems;

    const totalValue = portfolioItems.reduce((acc, item) => acc + item.value, 0);
    const totalPnL = portfolioItems.reduce((acc, item) => acc + item.pnl, 0);
    const totalCost = portfolioItems.reduce((acc, item) => acc + (item.amount * (item.avgBuyPrice || item.currentPrice)), 0);
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const totalPnL24h = portfolioItems.reduce((acc, item) => acc + (item.value * (item.priceChange24h / 100)), 0);
    const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;

    const sortedByPnL = [...portfolioItems].filter(item => item.amount > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
    const bestPerformer = sortedByPnL.length > 0 && sortedByPnL[0].pnlPercent > 0 ? sortedByPnL[0] : null;
    const worstPerformer = sortedByPnL.length > 0 && sortedByPnL[sortedByPnL.length - 1].pnlPercent < 0 ? sortedByPnL[sortedByPnL.length - 1] : null;

    useEffect(() => {
        setLoadingHistory(true);
        fetchPortfolioHistory(timeframe === '90D' ? 'ALL' : timeframe as any).then((historyData) => {
            setHistory(historyData);
            setLoadingHistory(false);
        });
    }, [timeframe]);

    return (
        <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto text-alphabag-text">

            {/* 1. Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-alphabag-border gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-alphabag-yellow to-orange-500 flex items-center justify-center text-black font-black shadow-lg">DA</div>
                        <h1 className="text-2xl font-bold text-zinc-50 uppercase tracking-tight">DEX HUB</h1>
                    </div>

                    <div className="flex items-baseline gap-3 mt-4">
                        <h2 className="text-4xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-3 tabular-data drop-shadow-md">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <Eye size={20} className="text-alphabag-muted cursor-pointer hover:text-zinc-50 transition-colors" />
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 mt-2 font-bold text-sm">
                        <span className={`tabular-data ${totalPnL24h >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                            {totalPnL24h >= 0 ? '+' : ''}${Math.abs(totalPnL24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`flex items-center tabular-data gap-1 bg-white/5 px-2 py-0.5 rounded-lg ${totalPnLPercent24h >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                            {totalPnLPercent24h >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {Math.abs(totalPnLPercent24h).toFixed(2)}% (24h)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-alphabag-subtext">Show charts</span>
                        <div
                            className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${showCharts ? 'bg-alphabag-yellow' : 'bg-alphabag-gray'}`}
                            onClick={() => setShowCharts(!showCharts)}
                        >
                            <div className={`w-3.5 h-3.5 bg-alphabag-text rounded-full shadow-sm transition-transform ${showCharts ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <Button onClick={() => navigate('/settings')} className="bg-alphabag-yellow text-alphabag-black hover:bg-alphabag-yellowHover border-none rounded-lg px-4 py-2 font-semibold">
                        <Plus size={16} className="mr-2" /> Setup Wallet
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Symbol,Name,Amount,Value,PnL\n" +
                                history.map(h => `${new Date(h.timestamp).toLocaleDateString()},${h.value}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "alphabag_dex_hub.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-alphabag-gray text-alphabag-text border-alphabag-gray hover:bg-alphabag-gray/80 rounded-lg px-4 py-2"
                    >
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                    <Button variant="secondary" className="bg-alphabag-gray text-alphabag-text border-alphabag-gray hover:bg-alphabag-gray/80 rounded-lg p-2">
                        •••
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-6 border-b border-alphabag-gray pb-4">
                <span onClick={() => setActiveTab('overview')} className={`font-semibold pb-4 -mb-4 px-1 cursor-pointer transition-colors ${activeTab === 'overview' ? 'text-alphabag-text border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}>Overview</span>
                <span onClick={() => setActiveTab('transactions')} className={`font-semibold pb-4 -mb-4 px-1 cursor-pointer transition-colors ${activeTab === 'transactions' ? 'text-alphabag-text border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}>Transaction</span>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* 2. Metrics 4-Card Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-panel p-8 hover:bg-white/5 transition-all duration-200">
                            <div className="flex items-center text-alphabag-muted text-[10px] font-bold mb-2 gap-1 uppercase tracking-wider">
                                All-time profit <Eye size={12} />
                            </div>
                            <div className={`text-2xl font-extrabold mb-1.5 tabular-data ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-bold flex items-center tabular-data gap-1 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {totalPnL >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {Math.abs(totalPnLPercent).toFixed(2)}%
                            </div>
                        </div>

                        <div className="glass-panel p-8 hover:bg-white/5 transition-all duration-200">
                            <div className="flex items-center text-alphabag-muted text-[10px] font-bold mb-2 gap-1 uppercase tracking-wider">
                                Cost Basis <Eye size={12} />
                            </div>
                            <div className="text-2xl font-extrabold text-zinc-50 tabular-data">
                                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div className="glass-panel p-8 hover:bg-white/5 transition-all duration-200">
                            <div className="text-alphabag-muted text-[10px] font-bold mb-2 uppercase tracking-wider">Best Performer</div>
                            {bestPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={bestPerformer.image} alt={bestPerformer.symbol} className="w-5 h-5 rounded-full shadow-md" />
                                        <span className="text-lg font-bold text-zinc-50 leading-none">{bestPerformer.symbol}</span>
                                    </div>
                                    <div className="text-emerald-500 text-xs font-bold flex items-center gap-1 tabular-data">
                                        +${bestPerformer.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <span className="flex items-center ml-1"><ChevronUp size={12} /> {bestPerformer.pnlPercent.toFixed(2)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-alphabag-muted text-sm mt-2">No data</div>
                            )}
                        </div>

                        <div className="glass-panel p-8 hover:bg-white/5 transition-all duration-200">
                            <div className="text-alphabag-muted text-[10px] font-bold mb-2 uppercase tracking-wider">Worst Performer</div>
                            {worstPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={worstPerformer.image} alt={worstPerformer.symbol} className="w-5 h-5 rounded-full shadow-md" />
                                        <span className="text-lg font-bold text-zinc-50 leading-none">{worstPerformer.symbol}</span>
                                    </div>
                                    <div className="text-rose-500 text-xs font-bold flex items-center gap-1 tabular-data">
                                        {worstPerformer.pnl < 0 ? '-' : ''}${Math.abs(worstPerformer.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <span className="flex items-center ml-1"><ChevronDown size={12} /> {Math.abs(worstPerformer.pnlPercent).toFixed(2)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-alphabag-muted text-sm mt-2">No data</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Charts Section */}
                    {showCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* History Chart */}
                            <div className="lg:col-span-2 bg-alphabag-dark border border-alphabag-gray rounded-xl p-5">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-alphabag-text">History</h3>
                                        <Eye size={14} className="text-alphabag-subtext" />
                                    </div>
                                    <div className="flex space-x-1 bg-alphabag-gray p-1 rounded-lg">
                                        {['24H', '7D', '30D', '90D', 'ALL'].map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf as any)}
                                                className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-md transition-all ${timeframe === tf ? 'bg-[#334155] text-alphabag-text shadow-sm' : 'text-alphabag-subtext hover:text-alphabag-text'}`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-[250px] w-full">
                                    {loadingHistory || isSyncing ? (
                                        <div className="h-full w-full flex items-center justify-center text-alphabag-subtext">
                                            <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
                                                <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis domain={['auto', 'auto']} orientation="right" tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#181A20', borderColor: '#2B3139', color: '#EAECEF', borderRadius: '8px' }}
                                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                                    itemStyle={{ color: '#0ECB81', fontWeight: 'bold' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#0ECB81" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Allocation Donut */}
                            <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 flex flex-col justify-between">
                                <h3 className="font-semibold text-alphabag-text mb-4">Allocation</h3>
                                <div className="flex-1 flex flex-row items-center justify-center gap-6">

                                    <div className="w-1/2 h-[180px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={filteredItems} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                                    {filteredItems.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PieChartIcon size={24} className="text-alphabag-subtext" />
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-center space-y-3">
                                        {filteredItems.slice(0, 6).map((item, index) => {
                                            const filteredTotalValue = filteredItems.reduce((acc, curr) => acc + curr.value, 0);
                                            return (
                                                <div key={item.coinId} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <span className="text-alphabag-text font-medium truncate">{item.name}</span>
                                                    </div>
                                                    <span className="text-alphabag-text font-semibold tabular-data">
                                                        {filteredTotalValue > 0 ? ((item.value / filteredTotalValue) * 100).toFixed(2) : '0.00'}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Assets Table Area */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-alphabag-text">Assets</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleHideSmallBalances}
                                className="text-xs text-alphabag-subtext hover:text-alphabag-text"
                            >
                                {hideSmallBalances ? 'Show small balances' : 'Hide small balances (<$1)'}
                            </Button>
                        </div>

                        <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl rounded-bl-xl rounded-br-xl bg-zinc-900 border border-white/5 shadow-2xl shadow-black/50">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-alphabag-muted text-xs border-b border-white/5 sticky top-0 bg-black/60 backdrop-blur-md z-10 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-6 px-6 font-semibold w-1/4">Name ↕</th>
                                        <th className="py-6 px-6 font-semibold text-right">Price ↕</th>
                                        <th className="py-6 px-6 font-semibold text-right">24h% ↕</th>
                                        <th className="py-6 px-6 font-semibold text-right w-32">7D Trend</th>
                                        <th className="py-6 px-6 font-semibold text-right">Holdings ↕</th>
                                        <th className="py-6 px-6 font-semibold text-right">Avg. Buy Price ↕</th>
                                        <th className="py-6 px-6 font-semibold text-right">Profit/Loss ↕</th>
                                        <th className="py-6 px-6 font-semibold text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm font-medium">
                                    {filteredItems.length === 0 && !isSyncing ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-alphabag-muted">
                                                No assets found. Ensure your wallet connections are properly synced.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const holdsPositive = item.pnl >= 0;
                                            const dayPnlPositive = item.priceChange24h >= 0;

                                            // Generate a deterministic but randomized array for the sparkline based on the coinId
                                            const fakeSparklineData = Array.from({ length: 20 }, (_, i) => {
                                                const mod = (item.coinId.charCodeAt(0) + i) % 10;
                                                return (dayPnlPositive ? 10 + mod + (i * 0.5) : 20 - mod - (i * 0.5));
                                            });

                                            return (
                                                <tr key={item.coinId} className="hover:bg-white/5 transition-all duration-200 active:scale-[0.98] group cursor-pointer border-b border-white/5 last:border-0 relative">
                                                    <td className="py-6 px-6 relative">
                                                        {/* Subtle active indicator stripe */}
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-alphabag-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="flex items-center gap-3">
                                                            <img src={item.image} alt={item.name} className="w-8 h-8 rounded-full shadow-lg" />
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-50 font-bold text-sm transition-colors group-hover:text-alphabag-yellow">{item.name}</span>
                                                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{item.symbol}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-right text-zinc-50 tabular-data text-sm">
                                                        ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                    </td>
                                                    <td className={`py-6 px-6 text-right tabular-data text-sm font-bold ${dayPnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            {dayPnlPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            {Math.abs(item.priceChange24h).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-right w-32">
                                                        <div className="h-8 w-24 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <Sparkline data={fakeSparklineData} color={dayPnlPositive ? '#10b981' : '#f43f5e'} />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-right">
                                                        <div className="text-zinc-50 font-bold tabular-data text-sm">
                                                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-zinc-400 text-[10px] font-bold tabular-data mt-0.5">
                                                            {item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-right text-zinc-50 tabular-data text-sm">
                                                        ${(item.avgBuyPrice || item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                    </td>
                                                    <td className="py-6 px-6 text-right tabular-data">
                                                        <div className={`font-bold text-sm ${holdsPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {holdsPositive ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                                        </div>
                                                        <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${holdsPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {holdsPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {Math.abs(item.pnlPercent).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center justify-center gap-2 text-zinc-400">
                                                            <button className="p-1.5 hover:text-zinc-50 hover:bg-white/10 transition-colors rounded-lg"><Plus size={14} /></button>
                                                            <button className="p-1.5 hover:text-zinc-50 hover:bg-white/10 transition-colors rounded-lg">•••</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="pt-4">
                    <HistoryPage />
                </div>
            )}

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={addManualTransaction}
            />
        </div>
    );
};
