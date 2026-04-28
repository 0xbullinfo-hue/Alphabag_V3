import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPortfolioHistory } from '../services/mockData';
import { PortfolioHistoryPoint } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Settings, Briefcase, Eye, ChevronUp, ChevronDown, Download, PieChart as PieChartIcon, Layers } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useWallet } from '../context/WalletContext';
import { Sparkline } from '../components/ui/Sparkline';
import { HistoryPage } from './History';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const Portfolio: React.FC = () => {
    const { portfolioItems, trackedWallets, isSyncing, getLimits, hideSmallBalances, toggleHideSmallBalances } = useWallet();
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | '90D' | 'ALL'>('ALL');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    const navigate = useNavigate();

    const limits = getLimits();
    const activeWallets = trackedWallets.filter(w => w.type === 'PORTFOLIO');

    // Apply Filters
    const filteredItems = hideSmallBalances
        ? portfolioItems.filter(item => item.value >= 1)
        : portfolioItems;

    // Derived Metrics
    const totalValue = portfolioItems.reduce((acc, item) => acc + item.value, 0);
    const totalPnL = portfolioItems.reduce((acc, item) => acc + item.pnl, 0);
    const totalCost = portfolioItems.reduce((acc, item) => acc + (item.amount * (item.avgBuyPrice || item.currentPrice)), 0);
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // 24h metrics (Mocked based on current price change for UI demonstration)
    const totalPnL24h = portfolioItems.reduce((acc, item) => acc + (item.value * (item.priceChange24h / 100)), 0);
    const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;

    // Find Best/Worst Performers
    const sortedByPnL = [...portfolioItems].filter(item => item.amount > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
    const bestPerformer = sortedByPnL.length > 0 && sortedByPnL[0].pnlPercent > 0 ? sortedByPnL[0] : null;
    const worstPerformer = sortedByPnL.length > 0 && sortedByPnL[sortedByPnL.length - 1].pnlPercent < 0 ? sortedByPnL[sortedByPnL.length - 1] : null;

    useEffect(() => {
        if (activeWallets.length > 0) {
            setLoadingHistory(true);
            fetchPortfolioHistory(timeframe === '90D' ? 'ALL' : timeframe as any).then((historyData) => {
                setHistory(historyData);
                setLoadingHistory(false);
            });
        }
    }, [activeWallets.length, timeframe]);

    const handleManageConnections = () => {
        navigate('/settings');
    };

    if (activeWallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-8 max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-alphabag-gray/50 rounded-3xl flex items-center justify-center text-alphabag-yellow animate-pulse-slow shadow-inner border border-alphabag-gray">
                    <Briefcase size={48} fill="currentColor" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-alphabag-text uppercase tracking-tighter">Initialize Tracking Hub</h1>
                    <p className="text-alphabag-subtext font-medium leading-relaxed">
                        AlphaBAG professional hub synchronizes your global holdings across 100+ chains via read-only wallet addresses. Add a wallet to start monitoring your performance.
                    </p>
                </div>

                <div className="w-full">
                    <Button size="lg" className="px-10 py-5 font-black uppercase tracking-widest shadow-2xl bg-alphabag-yellow text-alphabag-black hover:bg-alphabag-yellowHover" onClick={handleManageConnections}>
                        <Plus className="mr-2" size={20} /> Add Tracked Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto text-alphabag-text">

            {/* 1. Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-alphabag-gray gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-alphabag-yellow to-alphabag-yellowHover flex items-center justify-center text-alphabag-black font-bold">MP</div>
                        <h1 className="text-xl font-semibold text-alphabag-text">My Main Portfolio</h1>
                        <span className="text-[10px] bg-alphabag-yellow/20 text-alphabag-yellow px-2 py-0.5 rounded-full font-bold uppercase">Default</span>
                    </div>

                    <div className="flex items-baseline gap-3 mt-4 overflow-hidden">
                        <h2 className="text-3xl md:text-5xl font-bold text-alphabag-text tracking-tighter flex items-center gap-2 truncate" title={`$${totalValue.toLocaleString()}`}>
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <Eye size={16} className="text-alphabag-subtext cursor-pointer hover:text-alphabag-text transition-colors shrink-0" />
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1 font-medium text-sm">
                        <span className={`${totalPnL24h >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                            {totalPnL24h >= 0 ? '+' : ''}${Math.abs(totalPnL24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`flex items-center ${totalPnLPercent24h >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
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

                    <Button onClick={handleManageConnections} className="bg-alphabag-yellow text-alphabag-black hover:bg-alphabag-yellowHover border-none rounded-lg px-4 py-2 font-semibold">
                        Manage Connections
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Date,Portfolio Value\n" +
                                history.map(h => `${new Date(h.timestamp).toLocaleDateString()},${h.value}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "alphabag_portfolio_history.csv");
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
                        {/* All-time profit */}
                        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 hover:bg-alphabag-gray/50 transition-colors overflow-hidden">
                            <div className="flex items-center text-alphabag-subtext text-xs font-semibold mb-2 gap-1 uppercase tracking-wider">
                                All-time profit <Eye size={12} />
                            </div>
                            <div className={`text-xl xl:text-2xl font-bold mb-1 tracking-tighter truncate ${totalPnL >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`} title={`$${totalPnL.toLocaleString()}`}>
                                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-bold flex items-center ${totalPnL >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                {totalPnL >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {Math.abs(totalPnLPercent).toFixed(2)}%
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 hover:bg-alphabag-gray/50 transition-colors overflow-hidden">
                            <div className="flex items-center justify-between text-alphabag-subtext text-xs font-semibold mb-2 uppercase tracking-wider">
                                <span>Assets</span>
                                <Layers size={14} className="text-alphabag-subtext" />
                            </div>
                            <div className="text-xl xl:text-2xl font-bold text-alphabag-text tracking-tighter truncate">
                                {portfolioItems.length} Tokens
                            </div>
                            <div className="text-[10px] text-alphabag-subtext mt-1 font-medium">Unique assets on chain</div>
                        </div>

                        {/* Best Performer */}
                        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 hover:bg-alphabag-gray/50 transition-colors overflow-hidden">
                            <div className="text-alphabag-subtext text-xs font-semibold mb-2 uppercase tracking-wider">Best Performer</div>
                            {bestPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1 overflow-hidden">
                                        <img src={bestPerformer.image} alt={bestPerformer.symbol} className="w-5 h-5 rounded-full shrink-0" />
                                        <span className="text-lg font-bold text-alphabag-text leading-none truncate">{bestPerformer.symbol}</span>
                                    </div>
                                    <div className="text-alphabag-green text-xs font-bold flex items-center gap-1 truncate">
                                        +${bestPerformer.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        <span className="flex items-center"><ChevronUp size={14} /> {bestPerformer.pnlPercent.toFixed(1)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-alphabag-subtext text-sm mt-2">No data</div>
                            )}
                        </div>

                        {/* Worst Performer */}
                        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 hover:bg-alphabag-gray/50 transition-colors overflow-hidden">
                            <div className="text-alphabag-subtext text-xs font-semibold mb-2 uppercase tracking-wider">Worst Performer</div>
                            {worstPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1 overflow-hidden">
                                        <img src={worstPerformer.image} alt={worstPerformer.symbol} className="w-5 h-5 rounded-full shrink-0" />
                                        <span className="text-lg font-bold text-alphabag-text leading-none truncate">{worstPerformer.symbol}</span>
                                    </div>
                                    <div className="text-alphabag-red text-xs font-bold flex items-center gap-1 truncate">
                                        {worstPerformer.pnl < 0 ? '-' : ''}${Math.abs(worstPerformer.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        <span className="flex items-center"><ChevronDown size={14} /> {Math.abs(worstPerformer.pnlPercent).toFixed(1)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-alphabag-subtext text-sm mt-2">No data</div>
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
                                                <ReTooltip
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
                                            <RePieChart>
                                                <Pie data={filteredItems} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                                    {filteredItems.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </RePieChart>
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

                    {/* 4. Assets Table Area */}
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

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-alphabag-subtext text-xs border-b-2 border-alphabag-gray">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold w-1/4">Name ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">Price ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">24h% ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right w-40">7D Trend</th>
                                        <th className="py-3 px-4 font-semibold text-right">Holdings ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">Avg. Buy Price ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">Profit/Loss ↕</th>
                                        <th className="py-3 px-4 font-semibold text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray text-sm font-medium">
                                    {filteredItems.length === 0 && !isSyncing ? (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-alphabag-subtext">
                                                No assets found. Add a transaction or tracked wallet.
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
                                                <tr key={item.coinId} className="hover:bg-alphabag-gray/30 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full" />
                                                            <span className="text-alphabag-text font-bold">{item.name}</span>
                                                            <span className="text-alphabag-subtext text-xs font-semibold">{item.symbol}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-alphabag-text tabular-data">
                                                        <div className="tracking-tighter truncate" title={`$${item.currentPrice.toLocaleString()}`}>
                                                            ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </div>
                                                    </td>
                                                    <td className={`py-4 px-4 text-right tabular-data text-xs font-bold ${dayPnlPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                        <div className="flex items-center justify-end gap-1 tracking-tighter truncate">
                                                            {dayPnlPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            {Math.abs(item.priceChange24h).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right w-40">
                                                        <div className="h-8 w-24 ml-auto">
                                                            <Sparkline data={fakeSparklineData} color={dayPnlPositive ? '#0ECB81' : '#F6465D'} />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="text-alphabag-text font-bold tabular-data tracking-tighter truncate" title={`$${item.value.toLocaleString()}`}>
                                                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-alphabag-subtext text-xs font-semibold tabular-data mt-0.5 tracking-tighter truncate" title={`${item.amount.toLocaleString()} ${item.symbol}`}>
                                                            {item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-alphabag-text tabular-data">
                                                        <div className="tracking-tighter truncate" title={`$${(item.avgBuyPrice || item.currentPrice).toLocaleString()}`}>
                                                            ${(item.avgBuyPrice || item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right tabular-data">
                                                        <div className={`font-bold tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`} title={`$${item.pnl.toLocaleString()}`}>
                                                            {holdsPositive ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                                        </div>
                                                        <div className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                            {holdsPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {Math.abs(item.pnlPercent).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-center gap-2 text-alphabag-subtext">
                                                            <button className="p-1 hover:text-alphabag-text hover:bg-alphabag-gray rounded"><Plus size={16} /></button>
                                                            <button className="p-1 hover:text-alphabag-text hover:bg-alphabag-gray rounded">•••</button>
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
        </div>
    );
};
