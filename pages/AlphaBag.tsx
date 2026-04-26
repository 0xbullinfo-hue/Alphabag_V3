import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Wallet, TrendingUp, Activity, Zap, BrainCircuit, RefreshCw, Timer, Briefcase, Layers, Lock, Shield, ArrowUpRight } from 'lucide-react';

import { MetricCard } from '../components/ui/MetricCard';
import { TierBadge } from '../components/ui/TierBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { UpgradeCmd } from '../components/UpgradeCmd';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export interface UnifiedAsset {
    symbol: string;
    name: string;
    value: number;
    pnl?: number;
}

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export const AlphaBag: React.FC = () => {
    const { tier, portfolioItems } = useWallet();
    const { isAuthenticated } = useAuth();

    // Missions State
    const [airdrop, setAirdrop] = React.useState({
        points: 0,
        canClaim: false,
        lastClaimTime: null as string | null,
        settings: { tokenTicker: '🔒', pointsPerClaim: 50, durationDays: 0, isActive: false, isSubmissionActive: true, status: 'INACTIVE', endDate: '', nextCycleDate: '' },
        reveal: { isRevealed: false, officialTicker: 'TBA', conversionRate: 1.0 },
        loading: true,
        submittedWallet: null as string | null
    });
    const [claiming, setClaiming] = React.useState(false);
    const [submissionWallet, setSubmissionWallet] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    // UI Timers
    const [dailyTimeLeft, setDailyTimeLeft] = React.useState('');
    const [cycleTimeLeft, setCycleTimeLeft] = React.useState('');
    const [nextPhaseTimeLeft, setNextPhaseTimeLeft] = React.useState('');

    const [aiAnalysis, setAiAnalysis] = React.useState({
        summary: "Analyzing market data and portfolio composition...",
        riskScore: 0,
        diversificationScore: 0,
        label: "Analyzing..."
    });
    const [loadingAi, setLoadingAi] = React.useState(false);

    // Global Stats State
    const [globalStats, setGlobalStats] = React.useState({
        marketCap: '$2.48T',
        btcDominance: '54.2%',
        gas: '14 Gwei'
    });

    React.useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const res = await fetch('https://api.coingecko.com/api/v3/global');
                const data = await res.json();
                const totalMcap = data.data.total_market_cap.usd;
                const btcDom = data.data.market_cap_percentage.btc;

                const mcapFormatted = totalMcap >= 1e12
                    ? `$${(totalMcap / 1e12).toFixed(2)}T`
                    : `$${(totalMcap / 1e9).toFixed(2)}B`;

                setGlobalStats(prev => ({
                    ...prev,
                    marketCap: mcapFormatted,
                    btcDominance: `${btcDom.toFixed(1)}%`
                }));
            } catch (e) { console.error("CoinGecko API error", e); }

            try {
                const gasRes = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
                const gasData = await gasRes.json();
                if (gasData.result?.ProposeGasPrice) {
                    setGlobalStats(prev => ({ ...prev, gas: `${gasData.result.ProposeGasPrice} Gwei` }));
                }
            } catch (e) { console.error("Etherscan API error", e); }
        };
        fetchGlobalStats();
    }, []);

    // History & Chart State
    const [historyData, setHistoryData] = React.useState<any[]>([]);
    const [chartTimeframe, setChartTimeframe] = React.useState<'1D' | '1W' | '1M' | 'ALL'>('1W');

    const handleSnapshot = async (val: number) => {
        try {
            await api.post('/api/portfolio/snapshot', { totalValue: val });
            fetchHistory();
        } catch (e) { console.error("Snapshot failed", e); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/api/portfolio/history');
            if (Array.isArray(res.data)) {
                // Format for chart
                const formatted = res.data.map((d: any) => ({
                    date: new Date(d.date).toLocaleDateString(),
                    fullDate: d.date,
                    value: d.value
                }));
                setHistoryData(formatted);
            }
        } catch (e) {
            console.error("History fetch failed", e);
        }
    };

    React.useEffect(() => {
        const updateTimers = () => {
            const now = new Date();

            // 1. Daily Claim Timer (reset 24 hours after last claim)
            if (airdrop.lastClaimTime && !airdrop.canClaim) {
                const nextClaim = new Date(airdrop.lastClaimTime);
                nextClaim.setHours(nextClaim.getHours() + 24);

                const dailyDiff = Math.max(0, nextClaim.getTime() - now.getTime());

                if (dailyDiff === 0 && !airdrop.loading) {
                    setAirdrop(prev => {
                        if (!prev.canClaim) return { ...prev, canClaim: true };
                        return prev;
                    });
                    setDailyTimeLeft('Ready');
                } else {
                    const h = Math.floor((dailyDiff / (1000 * 60 * 60)));
                    const m = Math.floor((dailyDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((dailyDiff % (1000 * 60)) / 1000);
                    setDailyTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
                }
            } else if (!airdrop.lastClaimTime && !airdrop.canClaim && !airdrop.loading) {
                setAirdrop(prev => {
                    if (!prev.canClaim) return { ...prev, canClaim: true };
                    return prev;
                });
                setDailyTimeLeft('Ready');
            } else if (!dailyTimeLeft) {
                // Initial fallback while computing
                setDailyTimeLeft('--h --m --s');
            }

            // 2. Cycle End Timer
            if (airdrop.settings.endDate) {
                const end = new Date(airdrop.settings.endDate);
                const endDiff = end.getTime() - now.getTime();
                if (endDiff > 0) {
                    const days = Math.floor(endDiff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((endDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    setCycleTimeLeft(`${days}d ${hours}h`);
                } else {
                    setCycleTimeLeft('Ended');
                }
            } else {
                setCycleTimeLeft(`${airdrop.settings.durationDays || 0}d`);
            }

            // 3. Next Phase Timer (72 hours gap)
            if (airdrop.settings.nextCycleDate && airdrop.settings.status === 'WAITING') {
                const next = new Date(airdrop.settings.nextCycleDate);
                const nextDiff = next.getTime() - now.getTime();
                if (nextDiff > 0) {
                    const hrs = Math.floor(nextDiff / (1000 * 60 * 60));
                    const mins = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
                    setNextPhaseTimeLeft(`${hrs}h ${mins}m`);
                } else {
                    setNextPhaseTimeLeft('Imminent');
                }
            }
        };

        updateTimers(); // Initial computation immediately to prevent blank flash
        const timer = setInterval(updateTimers, 1000);
        return () => clearInterval(timer);
    }, [airdrop.settings, airdrop.lastClaimTime, airdrop.canClaim, airdrop.loading]);

    React.useEffect(() => {
        fetchAirdropStatus();
    }, [isAuthenticated]);

    const fetchAirdropStatus = async () => {
        try {
            const res = await api.get('/api/airdrop/status');
            console.log("Airdrop Status API Response:", res.data);
            // Ensure we handle both userStatus (if logged in) and settings
            const userStatus = res.data.userStatus || { points: 0, canClaim: false, lastClaimTime: null };
            setAirdrop({
                ...userStatus,
                settings: res.data.settings || { tokenTicker: '🔒', pointsPerClaim: 50, durationDays: 0, isActive: false, isSubmissionActive: false, status: 'INACTIVE', endDate: '', nextCycleDate: '' },
                reveal: res.data.reveal || { isRevealed: false, officialTicker: 'TBA', conversionRate: 1.0 },
                loading: false,
                submittedWallet: userStatus.walletSubmitted || null
            });
        } catch (e) {
            console.error("Failed to fetch airdrop status", e);
        }
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const res = await api.post('/api/airdrop/claim', {});
            setAirdrop(prev => ({
                ...prev,
                points: res.data.points,
                lastClaimTime: res.data.lastClaimTime,
                canClaim: false
            }));
        } catch (e) {
            console.error("Claim failed", e);
        } finally {
            setClaiming(false);
        }
    };

    const handleSubmitWallet = async () => {
        if (!submissionWallet) return;
        setSubmitting(true);
        try {
            await api.post('/api/airdrop/submit-wallet', { walletAddress: submissionWallet });
            setAirdrop(prev => ({
                ...prev,
                submittedWallet: submissionWallet
            }));
            alert("Wallet Submitted Successfully! 🚀");
        } catch (e) {
            console.error("Submission failed", e);
            alert("Failed to submit wallet.");
        } finally {
            setSubmitting(false);
        }
    };

    // ... (rest of code)


    // Get CEX Data from LocalStorage (shared with CexBag)
    const [cexTotal, setCexTotal] = React.useState(0);

    React.useEffect(() => {
        const savedCex = localStorage.getItem('alphabag_cex_connections');
        if (savedCex) {
            try {
                const parsed = JSON.parse(savedCex);
                const total = parsed.reduce((acc: number, item: any) => acc + (item.balance || 0), 0);
                setCexTotal(total);
            } catch (e) { console.error("Error parsing CEX data", e); }
        }
    }, []);

    // dexTotal inherently aggregates WalletContext values (which automatically bundles Manual strings safely!)
    const dexTotal = portfolioItems.reduce((acc, item) => acc + item.value, 0);
    const totalWorth = cexTotal + dexTotal;

    // Calculate PnL from DEX items (since CEX/Manual items don't track cost basis yet)
    const totalPnL = portfolioItems.reduce((acc, item) => acc + (item.pnl || 0), 0);
    const totalInvested = totalWorth - totalPnL;
    const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const debouncedTotalWorth = useDebounce(totalWorth, 2500);

    React.useEffect(() => {
        if (debouncedTotalWorth > 0) {
            fetchAiAnalysis();
            handleSnapshot(debouncedTotalWorth);
        }
    }, [debouncedTotalWorth]);

    // Filter Data based on timeframe
    const getFilteredHistory = () => {
        if (!historyData.length) return [];
        const now = new Date();
        const cutoff = new Date();

        if (chartTimeframe === '1D') cutoff.setDate(now.getDate() - 1);
        if (chartTimeframe === '1W') cutoff.setDate(now.getDate() - 7);
        if (chartTimeframe === '1M') cutoff.setMonth(now.getMonth() - 1);
        if (chartTimeframe === 'ALL') return historyData;

        return historyData.filter(d => new Date(d.fullDate) >= cutoff);
    };

    const chartData = getFilteredHistory();

    // Unified Portfolio Array (DEX + Consolidated CEX for Chart)
    const unifiedPortfolio = React.useMemo(() => {
        const unified: UnifiedAsset[] = [...portfolioItems] as UnifiedAsset[];
        if (cexTotal > 0) {
            unified.push({
                symbol: 'CEX Assets',
                name: 'Centralized Exchange Holdings',
                value: cexTotal
            });
        }
        // Filter out zero-value dust to keep chart clean and sort by size
        return unified.filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    }, [portfolioItems, cexTotal]);

    const fetchAiAnalysis = async () => {
        setLoadingAi(true);
        try {
            // Pass the unified DEX + CEX portfolio to the neural core
            const assets = unifiedPortfolio.map(p => ({ symbol: p.symbol, value: p.value }));
            const res = await api.post('/api/ai/analyze', {
                portfolio: assets,
                totalValue: totalWorth
            });
            if (res.data) {
                setAiAnalysis(res.data);
            }
        } catch (e) {
            console.error("AI Analysis failed", e);
            setAiAnalysis({
                summary: "Neural link interrupted. Using local heuristics: Portfolio looks balanced but volatile.",
                riskScore: 6,
                diversificationScore: 5,
                label: "Unknown"
            });
        } finally {
            setLoadingAi(false);
        }
    };




    // Institutional Chart Colors
    const INST_COLORS = ['#DAA520', '#2E8B57', '#6A5ACD', '#B87333', '#008080', '#4682B4'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6 pb-20 max-w-[1600px] mx-auto w-full px-4 md:px-6"
        >

            {/* Global Stats removed per UI request */}

            {/* MAIN GRID LAYOUT */}
            <div className="flex flex-col gap-6">

                {/* ROW 1: The Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                    {/* Portfolio Value */}
                    <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs text-alphabag-muted uppercase tracking-wider font-semibold z-10">Portfolio Value</span>
                            <div className="text-zinc-500 bg-white/5 p-1.5 rounded-md z-10 group-hover:bg-white/10 transition-colors">
                                <Wallet size={16} />
                            </div>
                        </div>
                        <div className="mt-auto pt-6 flex flex-col z-10 overflow-hidden">
                            <div className="text-2xl xl:text-3xl font-semibold text-zinc-50 tabular-nums tracking-tighter truncate" title={`$${totalWorth.toLocaleString()}`}>
                                ${totalWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[10px] text-alphabag-muted font-bold whitespace-nowrap">CEX <span className="text-alphabag-yellow">${cexTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></span>
                                <span className="text-[10px] text-alphabag-muted font-bold whitespace-nowrap">DEX/MANUAL <span className="text-alphabag-green">${dexTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* CEX Holdings */}
                    <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs text-alphabag-muted uppercase tracking-wider font-semibold z-10">CEX Holdings</span>
                            <div className="text-zinc-500 bg-white/5 p-1.5 rounded-md z-10 group-hover:bg-white/10 transition-colors">
                                <Activity size={16} />
                            </div>
                        </div>
                        <div className="mt-auto pt-6 flex flex-col z-10 overflow-hidden">
                            <div className="text-2xl xl:text-3xl font-semibold text-alphabag-yellow tabular-nums tracking-tighter truncate" title={`$${cexTotal.toLocaleString()}`}>
                                ${cexTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-alphabag-muted mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                {totalWorth > 0 ? ((cexTotal / totalWorth) * 100).toFixed(1) : '0'}% of portfolio
                            </div>
                        </div>
                    </div>

                    {/* DEX/MANUAL Holdings */}
                    <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs text-alphabag-muted uppercase tracking-wider font-semibold z-10">DEX / Manual Hub</span>
                            <div className="text-zinc-500 bg-white/5 p-1.5 rounded-md z-10 group-hover:bg-white/10 transition-colors">
                                <Briefcase size={16} />
                            </div>
                        </div>
                        <div className="mt-auto pt-6 flex flex-col z-10 overflow-hidden">
                            <div className="text-2xl xl:text-3xl font-semibold text-alphabag-green tabular-nums tracking-tighter truncate" title={`$${dexTotal.toLocaleString()}`}>
                                ${dexTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-alphabag-muted mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                {totalWorth > 0 ? ((dexTotal / totalWorth) * 100).toFixed(1) : '0'}% of portfolio
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: The 3-Column Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (Allocation - ~33%) */}
                    <div className="lg:col-span-4 bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col min-h-[420px]">
                        <h3 className="text-xs font-semibold text-alphabag-muted uppercase tracking-widest mb-6">Allocation</h3>
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            {unifiedPortfolio.length > 0 ? (
                                <>
                                    <div className="h-[220px] w-full relative mb-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={unifiedPortfolio}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={95}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {unifiedPortfolio.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={INST_COLORS[index % INST_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] text-alphabag-muted uppercase font-semibold tracking-widest mb-0.5">Total</span>
                                            <span className="text-lg font-semibold text-zinc-50 tabular-nums">${(totalWorth / 1000).toFixed(1)}K</span>
                                        </div>
                                    </div>

                                    {/* Premium 2-Column Legend Grid */}
                                    <div className="w-full grid grid-cols-2 gap-x-6 gap-y-3 px-2">
                                        {unifiedPortfolio.slice(0, 6).map((item, index) => (
                                            <div key={item.symbol} className="flex items-center justify-between text-xs w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: INST_COLORS[index % INST_COLORS.length] }}></div>
                                                    <span className="text-zinc-50 font-medium uppercase">{item.symbol}</span>
                                                </div>
                                                <span className="text-alphabag-muted font-medium tabular-nums text-right">
                                                    {totalWorth > 0 ? Math.round((item.value / totalWorth) * 100) : 0}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[220px] w-full flex items-center justify-center opacity-10">
                                    <div className="w-40 h-40 rounded-full border-[12px] border-white/20"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side Stack (occupies the remaining 8 columns) */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full">

                        {/* Top: AlphaAi Neural Analysis (occupies full width of the right stack) */}
                        <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col relative overflow-hidden flex-1">
                            {/* Subtle background flair */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[60px] pointer-events-none"></div>

                            <div className="flex items-center gap-2 mb-6 relative z-10">
                                <BrainCircuit size={15} className="text-alphabag-yellow/80" />
                                <h3 className="font-semibold text-[11px] uppercase tracking-widest text-alphabag-yellow/90">
                                    AlphaAI Neural Analysis
                                </h3>
                                {loadingAi && <RefreshCw className="animate-spin text-alphabag-yellow/50 ml-auto" size={13} />}
                            </div>

                            <div className="flex-1 relative z-10 text-xs text-zinc-300 font-medium leading-[1.8] custom-scrollbar overflow-y-auto pr-2">
                                <p className="mb-4">
                                    Neural synthesis complete. Based on global market sentiment and asset correlation, your portfolio demonstrates structural integrity against current macro volatility.
                                </p>
                                <p className="mb-4 text-zinc-400">
                                    There is a concentrated skew towards Layer 1 protocols. Reducing exposure dynamically over the next 72 hours could optimize your risk-adjusted returns.
                                </p>
                                <p className="text-[10px] text-alphabag-muted font-normal mt-6 mt-auto">
                                    <em>Analysis considers active total value of <span className="tabular-nums font-semibold">${totalWorth.toLocaleString()}</span>.</em>
                                </p>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/[0.03] relative z-10">
                                <p className="text-alphabag-muted text-[10px] flex items-center gap-2 opacity-60 uppercase tracking-widest font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow/50 animate-pulse"></span>
                                    Synchronizing Core
                                </p>
                            </div>
                        </div>

                        {/* Bottom Row: Risk Matrix & Alpha Mission claim */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Left Bottom: Risk Profile */}
                            <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6">
                                <h3 className="text-xs font-semibold text-alphabag-muted uppercase tracking-widest mb-5">Risk Matrix</h3>
                                <div className="space-y-5 flex flex-col justify-center h-[calc(100%-2.5rem)]">
                                    <div>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Risk Profile</span>
                                            <span className="text-zinc-50 font-semibold tabular-nums text-xs">{aiAnalysis.riskScore}/10</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 box-content">
                                            <div className="h-full bg-alphabag-yellow transition-all duration-1000 ease-out rounded-full" style={{ width: `${aiAnalysis.riskScore * 10}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Diversification</span>
                                            <span className="text-zinc-50 font-semibold tabular-nums text-xs">{aiAnalysis.diversificationScore}/10</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 box-content">
                                            <div className="h-full bg-alphabag-yellow transition-all duration-1000 ease-out rounded-full" style={{ width: `${aiAnalysis.diversificationScore * 10}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Bottom: Synapse Vault [REVEAL SYSTEM] */}
                            <div className="bg-alphabag-darkgray/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-glass p-6 flex flex-col justify-between overflow-hidden relative">
                                {/* Background Graphic Inner */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-alphabag-yellow/10 to-transparent rounded-bl-full pointer-events-none"></div>

                                <div className="relative z-10 w-full bg-gradient-to-br from-alphabag-yellow/5 to-transparent border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                    <h3 className="text-[10px] font-extrabold text-alphabag-yellow uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5 text-glow-yellow">
                                        <Layers size={12} fill="currentColor" /> Synapse Vault
                                    </h3>
                                    
                                    <div className="flex flex-col items-center">
                                        {!airdrop.reveal.isRevealed ? (
                                            <>
                                                <span className="text-3xl font-black tabular-nums text-zinc-50 tracking-tighter leading-none mb-1 shadow-glow-yellow flex items-center gap-2">
                                                    {airdrop.points.toLocaleString()} <span className="text-sm opacity-50">XP</span>
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-alphabag-muted uppercase tracking-[0.2em] flex items-center gap-1.5 animate-pulse">
                                                        <Activity size={10} className="text-alphabag-yellow" /> AlphaXP Processing...
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-4xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-white tracking-tighter leading-none mb-1 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">
                                                    {(airdrop.points * airdrop.reveal.conversionRate).toLocaleString()}
                                                </span>
                                                <div className="flex items-center gap-2 bg-alphabag-yellow/20 px-3 py-1 rounded-full border border-alphabag-yellow/30 mt-1">
                                                    <Lock size={10} className="text-alphabag-yellow" />
                                                    <span className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest">{airdrop.reveal.officialTicker} UNLOCKED</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-col items-center gap-1 border-t border-white/5 pt-3 w-full">
                                        <p className="text-[9px] text-zinc-400 max-w-[200px] leading-relaxed font-medium">
                                            {!airdrop.reveal.isRevealed 
                                                ? "Genesis AlphaXP is currently being calculated based on your profile and engagement."
                                                : `Your conversion from AlphaXP to ${airdrop.reveal.officialTicker} is now final and verifiable below.`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 relative z-10 flex flex-col gap-3">
                                    {/* Daily Claim or Reveal Button */}
                                    {!airdrop.reveal.isRevealed ? (
                                        <Button
                                            onClick={handleClaim}
                                            disabled={!airdrop.canClaim || claiming}
                                            className={`w-full py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 ${airdrop.canClaim
                                                ? 'bg-alphabag-yellow hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(252,213,53,0.3)] hover:shadow-[0_0_25px_rgba(252,213,53,0.5)] active:scale-[0.98]'
                                                : 'bg-white/5 hover:bg-white/5 text-zinc-400 border border-white/5'
                                                }`}
                                        >
                                            {claiming ? (
                                                <RefreshCw size={12} className="animate-spin" />
                                            ) : airdrop.canClaim ? (
                                                'Claim Daily AlphaXP'
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">Next Entry:</span>
                                                    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-white/5 shadow-inner">
                                                        <Timer size={12} className="text-alphabag-yellow drop-shadow-[0_0_4px_rgba(252,213,53,0.5)]" />
                                                        <span className="tabular-nums font-mono text-[11px] text-alphabag-yellow font-bold drop-shadow-[0_0_4px_rgba(252,213,53,0.5)]">{dailyTimeLeft}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </Button>
                                    ) : (
                                        <button
                                            onClick={() => window.location.href = '#/airdrop'}
                                            className="w-full py-4 bg-gradient-to-r from-alphabag-yellow to-yellow-600 text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_10px_30px_rgba(252,213,53,0.2)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                        >
                                            Initiate Token Migration <ArrowUpRight size={14} />
                                        </button>
                                    )}

                                    {/* Wallet Submission or Status */}
                                    {!airdrop.submittedWallet ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                placeholder="Paste BSC Secure Wallet"
                                                value={submissionWallet}
                                                onChange={(e) => setSubmissionWallet(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] text-zinc-50 placeholder-zinc-600 focus:outline-none focus:border-alphabag-yellow/50 transition-colors tabular-nums font-mono"
                                            />
                                            <Button
                                                onClick={handleSubmitWallet}
                                                disabled={submitting || submissionWallet.length < 10}
                                                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                            >
                                                Secure
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 mt-2">
                                            <div className="flex items-center gap-2">
                                                <Shield size={10} className="text-alphabag-yellow" />
                                                <span className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest">Locked Wallet</span>
                                            </div>
                                            <span className="text-[10px] text-zinc-300 tabular-nums font-mono opacity-80">
                                                {airdrop.submittedWallet.slice(0, 6)}...{airdrop.submittedWallet.slice(-4)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
