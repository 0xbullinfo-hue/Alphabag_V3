import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    Zap, Plus, Trash2, AlertCircle, Settings, 
    Coins, Users, BarChart3, CheckCircle2, 
    XCircle, ExternalLink, RefreshCw, Layers
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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (view === 'protocol') {
                const res = await api.get('/api/v1/t2e/treasury-status');
                setConfig(res.data);
                setMinClaim(res.data?.minimumClaimBalance ?? 500);
            } else if (view === 'tasks') {
                const res = await api.get('/api/v1/t2e/missions?status=ALL&limit=100');
                setMissions(res.data.missions || []);
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

    const handleSaveConfig = async () => {
        try {
            const res = await api.patch('/api/v1/t2e/admin/adjust-balance', {
                minimumClaimBalance: parseInt(minClaim)
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

    const handleApprovePayout = async (id: string) => {
        const result = await Swal.fire({
            title: 'AUTHORIZE AIRDROP',
            text: "This will trigger a live blockchain transaction to the user's preferred wallet.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#fcd535',
            confirmButtonText: 'SEND TOKENS NOW',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.post(`/api/v1/t2e/admin/token-requests/${id}/approve`, { status: 'APPROVED' });
                Swal.fire({
                    title: 'AIRDROP SUCCESS',
                    html: `<p class="text-xs text-zinc-400">TX: ${res.data.txHash}</p>`,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (err: any) {
                Swal.fire('BLOCKCHAIN ERROR', err.response?.data?.error || 'Transaction failed', 'error');
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
                    { id: 'payouts', label: 'Airdrop Queue', icon: Coins }
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
                <div className="grid grid-cols-1 gap-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-[#0a0a0a] to-black border border-alphabag-yellow/20 rounded-3xl">
                        <div className="flex items-center gap-3 mb-8">
                            <BarChart3 size={20} className="text-alphabag-yellow" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">System Intelligence</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[9px] text-alphabag-muted uppercase font-bold tracking-widest mb-1">Total $BAG Earned</p>
                                <h4 className="text-2xl font-black text-white font-mono">{Number(config?.intelligence?.totalEarned || 0).toLocaleString()} <span className="text-[10px] text-zinc-500">BAG</span></h4>
                            </div>
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[9px] text-alphabag-muted uppercase font-bold tracking-widest mb-1">Pending Liability</p>
                                <h4 className="text-2xl font-black text-alphabag-yellow font-mono">{Number(config?.intelligence?.totalPending || 0).toLocaleString()} <span className="text-[10px] text-zinc-500">BAG</span></h4>
                            </div>
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 bg-alphabag-green/20 text-alphabag-green text-[7px] font-black uppercase tracking-tighter rounded-bl">Live Distro</div>
                                <p className="text-[9px] text-alphabag-muted uppercase font-bold tracking-widest mb-1">Total Disbursed</p>
                                <h4 className="text-2xl font-black text-alphabag-green font-mono">{Number(config?.intelligence?.totalDisbursed || 0).toLocaleString()} <span className="text-[10px] text-zinc-500">BAG</span></h4>
                            </div>
                        </div>

                        <div className="max-w-md space-y-4 pt-6 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest block">Minimum User Payout Floor ($BAG)</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="number" 
                                        value={minClaim} 
                                        onChange={e => setMinClaim(e.target.value)} 
                                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-alphabag-yellow outline-none transition-all" 
                                    />
                                    <Button onClick={handleSaveConfig} isLoading={isLoading} className="bg-alphabag-yellow text-black font-black uppercase tracking-widest py-3 px-6 rounded-xl hover:scale-105 transition-all">
                                        Update Floor
                                    </Button>
                                </div>
                                <p className="text-[9px] text-alphabag-muted italic">Users cannot request an airdrop until their earned balance reaches this amount.</p>
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
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Reward $BAG</label>
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

                            <Button type="submit" isLoading={isLoading} className="bg-alphabag-yellow text-black uppercase font-black w-full h-14 tracking-[0.2em] shadow-[0_0_30px_rgba(252,213,53,0.2)]">DEPLOY MISSION</Button>
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
                                            <span className="text-alphabag-green">{Number(m.rewardTokens).toLocaleString()} $BAG</span>
                                            {m.requiresLink && <span className="text-alphabag-yellow border border-alphabag-yellow/20 px-1.5 rounded">PROOF REQ</span>}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-alphabag-muted hover:text-red-500 transition-colors">
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
                                    <th className="px-4 pb-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activity.map(a => (
                                    <tr key={a.id} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                                        <td className="px-4 py-4 rounded-l-2xl border-l border-t border-b border-white/5">
                                            <div className="text-[10px] font-bold text-white font-mono">{a.user?.walletAddress?.slice(0, 10)}...</div>
                                        </td>
                                        <td className="px-4 py-4 border-t border-b border-white/5">
                                            <div className="text-[10px] font-bold text-white uppercase mb-0.5">{a.mission?.title}</div>
                                            <div className="text-[8px] text-alphabag-muted uppercase font-bold">{a.mission?.type}</div>
                                        </td>
                                        <td className="px-4 py-4 border-t border-b border-white/5 font-mono text-alphabag-green text-[10px] font-bold">+{Number(a.rewardTokens).toLocaleString()} $BAG</td>
                                        <td className="px-4 py-4 border-t border-b border-white/5">
                                            {a.proofLink ? (
                                                <a href={a.proofLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-alphabag-yellow hover:underline text-[9px] font-bold uppercase">
                                                    View Proof <ExternalLink size={10} />
                                                </a>
                                            ) : <span className="text-[9px] text-alphabag-muted italic">Self-Verified</span>}
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
                <div className="glass-panel p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                    <div className="flex items-center gap-3 mb-10">
                        <Coins className="text-alphabag-yellow" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Authorized Distributions</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {requests.map(r => (
                            <div key={r.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-alphabag-yellow/20 transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-alphabag-yellow/10 rounded-2xl flex items-center justify-center text-alphabag-yellow">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-alphabag-muted uppercase mb-0.5">Destination Wallet</p>
                                            <p className="font-mono text-zinc-200 text-sm italic">{r.walletAddress || r.user?.walletAddress}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-alphabag-muted uppercase mb-0.5">Distribution Payload</p>
                                        <p className="text-lg font-black text-white">{Number(r.expectedTokens).toLocaleString()} <span className="text-[10px] text-alphabag-yellow uppercase font-bold tracking-[0.2em] ml-1">BAG Tokens</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {r.status === 'PENDING' ? (
                                        <>
                                            <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all">
                                                <XCircle size={14} /> Deny
                                            </button>
                                            <button 
                                                onClick={() => handleApprovePayout(r.id)}
                                                className="flex items-center gap-2 px-8 py-3 bg-alphabag-yellow text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(252,213,53,0.3)]"
                                            >
                                                <RefreshCw size={14} /> Authorize Airdrop
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-alphabag-green/10 px-6 py-3 rounded-2xl border border-alphabag-green/20">
                                            <CheckCircle2 size={16} className="text-alphabag-green" />
                                            <div>
                                                <p className="text-[10px] font-black text-alphabag-green uppercase">Disbursed successfully</p>
                                                <p className="text-[8px] font-mono text-alphabag-green/60 truncate max-w-[150px]">{r.txHash}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <div className="py-20 text-center opacity-30 select-none">
                                <AlertCircle size={48} className="mx-auto mb-4 text-alphabag-muted" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-alphabag-muted">Queue Empty — No pending payouts</h4>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
