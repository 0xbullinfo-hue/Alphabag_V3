import React, { useState, useEffect, useRef } from 'react';
import {
    Zap, Gift, CheckCircle2, Timer, Users, Globe,
    Activity, Trophy, TrendingUp, ArrowRight,
    Twitter, ChevronLeft, ChevronRight, Coins, ArrowUpRight, Shield, Wallet, ExternalLink,
    Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Swal from 'sweetalert2';

interface Mission {
    id: string;
    title: string;
    description: string;
    rewardTokens: number;
    type: string;
    frequency: string;
    requiresLink: boolean;
    requiredCount?: number;
    actionUrl?: string;
    status: string;
}

interface ActivityLog {
    id: string;
    userHandle: string;
    taskType: string;
    pointsEarned: number;
    createdAt: string;
}

type FilterTab = 'ALL' | 'SOCIAL' | 'GROWTH' | 'TECHNICAL';
const FILTER_TABS: FilterTab[] = ['ALL', 'SOCIAL', 'GROWTH', 'TECHNICAL'];
const TASK_ICON: Record<string, React.ReactNode> = {
    SOCIAL:    <Twitter size={20} />,
    GROWTH:    <Users size={20} />,
    TECHNICAL: <Activity size={20} />,
    REVIEW:    <Shield size={20} />,
};
const ITEMS_PER_PAGE = 20;

export const Earn: React.FC = () => {
    const { user } = useAuth();

    // Profile & config
    const [earnProfile, setEarnProfile] = useState<any>(null);
    const [minimumClaimBalance, setMinimumClaimBalance] = useState(500);
    const [preferredWallet, setPreferredWallet] = useState('');

    // Missions
    const [missions, setMissions] = useState<Mission[]>([]);
    const [totalMissions, setTotalMissions] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
    const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
    const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
    const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [isDeactivated, setIsDeactivated] = useState(false);
    const [claimInputs, setClaimInputs] = useState<Record<string, { proofLink: string, feedback: string }>>({});

    const handleInputChange = (missionId: string, field: 'proofLink' | 'feedback', value: string) => {
        setClaimInputs(prev => ({
            ...prev,
            [missionId]: {
                ...(prev[missionId] || { proofLink: '', feedback: '' }),
                [field]: value
            }
        }));
    };

    // Sidebar data
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Payout
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);
    const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

    // ── Fetch missions (paginated) ──────────────────────────────────────────
    const fetchMissions = async (page: number, filter: FilterTab) => {
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
                ...(filter !== 'ALL' && { type: filter })
            });
            const res = await api.get(`/api/v1/t2e/missions?${params}`);
            const fetchedMissions = res.data.missions ?? res.data;
            setMissions(Array.isArray(fetchedMissions) ? fetchedMissions : []);
            setTotalMissions(res.data.total ?? (Array.isArray(fetchedMissions) ? fetchedMissions.length : 0));
            setTotalPages(res.data.totalPages ?? 1);
            if (res.data.isDeactivated) setIsDeactivated(true);
        } catch (err) {
            console.error('Mission fetch error:', err);
        }
    };

    // ── Initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const failSafe = setTimeout(() => {
                    setIsLoading(false);
                }, 3000); // Fail-safe loader exit

                const [lRes, aRes] = await Promise.allSettled([
                    api.get('/api/v1/t2e/leaderboard'),
                    api.get('/api/v1/t2e/activity-feed')
                ]);
                
                setLeaderboard(lRes.status === 'fulfilled' && Array.isArray(lRes.value.data) ? lRes.value.data : []);
                setActivities(aRes.status === 'fulfilled' && Array.isArray(aRes.value.data) ? aRes.value.data : []);

                if (user) {
                    try {
                        const pRes = await api.get('/api/v1/t2e/user/profile');
                        const p = pRes.data;
                        setEarnProfile(p);
                        setClaimedIds(new Set(p.claimedMissionIds ?? []));
                        setMinimumClaimBalance(p.minimumClaimBalance ?? 500);
                        setPreferredWallet(p.preferredWallet || '');
                    } catch (pErr) {
                        console.error('Profile fetch error:', pErr);
                    }
                }

                await fetchMissions(1, 'ALL');
                setIsLoading(false);
                clearTimeout(failSafe);
            } catch (err) {
                console.error('Init error:', err);
                setIsLoading(false);
            }
        };
        init();

        // SSE with Stability Guards
        // SSE with Stability Guards — use relative URL to stay on Vite proxy
        const sseUrl = `/api/v1/t2e/activity-stream`;
        const es = new EventSource(sseUrl);
        
        es.onmessage = (e) => {
            try {
                const update = JSON.parse(e.data);
                if (update.type === 'MISSION_CLAIM') {
                    setActivities(prev => [update.data, ...prev].slice(0, 20));
                }
            } catch (err) {
                console.error('SSE Data Error:', err);
            }
        };

        es.onerror = (err) => {
            console.warn('SSE Connection Interrupted. Reward feed standing by...', err);
            // We don't throw here to avoid triggering the ErrorBoundary
        };

        return () => es.close();
    }, [user?.id]);

    // ── Filter / page change ────────────────────────────────────────────────
    useEffect(() => {
        fetchMissions(currentPage, activeFilter);
    }, [currentPage, activeFilter]);

    const handleFilterChange = (f: FilterTab) => {
        setActiveFilter(f);
        setCurrentPage(1);
    };

    // ── Claim task ──────────────────────────────────────────────────────────
    const handleClaim = async (missionId: string, requiresLink: boolean) => {
        if (!user) { window.dispatchEvent(new CustomEvent('open-login-modal')); return; }
        const proofLink = claimInputs[missionId]?.proofLink;
        const feedback = claimInputs[missionId]?.feedback;

        const mission = missions.find(m => m.id === missionId);
        if ((mission?.id === 't2e_final_feedback' || mission?.type === 'FINAL_REVIEW') && !feedback) {
            Swal.fire({ title: 'Feedback Compulsory', text: 'Please provide your tester feedback to complete this final mission.', icon: 'warning', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
            return;
        }

        if (mission?.requiresLink && !proofLink) {
            Swal.fire({ title: 'Proof Required', text: 'Paste your activity link/handle to verify this task.', icon: 'warning', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
            return;
        }
        try {
            setClaimingId(missionId);
            const res = await api.post('/api/v1/t2e/claim', { missionId, proofLink, feedback });
            if (res.data.success) {
                Swal.fire({
                    title: 'CLAIM TRANSMITTED',
                    text: `Reward of ${res.data.rewardTokens} $BAG secured.`,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#fcd535'
                });
                
                await refreshUser();
                const mRes = await api.get('/api/v1/t2e/missions');
                const fetchedMissions = mRes.data.missions ?? mRes.data;
                setMissions(Array.isArray(fetchedMissions) ? fetchedMissions : []);
            }
        } catch (err: any) {
            Swal.fire({ title: 'Task Failed', text: err.response?.data?.error || 'Unable to process. Try again.', icon: 'error', background: '#0a0a0a', color: '#fff' });
        } finally {
            setClaimingId(null);
        }
    };

    // ── Wallet Management ───────────────────────────────────────────────────
    const handleUpdateWallet = async () => {
        if (!preferredWallet) return;
        try {
            setIsUpdatingWallet(true);
            await api.patch('/api/v1/t2e/user/wallet', { wallet: preferredWallet });
            Swal.fire({ title: 'DESTINATION SYNCED', text: 'Rewards will be sent to this address.', icon: 'success', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
        } catch (e) {
            Swal.fire({ title: 'Update Failed', text: 'Invalid wallet address or network error.', icon: 'error', background: '#0a0a0a', color: '#fff' });
        } finally {
            setIsUpdatingWallet(false);
        }
    };

    // ── Request Payout ──────────────────────────────────────────────────────
    const handleRequestPayout = async () => {
        const balance = earnProfile?.t2eBagBalance ?? 0;
        if (balance < minimumClaimBalance) return;

        const confirm = await Swal.fire({
            title: 'REQUEST $BAG PAYOUT',
            html: `You are requesting a distribution of <strong>${Number(balance).toLocaleString()} $BAG</strong>.<br/><br/><span class="text-[10px] text-zinc-500 uppercase">Payout Destination:</span><br/><code class="text-alphabag-yellow text-xs">${preferredWallet || user?.walletAddress}</code>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'CONFIRM REQUEST',
            confirmButtonColor: '#fcd535',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (!confirm.isConfirmed) return;

        try {
            setIsRequestingPayout(true);
            const res = await api.post('/api/v1/t2e/request-payout');
            if (res.data.success) {
                setEarnProfile((prev: any) => prev ? ({ ...prev, t2eBagBalance: 0 }) : prev);
                Swal.fire({ 
                    title: 'PAYOUT QUEUED ✅', 
                    text: 'Your request is in the approval queue. Tokens will be sent to your wallet shortly.', 
                    icon: 'success', 
                    background: '#0a0a0a', 
                    color: '#fff', 
                    confirmButtonColor: '#fcd535' 
                });
            }
        } catch (err: any) {
            Swal.fire({ title: 'Payout Failed', text: err.response?.data?.error || 'Try again later.', icon: 'error', background: '#0a0a0a', color: '#fff' });
        } finally {
            setIsRequestingPayout(false);
        }
    };

    const bagBalance = Number(earnProfile?.t2eBagBalance ?? 0);
    const progressToPayout = Math.min(100, (bagBalance / minimumClaimBalance) * 100);
    const canRequestPayout = bagBalance >= minimumClaimBalance;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-alphabag-yellow animate-pulse">Initializing T2E Core...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-5 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-alphabag-yellow/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-alphabag-yellow/10 border border-alphabag-yellow/30 rounded-full text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(252,213,53,0.2)]">
                    <Zap size={12} fill="currentColor" className="animate-pulse" /> Direct $BAG Rewards
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                    Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_20px_rgba(252,213,53,0.3)]">Control</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 glass-panel p-8 bg-gradient-to-br from-alphabag-yellow/10 to-transparent border border-alphabag-yellow/20 relative overflow-hidden rounded-3xl group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} className="text-alphabag-yellow" /> Pending Reward Balance
                            </div>
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-6xl font-black text-white tracking-tighter">
                                    {bagBalance.toLocaleString()}
                                </h2>
                                <span className="text-xl font-black text-alphabag-yellow uppercase tracking-widest">$BAG</span>
                            </div>
                            <div className="space-y-2 max-w-xs">
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${canRequestPayout ? 'bg-alphabag-green shadow-[0_0_10px_rgba(0,255,163,0.4)]' : 'bg-alphabag-yellow shadow-[0_0_10px_rgba(252,213,53,0.4)]'}`}
                                        style={{ width: `${progressToPayout}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestPayout}
                            disabled={!canRequestPayout || isRequestingPayout}
                            className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3
                                ${canRequestPayout
                                    ? 'bg-alphabag-yellow text-black hover:scale-105 shadow-[0_0_30px_rgba(252,213,53,0.3)] cursor-pointer'
                                    : 'bg-white/5 text-alphabag-muted border border-white/5 cursor-not-allowed grayscale'
                                }`}
                        >
                            {isRequestingPayout ? 'Processing...' : 'Request Payout'}
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="glass-panel p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white uppercase font-black text-xs tracking-widest">
                            <Wallet size={16} className="text-alphabag-blue" /> Payout Wallet
                        </div>
                        <input 
                            type="text"
                            value={preferredWallet}
                            onChange={(e) => setPreferredWallet(e.target.value)}
                            placeholder={user?.walletAddress || 'Enter destination address...'}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-mono focus:border-alphabag-blue/50 outline-none transition-all placeholder:text-zinc-800"
                        />
                    </div>
                    <Button 
                        onClick={handleUpdateWallet}
                        isLoading={isUpdatingWallet}
                        className="w-full mt-6 bg-alphabag-yellow text-black hover:bg-yellow-500 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl"
                    >
                        Save Preferences
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {missions.map((mission: any) => {
                            const isClaimed = claimedIds.has(mission.id);
                            const requiresLink = !!mission.requiresLink;
                            const isThisClaiming = claimingId === mission.id;
                            const inputs = claimInputs[mission.id] || { proofLink: '', feedback: '' };

                            return (
                                <div key={mission.id} className={`flex flex-col justify-between h-full p-6 rounded-2xl border transition-all group relative overflow-hidden ${isClaimed ? 'bg-alphabag-green/5 border-alphabag-green/20' : 'bg-white/[0.02] border-white/5 hover:border-alphabag-yellow/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${isClaimed ? 'bg-alphabag-green/20 text-alphabag-green' : 'bg-alphabag-yellow/10 text-alphabag-yellow'}`}>
                                            <Zap size={20} fill="currentColor" className={!isClaimed ? 'animate-pulse' : ''} />
                                        </div>
                                        {isClaimed ? (
                                            <div className="flex items-center gap-1.5 text-[9px] text-alphabag-green font-black uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Claimed
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-alphabag-yellow font-black uppercase tracking-widest bg-alphabag-yellow/10 px-2 py-1 rounded-md">
                                                +{mission.rewardTokens} $BAG
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-black text-white uppercase tracking-wider mb-1 text-sm">{mission.title}</h3>
                                        <p className="text-[11px] text-alphabag-subtext mb-4 leading-relaxed opacity-80">{mission.description}</p>
                                    </div>

                                    {!isClaimed && (
                                        <div className="space-y-4">
                                            {requiresLink && (
                                                <input
                                                    type="url"
                                                    placeholder="Proof Link: https://..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-alphabag-yellow/50 outline-none transition-all"
                                                    value={inputs.proofLink}
                                                    onChange={(e) => handleInputChange(mission.id, 'proofLink', e.target.value)}
                                                />
                                            )}

                                            {mission.type === 'FINAL_REVIEW' && (
                                                <textarea
                                                    placeholder="Required Feedback..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white h-16 resize-none focus:border-alphabag-yellow/50 outline-none transition-all"
                                                    value={inputs.feedback}
                                                    onChange={(e) => handleInputChange(mission.id, 'feedback', e.target.value)}
                                                />
                                            )}

                                            <div className="flex items-center gap-1.5 pt-2">
                                                <Timer size={10} className="text-alphabag-muted" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter text-alphabag-muted">
                                                    {mission.frequency || 'ONCE'}
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={() => {
                                                    if (mission.actionUrl && !requiresLink) window.open(mission.actionUrl, '_blank');
                                                    handleClaim(mission.id, requiresLink);
                                                }}
                                                disabled={isThisClaiming || (requiresLink && !inputs.proofLink)}
                                                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                    ${isThisClaiming || (requiresLink && !inputs.proofLink) 
                                                        ? 'bg-white/5 text-alphabag-muted cursor-not-allowed' 
                                                        : 'bg-alphabag-yellow text-black hover:scale-[1.02] active:scale-95 shadow-[0_5px_15px_rgba(252,213,53,0.3)]'}`}
                                            >
                                                {isThisClaiming ? 'SYNCING...' : 'INITIALIZE MISSION'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/5">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-alphabag-muted hover:text-white hover:border-alphabag-yellow/50 transition-all disabled:opacity-20"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="text-[10px] font-black text-white uppercase tracking-widest px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                    Page {currentPage} <span className="text-alphabag-muted mx-1">/</span> {totalPages}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-alphabag-muted hover:text-white hover:border-alphabag-yellow/50 transition-all disabled:opacity-20"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                {/* Statistics & Activity Feed */}
                <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                    <div className="lg:col-span-2 space-y-6">
                    {/* Distribution Feed */}
                    <div className="glass-panel p-6 bg-black border border-white/5 rounded-3xl flex flex-col h-[450px]">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-alphabag-green/10 rounded-xl flex items-center justify-center text-alphabag-green">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider leading-none">Global Feed</h3>
                                    <span className="text-[7px] text-alphabag-muted font-black uppercase tracking-[0.2em]">Real-time accrual</span>
                                </div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-alphabag-green rounded-full animate-pulse shadow-[0_0_8px_#00ffa3]" />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 shadow-[inset_0_-40px_40px_-40px_rgba(0,0,0,0.5)]">
                            {activities.map((act, idx) => (
                                <div key={act.id + idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-8 bg-alphabag-yellow/20 rounded-full group-hover:bg-alphabag-yellow/50 transition-all" />
                                        <div>
                                            <div className="text-[10px] font-black text-white uppercase font-mono">{act.userHandle}</div>
                                            <div className="text-[7px] text-alphabag-muted font-black uppercase tracking-widest">{act.taskType} Engagement</div>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-black text-alphabag-green font-mono">+{Number(act.pointsEarned).toLocaleString()} $BAG</div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                                    <Activity size={40} className="mb-4 text-alphabag-muted" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Network Silent</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Elite Leaderboard */}
                    <div className="glass-panel p-6 bg-gradient-to-b from-alphabag-yellow/5 to-transparent border border-alphabag-yellow/10 rounded-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Trophy size={18} className="text-alphabag-yellow" />
                            <h3 className="text-xs font-black text-white uppercase tracking-wider">Top Contributors (24h)</h3>
                        </div>
                        <div className="space-y-3">
                            {leaderboard.map((op, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black w-3 ${idx === 0 ? 'text-alphabag-yellow' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>{idx + 1}</span>
                                        <span className="text-[10px] text-white font-black uppercase tracking-wide font-mono">{op.handle}</span>
                                    </div>
                                    <span className="text-[10px] text-alphabag-yellow font-mono font-black">{Number(op.points).toLocaleString()} $BAG</span>
                                </div>
                            ))}
                            {leaderboard.length === 0 && <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest text-center py-4">No activity detected</p>}
                        </div>
                    </div>

                    {/* Protocol Safeguards */}
                    <div className="p-6 bg-alphabag-blue/5 border border-alphabag-blue/10 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.2em] border-b border-alphabag-blue/20 pb-4">
                            <Shield size={14} className="text-alphabag-blue" /> Knowledge Base
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <span className="text-[10px] font-black text-alphabag-blue leading-none mt-1">01.</span>
                                <p className="text-[10px] text-alphabag-subtext font-bold leading-[1.4] opacity-80 uppercase tracking-tight">Sync your preferred wallet to ensure rewards arrive at the correct destination.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[10px] font-black text-alphabag-blue leading-none mt-1">02.</span>
                                <p className="text-[10px] text-alphabag-subtext font-bold leading-[1.4] opacity-80 uppercase tracking-tight">Proof links are audited by our core team before airdrop authorization.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[10px] font-black text-alphabag-blue leading-none mt-1">03.</span>
                                <p className="text-[10px] text-alphabag-subtext font-bold leading-[1.4] opacity-80 uppercase tracking-tight">A minimum of {minimumClaimBalance.toLocaleString()} $BAG is required for a single payout request.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};
