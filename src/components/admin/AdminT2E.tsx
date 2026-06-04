import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    Zap, Plus, Trash2, AlertCircle, Settings, 
    DollarSign, Users, BarChart3, CheckCircle2, 
    XCircle, ExternalLink, RefreshCw, Layers, Award
} from 'lucide-react';
import { Button } from '../ui/Button';
import Swal from 'sweetalert2';

type T2EView = 'protocol' | 'tasks' | 'verification' | 'payouts';

export const AdminT2E: React.FC = () => {
    const [view, setView] = useState<T2EView>('protocol');
    const [config, setConfig] = useState<any>(null);
    const [missions, setMissions] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Deployment Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        rewardTokens: 100,
        type: 'SOCIAL',
        frequency: 'ONCE',
        requiresLink: false,
        actionUrl: ''
    });

    // Protocol Form state
    const [minClaim, setMinClaim] = useState('');
    const [itemsToBagRate, setItemsToBagRate] = useState<string>('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (view === 'protocol') {
                const res = await api.get('/api/v1/t2e/treasury-status');
                setConfig(res.data);
                setMinClaim(res.data?.minimumClaimBalance ?? 500);
                setItemsToBagRate(res.data?.itemsToBagRate?.toString() || '');
            } else if (view === 'tasks') {
                const res = await api.get('/api/v1/t2e/admin/missions');
                setMissions(res.data || []);
            } else if (view === 'verification') {
                const res = await api.get('/api/v1/t2e/admin/activity');
                setActivity(res.data || []);
            } else if (view === 'payouts') {
                const res = await api.get('/api/v1/t2e/admin/token-requests');
                setRequests(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [view]);

    const handleSaveConfig = async (overrideRate?: string, overrideCampaignStatus?: boolean) => {
        try {
            const finalRate = overrideRate !== undefined ? overrideRate : itemsToBagRate;
            const finalCampaignEnded = overrideCampaignStatus !== undefined ? overrideCampaignStatus : config?.campaignEnded;
            
            const res = await api.patch('/api/v1/t2e/admin/adjust-balance', {
                minimumClaimBalance: parseInt(minClaim),
                itemsToBagRate: finalRate === '' ? null : parseFloat(finalRate),
                campaignEnded: finalCampaignEnded
            });
            if (res.data.success) {
                Swal.fire({ title: 'CONFIG SYNCED', text: 'Protocol parameters updated.', icon: 'success', background: '#0a0a0a', color: '#fff' });
                setConfig(res.data.config);
            }
        } catch (e) {
            Swal.fire({ title: 'SYNC FAILED', text: 'Failed to update protocol settings.', icon: 'error', background: '#0a0a0a', color: '#fff' });
        }
    };

    const handleDeployTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.rewardTokens) {
            Swal.fire('Error', 'Title and Reward are required.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/api/v1/t2e/admin/missions', {
                ...newTask,
                rewardTokens: Number(newTask.rewardTokens)
            });
            Swal.fire({
                title: 'MISSION DEPLOYED',
                text: 'The task is now live in the Reward Hub.',
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
            setShowTaskForm(false);
            setNewTask({
                title: '',
                description: '',
                rewardTokens: 100,
                type: 'SOCIAL',
                frequency: 'ONCE',
                requiresLink: false,
                actionUrl: ''
            });
            fetchData();
        } catch (e) {
            Swal.fire('Error', 'Failed to deploy mission.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMission = async (id: string) => {
        const result = await Swal.fire({
            title: 'TERMINATE MISSION?',
            text: "This entry will be removed from the Reward Hub.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'CONFIRM DELETE',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/api/v1/t2e/admin/missions/${id}`);
                fetchData();
            } catch (e) {
                Swal.fire('Error', 'Deletion failed.', 'error');
            }
        }
    };

    const handleApprovePayout = async (id: string, decision: 'APPROVED' | 'REJECTED' = 'APPROVED') => {
        const isApprove = decision === 'APPROVED';
        const result = await Swal.fire({
            title: isApprove ? 'AUTHORIZE AIRDROP' : 'DENY PAYOUT REQUEST',
            text: isApprove 
                ? "This will trigger a live blockchain transaction to the user's preferred wallet."
                : "Are you sure you want to reject this payout request?",
            icon: isApprove ? 'warning' : 'error',
            showCancelButton: true,
            confirmButtonColor: isApprove ? '#fcd535' : '#ef4444',
            confirmButtonText: isApprove ? 'SEND TOKENS NOW' : 'DENY REQUEST',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.post(`/api/v1/t2e/admin/token-requests/${id}/approve`, { status: decision });
                Swal.fire({
                    title: isApprove ? 'AIRDROP SUCCESS' : 'REQUEST DENIED',
                    html: isApprove ? `<p class="text-xs text-zinc-400">TX: ${res.data.txHash}</p>` : `<p class="text-xs text-zinc-400">Request has been marked as rejected.</p>`,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (err: any) {
                Swal.fire('ERROR', err.response?.data?.error || 'Action failed', 'error');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* ── Tabs Navigation ─── */}
            <div className="flex flex-wrap gap-2 mb-8">
                {[
                    { id: 'protocol', label: 'Network Hub', icon: Settings },
                    { id: 'tasks', label: 'Deploy Missions', icon: Zap },
                    { id: 'verification', label: 'Proof Audits', icon: Users },
                    { id: 'payouts', label: 'Airdrop Queue', icon: DollarSign }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setView(t.id as T2EView)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            view === t.id 
                            ? 'bg-alphabag-yellow text-black shadow-[0_0_20px_rgba(252,213,53,0.2)]' 
                            : 'bg-white/5 text-alphabag-muted hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <t.icon size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── View: Protocol/Network Hub ─── */}
            {view === 'protocol' && (
                <div className="space-y-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-black border border-alphabag-yellow/10 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-alphabag-yellow/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-alphabag-yellow/10 transition-all duration-1000"></div>
                        
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-alphabag-yellow/10 rounded-2xl border border-alphabag-yellow/20">
                                    <BarChart3 size={24} className="text-alphabag-yellow" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">System Intelligence</h3>
                                    <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Real-time Protocol Dynamics</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={fetchData} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl p-3 transition-all">
                                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:border-alphabag-yellow/30 transition-all group/card">
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">Total ITEMS Earned</p>
                                <h4 className="text-3xl font-black text-white font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(config?.intelligence?.totalEarned || 0).toLocaleString()} <span className="text-[12px] text-zinc-500 font-bold ml-1">ITEMS</span></h4>
                            </div>
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:border-alphabag-yellow/30 transition-all group/card">
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">BAG Conversion Liability</p>
                                <h4 className="text-3xl font-black text-alphabag-yellow font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(config?.intelligence?.totalPending || 0).toLocaleString()} <span className="text-[12px] text-alphabag-yellow/50 font-bold ml-1">BAG</span></h4>
                            </div>
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] relative overflow-hidden hover:border-alphabag-green/30 transition-all group/card">
                                <div className="absolute top-0 right-0 px-3 py-1 bg-alphabag-green/20 text-alphabag-green text-[8px] font-black uppercase tracking-tighter rounded-bl-xl border-l border-b border-alphabag-green/30">Live Distro</div>
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">Total Disbursed</p>
                                <h4 className="text-3xl font-black text-alphabag-green font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(config?.intelligence?.totalDisbursed || 0).toLocaleString()} <span className="text-[12px] text-alphabag-green/50 font-bold ml-1">BAG</span></h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest block">Minimum User Payout Floor ($BAG)</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="number" 
                                        value={minClaim} 
                                        onChange={e => setMinClaim(e.target.value)} 
                                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                    <Button onClick={handleSaveConfig} isLoading={isLoading} className="bg-alphabag-yellow text-[#000] font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-105 transition-all text-[10px] shadow-lg shadow-alphabag-yellow/5">
                                        SYNC FLOOR
                                    </Button>
                                </div>
                                <p className="text-[9px] text-alphabag-muted italic">Threshold required for airdrop requests.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest block">Campaign Status Control</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm flex items-center">
                                        <span className="text-[10px] text-alphabag-muted mr-2">STATE:</span>
                                        <span className={config?.campaignEnded ? 'text-red-500 font-black' : 'text-alphabag-green font-black'}>
                                            {config?.campaignEnded ? 'HALTED' : 'OPERATIONAL'}
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={() => handleSaveConfig(undefined, !config?.campaignEnded)} 
                                        className={`${config?.campaignEnded ? 'bg-alphabag-green' : 'bg-red-600'} text-[#000] font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-105 transition-all text-[10px] min-w-[140px] shadow-lg`}
                                    >
                                        {config?.campaignEnded ? 'START CAMPAIGN' : 'END CAMPAIGN'}
                                    </Button>
                                </div>
                                <p className="text-[9px] text-alphabag-muted italic">Manual override for protocol conversion state.</p>
                            </div>
                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest block">Conversion Rate (ITEMS per 1 $BAG)</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="number" 
                                        value={itemsToBagRate} 
                                        onChange={e => setItemsToBagRate(e.target.value)} 
                                        placeholder="e.g. 10"
                                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                    <Button onClick={() => handleSaveConfig()} isLoading={isLoading} className="bg-alphabag-yellow !text-black font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-105 transition-all text-[10px] shadow-lg shadow-alphabag-yellow/5">
                                        SYNC RATE
                                    </Button>
                                    <Button onClick={() => { setItemsToBagRate(''); handleSaveConfig(''); }} isLoading={isLoading} className="bg-alphabag-yellow !text-black font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-105 transition-all text-[10px] shadow-lg shadow-alphabag-yellow/5">
                                        RESET
                                    </Button>
                                </div>
                                <p className="text-[9px] text-alphabag-muted italic">Set the rate for ITEMS to $BAG conversion. Leave empty to close conversions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View: Task Control ─── */}
            {view === 'tasks' && (
                <div className="glass-panel p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <Zap className="text-alphabag-yellow" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Mission Matrix</h3>
                        </div>
                        <Button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">
                            {showTaskForm ? 'ABORT' : <><Plus size={14} className="mr-2" /> Deploy Mission</>}
                        </Button>
                    </div>

                    {showTaskForm && (
                        <form onSubmit={handleDeployTask} className="bg-black/40 border border-alphabag-yellow/50 rounded-2xl p-8 space-y-6 mb-10 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Title</label>
                                    <input 
                                        required type="text" 
                                        placeholder="e.g. Follow on X" 
                                        value={newTask.title} 
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })} 
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">ITEMS Reward</label>
                                    <input 
                                        required type="number" 
                                        value={newTask.rewardTokens} 
                                        onChange={e => setNewTask({ ...newTask, rewardTokens: Number(e.target.value) })} 
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Description</label>
                                <textarea 
                                    required 
                                    placeholder="Brief explanation of the task..."
                                    value={newTask.description} 
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })} 
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none focus:border-alphabag-yellow outline-none transition-all" 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Category</label>
                                    <select 
                                        value={newTask.type} 
                                        onChange={e => setNewTask({ ...newTask, type: e.target.value })} 
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-alphabag-yellow"
                                    >
                                        <option value="SOCIAL">SOCIAL</option>
                                        <option value="TECHNICAL">TECHNICAL</option>
                                        <option value="GROWTH">GROWTH</option>
                                        <option value="REVIEW">REVIEW</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Frequency</label>
                                    <select 
                                        value={newTask.frequency} 
                                        onChange={e => setNewTask({ ...newTask, frequency: e.target.value })} 
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-alphabag-yellow"
                                    >
                                        <option value="ONCE">ONCE</option>
                                        <option value="DAILY">DAILY</option>
                                        <option value="WEEKLY">WEEKLY</option>
                                        <option value="UNLIMITED">UNLIMITED</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Action URL (Optional)</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://..." 
                                        value={newTask.actionUrl} 
                                        onChange={e => setNewTask({ ...newTask, actionUrl: e.target.value })} 
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                <input 
                                    type="checkbox" 
                                    id="requiresLink" 
                                    checked={newTask.requiresLink}
                                    onChange={e => setNewTask({ ...newTask, requiresLink: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-black text-alphabag-yellow" 
                                />
                                <label htmlFor="requiresLink" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">Require Proof Link for validation</label>
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button type="submit" isLoading={isLoading} className="bg-alphabag-yellow text-black uppercase font-black px-12 h-12 tracking-[0.2em] shadow-[0_0_30px_rgba(252,213,53,0.2)] hover:scale-105 transition-all text-[11px] rounded-xl">
                                    DEPLOY MISSION
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {missions.map(m => (
                            <div key={m.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <Zap size={18} className="text-alphabag-yellow" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white uppercase tracking-wide text-xs">{m.title}</h4>
                                        <div className="text-[11px] text-alphabag-muted mt-0.5">{m.description}</div>
                                        <div className="text-[8px] text-alphabag-muted flex items-center gap-3 mt-1.5 font-bold uppercase tracking-widest">
                                            <span className="bg-white/5 px-2 py-0.5 rounded text-alphabag-blue">{m.type}</span>
                                            <span>{m.frequency}</span>
                                            <span className="text-alphabag-green">{Number(m.rewardTokens).toLocaleString()} ITEMS</span>
                                            {m.requiresLink && <span className="text-alphabag-yellow border border-alphabag-yellow/20 px-1.5 rounded">PROOF REQ</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteMission(m.id)} className="p-2 text-alphabag-muted hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {missions.length === 0 && <div className="py-20 text-center text-alphabag-muted text-[10px] uppercase font-bold opacity-30 italic">No missions deployed</div>}
                    </div>
                </div>
            )}

            {/* ── View: Verification Desk ─── */}
            {view === 'verification' && (
                <div className="glass-panel p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-alphabag-blue" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Proof Inspection</h3>
                        </div>
                        <button onClick={fetchData} className="p-2 text-alphabag-muted hover:text-white transition-all"><RefreshCw size={16} /></button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[10px] font-black text-alphabag-muted uppercase tracking-[0.2em]">
                                    <th className="px-4 pb-4">Participant</th>
                                    <th className="px-4 pb-4">Task</th>
                                    <th className="px-4 pb-4">Reward</th>
                                    <th className="px-4 pb-4">Proof Link</th>
                                    <th className="px-4 pb-4">Feedback</th>
                                    <th className="px-4 pb-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activity.map(a => (
                                    <tr key={a.id} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                                        <td className="px-4 py-4 rounded-l-2xl border-l border-t border-b border-white/5">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-bold text-white font-mono">{a.user?.walletAddress ? `${a.user.walletAddress.slice(0, 8)}...${a.user.walletAddress.slice(-4)}` : (a.userId || 'Unknown').slice(0, 10) + '...'}</div>
                                                <div className="flex gap-1.5 items-center">
                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${a.user?.isBanned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                        {a.user?.isBanned ? 'BANNED' : 'ACTIVE'}
                                                    </span>
                                                    <span className="text-[7px] text-zinc-500 font-bold">Strikes: {a.user?.strikes || 0}/5</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 border-t border-b border-white/5">
                                            <div className="text-[10px] font-bold text-white uppercase mb-0.5">{a.mission?.title}</div>
                                            <div className="text-[8px] text-alphabag-muted uppercase font-bold">{a.mission?.type}</div>
                                        </td>
                                        <td className="px-4 py-4 border-t border-b border-white/5 font-mono text-alphabag-green text-[10px] font-bold">+{Number(a.rewardTokens).toLocaleString()} ITEMS</td>
                                        <td className="px-4 py-4 border-t border-b border-white/5">
                                            {a.proofLink ? (
                                                <a href={a.proofLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-alphabag-yellow hover:underline text-[9px] font-bold uppercase">
                                                    View Proof <ExternalLink size={10} />
                                                </a>
                                            ) : <span className="text-[9px] text-alphabag-muted italic">Self-Verified</span>}
                                        </td>
                                        <td className="px-4 py-4 border-t border-b border-white/5">
                                            <div className="text-[10px] text-zinc-400 max-w-[150px] truncate italic" title={a.feedback}>
                                                {a.feedback || <span className="text-zinc-600">No feedback</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 rounded-r-2xl border-r border-t border-b border-white/5 font-mono text-[9px] text-alphabag-muted">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activity.length === 0 && <div className="py-20 text-center text-alphabag-muted text-[10px] uppercase font-bold opacity-30">No activity logs found</div>}
                    </div>
                </div>
            )}

            {/* ── View: Payout Queue ─── */}
            {view === 'payouts' && (
                <div className="glass-panel p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="text-alphabag-yellow" />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Reward Withdrawal Queue</h3>
                                <p className="text-[10px] text-alphabag-muted uppercase tracking-widest font-bold mt-0.5">
                                    Campaign ITEMS → $BAG payout requests. Mark as DONE once BSC transfer is complete.
                                </p>
                            </div>
                        </div>
                        <button onClick={fetchData} className="p-2 text-alphabag-muted hover:text-white transition-all">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Status Legend */}
                    <div className="flex flex-wrap gap-3 pb-4 border-b border-white/5">
                        {[
                            { label: 'PENDING', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Awaiting admin review' },
                            { label: 'APPROVED', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Approved, transfer in progress' },
                            { label: 'SENT', color: 'text-green-400 bg-green-500/10 border-green-500/20', desc: 'Delivered to BSC wallet' },
                            { label: 'REJECTED', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Request denied' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${s.color}`}>{s.label}</span>
                                <span className="text-[9px] text-alphabag-muted">{s.desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {requests.map(r => {
                            const status = r.status as string;
                            const isPending = status === 'PENDING';
                            const isApproved = status === 'APPROVED';
                            const isSent = status === 'SENT';
                            const isRejected = status === 'REJECTED';

                            return (
                                <div key={r.id} className={`p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                    isSent ? 'bg-green-500/[0.03] border-green-500/20' :
                                    isApproved ? 'bg-blue-500/[0.03] border-blue-500/20' :
                                    isPending ? 'bg-white/[0.02] border-white/5 hover:border-alphabag-yellow/20' :
                                    'bg-red-500/[0.03] border-red-500/10 opacity-60'
                                }`}>
                                    {/* Left: user + amounts */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-9 h-9 bg-alphabag-yellow/10 rounded-xl flex items-center justify-center text-alphabag-yellow shrink-0">
                                            <Users size={16} />
                                        </div>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-mono text-white text-xs font-bold truncate">
                                                    {(r.walletAddress || r.user?.submittedWallet || r.user?.walletAddress || 'No wallet').slice(0, 20)}...
                                                </p>
                                                {/* Status badge */}
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                                                    isSent ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                    isApproved ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                    isPending ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                                    'text-red-400 bg-red-500/10 border-red-500/20'
                                                }`}>{status}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-[10px]">
                                                <span className="text-alphabag-muted">
                                                    <span className="font-bold text-white">{Number(r.expectedTokens).toLocaleString()}</span> ITEMS earned
                                                </span>
                                                <span className="text-alphabag-yellow font-bold">
                                                    → {Number(r.expectedTokens).toLocaleString()} $BAG payout
                                                </span>
                                            </div>
                                            <div className="text-[9px] font-mono text-alphabag-muted">
                                                Requested: {new Date(r.createdAt).toLocaleString()}
                                                {r.sentAt && <span className="ml-3 text-green-400">• Sent: {new Date(r.sentAt).toLocaleString()}</span>}
                                                {r.txReference && <span className="ml-3 text-alphabag-subtext">TX: {r.txReference}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleApprovePayout(r.id, 'REJECTED')}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all border border-red-500/20"
                                                >
                                                    <XCircle size={12} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApprovePayout(r.id, 'APPROVED')}
                                                    className="flex items-center gap-1.5 px-5 py-2 bg-alphabag-yellow text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(252,213,53,0.2)]"
                                                >
                                                    <CheckCircle2 size={12} /> Approve
                                                </button>
                                            </>
                                        )}
                                        {isApproved && (
                                            <button
                                                onClick={async () => {
                                                    const result = await Swal.fire({
                                                        title: 'CONFIRM TRANSFER DONE',
                                                        html: `<p class="text-xs text-zinc-400">Enter optional TX reference or leave blank. This tells the user their $BAG has been sent to their BSC wallet.</p>`,
                                                        input: 'text',
                                                        inputPlaceholder: 'TX Hash / reference (optional)',
                                                        inputAttributes: { style: 'background:#1a1a1a;color:white;border:1px solid #444;border-radius:8px;padding:10px;' },
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#22c55e',
                                                        confirmButtonText: '✓ MARK AS SENT',
                                                        background: '#0a0a0a',
                                                        color: '#fff'
                                                    });
                                                    if (!result.isConfirmed) return;
                                                    try {
                                                        await api.post(`/api/v1/t2e/admin/token-requests/${r.id}/mark-done`, { txReference: result.value || null });
                                                        Swal.fire({ title: 'MARKED AS SENT', text: 'User dashboard will now show reward delivered.', icon: 'success', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
                                                        fetchData();
                                                    } catch (err: any) {
                                                        Swal.fire('ERROR', err.response?.data?.error || 'Failed', 'error');
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 px-5 py-2 bg-green-500/10 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all border border-green-500/20"
                                            >
                                                <CheckCircle2 size={12} /> Mark DONE
                                            </button>
                                        )}
                                        {isSent && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                                <CheckCircle2 size={14} className="text-green-400" />
                                                <span className="text-[10px] font-black text-green-400 uppercase">Delivered</span>
                                            </div>
                                        )}
                                        {isRejected && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                                                <XCircle size={14} className="text-red-400" />
                                                <span className="text-[10px] font-black text-red-400 uppercase">Rejected</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {requests.length === 0 && (
                            <div className="py-20 text-center opacity-30 select-none">
                                <AlertCircle size={48} className="mx-auto mb-4 text-alphabag-muted" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-alphabag-muted">No withdrawal requests yet</h4>
                                <p className="text-[9px] text-alphabag-muted mt-1">Users submit requests after campaign ends and Convert is activated.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
