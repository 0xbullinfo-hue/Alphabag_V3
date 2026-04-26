import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { 
    Zap, AlertTriangle, Plus, Trash2, Shield, Users, 
    Download, Target, ExternalLink, Globe, CheckCircle2,
    PauseCircle, PlayCircle, RefreshCw, DatabaseBackup
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminAirdrop: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'missions' | 'intelligence' | 'founders'>('missions');
    const [isLoading, setIsLoading] = useState(false);
    const [missionPaused, setMissionPaused] = useState(false);

    // New Mission Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ 
        title: '', 
        description: '', 
        rewardXP: 50, 
        actionUrl: '', 
        type: 'once' 
    });

    useEffect(() => {
        if (viewMode === 'missions') fetchTasks();
        else fetchParticipants();
        fetchMissionStatus();
    }, [viewMode]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/api/airdrop/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error("Failed to fetch missions", error);
        }
    };

    const fetchParticipants = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/wallets');
            // Backend returns users with XP and referral data
            setParticipants(res.data);
        } catch (error) {
            console.error("Failed to fetch network intelligence", error);
        }
    };

    const fetchMissionStatus = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/mission-status');
            setMissionPaused(!!res.data.isPaused);
        } catch (error) {
            console.error("Failed to fetch mission status", error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/api/airdrop/admin/tasks', newTask);
            Swal.fire({
                title: 'MISSION DEPLOYED',
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff'
            });
            setShowTaskForm(false);
            setNewTask({ title: '', description: '', rewardXP: 50, actionUrl: '', type: 'once' });
            fetchTasks();
        } catch (error) {
            Swal.fire('Error', 'Failed to deploy mission', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        const result = await Swal.fire({
            title: 'REMOVE MISSION?',
            text: "This hub entry will be terminated.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/api/admin/tasks/${id}`);
                fetchTasks();
            } catch (error) {
                Swal.fire('Error', 'Termination failed', 'error');
            }
        }
    };

    const handleApproveFounder = async (userId: string, currentStatus: boolean) => {
        try {
            const apiStatus = currentStatus ? 'REJECTED' : 'APPROVED';
            await api.post('/api/airdrop/admin/approve-founder', { userId, status: apiStatus });
            Swal.fire({
                title: apiStatus === 'APPROVED' ? 'MEMBER ACTIVATED' : 'MEMBER DEACTIVATED',
                text: `Founder status has been ${apiStatus.toLowerCase()}.`,
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff'
            });
            fetchParticipants();
        } catch (error) {
            Swal.fire('Error', 'Action failed', 'error');
        }
    };

    const handlePauseMission = async () => {
        const action = missionPaused ? 'RESUME' : 'PAUSE';
        const result = await Swal.fire({
            title: `${action} MISSION?`,
            text: missionPaused
                ? 'Resume the mission and allow users to claim XP again?'
                : 'Pause the mission? All XP claims will be disabled until resumed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: missionPaused ? '#22c55e' : '#f59e0b',
            confirmButtonText: `YES, ${action}`,
            background: '#0a0a0a',
            color: '#fff'
        });
        if (result.isConfirmed) {
            try {
                const res = await api.post('/api/airdrop/admin/pause-mission', { paused: !missionPaused });
                setMissionPaused(res.data.isPaused);
                Swal.fire({ title: res.data.message, icon: 'success', background: '#0a0a0a', color: '#fff' });
            } catch (error) {
                Swal.fire('Error', 'Failed to update mission state', 'error');
            }
        }
    };

    const handleExportData = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            Swal.fire({ title: 'EXPORT COMPLETE', text: 'Member XP snapshot downloaded.', icon: 'success', background: '#0a0a0a', color: '#fff' });
        } catch (error) {
            Swal.fire('Error', 'Export failed', 'error');
        }
    };

    const handleFullWipe = async () => {
        const result = await Swal.fire({
            title: '⚠️ FULL MISSION WIPE',
            html: '<p style="color:#ccc">This permanently deletes all XP, tasks, campaigns and resets every member. User accounts are preserved but all mission progress is erased.</p><p style="color:#fcd535; margin-top:12px"><strong>Download the export first before proceeding.</strong></p>',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'WIPE ALL MISSION DATA',
            cancelButtonText: 'CANCEL',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (result.isConfirmed) {
            try {
                await api.post('/api/airdrop/admin/full-wipe');
                Swal.fire({ title: 'MISSION WIPED', text: 'All data cleared. Ready to restart.', icon: 'success', background: '#0a0a0a', color: '#fff' });
                fetchTasks();
                fetchParticipants();
                setMissionPaused(false);
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    const triggerSnapshot = async () => {
        const result = await Swal.fire({
            title: 'ELITE SNAPSHOT',
            text: "Award 2,000 XP bonus to the Top 100 recruiters now?",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#fcd535',
            confirmButtonText: 'EXECUTE SNAPSHOT',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.post('/api/airdrop/admin/snapshot-referrals');
                Swal.fire('BONUS SYNCED', `${res.data.count} elite members rewarded.`, 'success');
                fetchParticipants();
            } catch (error) {
                Swal.fire('Error', 'Snapshot failure', 'error');
            }
        }
    };

    
    const handleGrantBonus = async (userId: string, currentWallet: string) => {
        const { value: bonusAmount } = await Swal.fire({
            title: 'INJECT BONUS XP',
            input: 'number',
            inputLabel: `Amount for ${currentWallet || userId}`,
            inputPlaceholder: 'e.g. 500',
            showCancelButton: true,
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535',
            inputValidator: (value) => {
                if (!value || isNaN(parseInt(value))) {
                    return 'You need to write a valid number!'
                }
            }
        });

        if (bonusAmount) {
            try {
                const res = await api.post('/api/airdrop/admin/bonus-xp', { userId, bonusXP: parseInt(bonusAmount) });
                Swal.fire({
                    title: 'BONUS INJECTED',
                    text: res.data.message,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchParticipants();
            } catch (error) {
                Swal.fire('Error', 'Injection failed', 'error');
            }
        }
    };


    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Wallet,XP,Referrals,Tier\n";
        participants.forEach(p => {
            csvContent += `${p.email || p.id},${p.points},${p.referralCount},${p.accountType}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: 'CRITICAL WIPE?',
            text: "Reset ALL AlphaBAG data, tasks, and balances? UNAUTHORIZED ENTRIES WILL BE LOST.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'WIPE CORE',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/api/airdrop/admin/reset', {});
                Swal.fire('CORE WIPED', 'All data neutralized.', 'success');
                fetchTasks();
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Target className="text-alphabag-yellow" /> Network Hub
                    </h2>
                    <div className="flex gap-4">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={triggerSnapshot}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest text-[10px]"
                        >
                            AWARD TOP 100 REFERRALS
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={exportCSV}
                            className="bg-alphabag-yellow text-black font-black tracking-widest text-[10px]"
                        >
                            <Download size={14} className="mr-2" /> EXPORT NETWORK
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 w-max">
                    <button
                        onClick={() => setViewMode('missions')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'missions' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Mission Management
                    </button>
                    <button
                        onClick={() => setViewMode('intelligence')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'intelligence' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Network Intelligence
                    </button>
                    <button
                        onClick={() => setViewMode('founders')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'founders' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Founder Elite
                    </button>
                </div>

                {viewMode === 'missions' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                            <div>
                                <h3 className="font-black text-white uppercase tracking-widest">Task Deployment</h3>
                                <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Active Missions: {tasks.length}</p>
                            </div>
                            <Button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]">
                                {showTaskForm ? 'ABORT' : <><Plus size={16} className="mr-2" /> CREATE MISSION</>}
                            </Button>
                        </div>

                        {showTaskForm && (
                            <form onSubmit={handleCreateTask} className="bg-black/40 border border-alphabag-yellow/50 rounded-2xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Title</label>
                                        <input required type="text" placeholder="e.g. Daily Check-in" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">XP Reward</label>
                                        <input required type="number" min="1" value={newTask.rewardXP} onChange={e => setNewTask({ ...newTask, rewardXP: parseInt(e.target.value) })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Description</label>
                                    <textarea required value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Action URL (Optional)</label>
                                        <input type="url" placeholder="https://..." value={newTask.actionUrl} onChange={e => setNewTask({ ...newTask, actionUrl: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Frequency</label>
                                        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none">
                                            <option value="once">Genesis (Once)</option>
                                            <option value="daily">Standard (Daily)</option>
                                        </select>
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoading} className="bg-alphabag-yellow text-black uppercase font-black w-full h-14 tracking-[0.2em]">DEPLOY MISSION</Button>
                            </form>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {tasks.map(t => (
                                <div key={t.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <Zap size={24} className={t.type === 'DAILY' ? 'text-blue-400' : 'text-alphabag-yellow'} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-white uppercase tracking-wider">{t.title}</h4>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.type === 'daily' ? 'bg-blue-500/10 text-blue-400' : 'bg-alphabag-yellow/10 text-alphabag-yellow'}`}>{t.type}</span>
                                            </div>
                                            <p className="text-xs text-alphabag-muted mt-1">{t.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest">Reward</div>
                                            <div className="text-xl font-black text-white">{t.rewardXP} <span className="text-[10px] text-alphabag-yellow tracking-tighter">XP</span></div>
                                        </div>
                                        <button onClick={() => handleDeleteTask(t.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && <div className="text-center p-12 text-alphabag-muted italic bg-black/20 rounded-2xl border border-white/5 border-dashed">No missions active. Expand the hub core above.</div>}
                        </div>
                    </div>
                ) : viewMode === 'intelligence' ? (
                    <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="font-black text-white uppercase tracking-widest">User Intelligence Log</h3>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[9px] uppercase text-alphabag-muted font-black tracking-widest">
                                    <tr>
                                        <th className="p-6">Member Identity (Alias)</th>
                                        <th className="p-6">BSC Wallet / Proof</th>
                                        <th className="p-6">Recruits</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-right">Power (XP)</th>
                                        <th className="p-6 text-right">Admin Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {participants.map((p, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-zinc-400 text-[9px] truncate max-w-[150px]">{p.wallet || 'No Wallet'}</span>
                                                    {p.xLink && (
                                                        <a href={p.xLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-[9px] flex items-center gap-1">
                                                            Proof Link <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6 font-black text-white">{p.referralCount || 0}</td>
                                            <td className="p-6">
                                                <div className="flex justify-center flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${p.isFounderAirdrop ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/20'}`}>
                                                        {p.isFounderAirdrop ? 'FOUNDER' : 'MISSION READY'}
                                                    </span>
                                                    {p.airdropSubmittedAt && <span className="text-[7px] text-zinc-500 font-bold">{new Date(p.airdropSubmittedAt).toLocaleDateString()}</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="text-lg font-black text-alphabag-yellow group-hover:drop-shadow-[0_0_10px_rgba(252,213,53,0.3)] transition-all">{(p.points || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => handleGrantBonus(p.id, p.wallet)}
                                                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    + GRANT BONUS
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {participants.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-alphabag-muted italic">No network members found. Launch the hub to recruit.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {participants.filter(p => p.isFounderRequest || p.projectName).map((p, i) => (
                            <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                <div className="absolute top-0 right-0 p-4">
                                    <button 
                                        onClick={() => handleApproveFounder(p.id, p.isFounderAirdrop)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.isFounderAirdrop ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white'}`}
                                    >
                                        {p.isFounderAirdrop ? 'REVOKE STATUS' : 'APPROVE FOUNDER'}
                                    </button>
                                </div>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <Shield className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.projectName || 'Unnamed Project'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">{p.projectTicker || 'TBA'}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">via {p.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Project Vision</div>
                                        <p className="text-xs text-zinc-300 leading-relaxed italic line-clamp-3">"{p.projectManifesto || 'No manifesto provided.'}"</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {p.projectWebsite && (
                                            <a href={p.projectWebsite} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                                                <Globe size={14} /> Website
                                            </a>
                                        )}
                                        {p.projectSocial && (
                                            <a href={p.projectSocial} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                                                <ExternalLink size={14} /> View Socials
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {participants.filter(p => p.isFounderRequest || p.projectName).length === 0 && (
                            <div className="md:col-span-2 text-center p-20 text-alphabag-muted italic bg-black/20 rounded-2xl border border-white/5 border-dashed">
                                No founder applications submitted. Recruitment hub is currently idle.
                            </div>
                        )}
                    </div>
                )
}
            </div>

            {/* Mission Lifecycle Controls */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <RefreshCw className="text-alphabag-yellow" size={20} /> Mission Lifecycle Control
                        </h3>
                        <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Pause, export, wipe, and restart the Alpha Mission for TGE.</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${missionPaused ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${missionPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></span>
                        {missionPaused ? 'PAUSED' : 'LIVE'}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={handlePauseMission}
                        className={`flex items-center justify-center gap-3 p-5 rounded-2xl border font-black text-sm uppercase tracking-widest transition-all ${missionPaused ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'}`}
                    >
                        {missionPaused ? <><PlayCircle size={20} /> RESUME MISSION</> : <><PauseCircle size={20} /> PAUSE MISSION</>}
                    </button>
                    <button
                        onClick={handleExportData}
                        className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-black text-sm uppercase tracking-widest transition-all"
                    >
                        <DatabaseBackup size={20} /> EXPORT MEMBER DATA
                    </button>
                    <button
                        onClick={handleFullWipe}
                        className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-black text-sm uppercase tracking-widest transition-all"
                    >
                        <Trash2 size={20} /> FULL MISSION WIPE
                    </button>
                </div>
                <p className="text-[9px] text-alphabag-muted text-center font-bold uppercase tracking-widest">Always export member data before executing a full wipe.</p>
            </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Hub Reset</h3>
                        <p className="text-xs text-alphabag-muted mt-1 uppercase tracking-widest font-bold">This eliminates ALL missions, balances, and network data.</p>
                    </div>
                </div>
                <Button onClick={handleReset} variant="danger" className="bg-red-600 hover:bg-red-500 text-white font-black uppercase px-8 h-12 text-[10px]">EXECUTE RESET</Button>
            </div>
        </div>
    );
};
