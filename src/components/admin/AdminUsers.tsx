
import React, { useState } from 'react';
import { Server, Shield, AlertTriangle, Ban, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

interface UserData {
    id: string;
    email: string;
    tier: string;
    isAdmin: boolean;
    lastActive: string;
    location?: string;
    visits?: number;
    strikes?: number;
    isBanned?: boolean;
    items?: number;
    bagTokens?: number;
    submittedWallet?: string;
}

interface AdminUsersProps {
    users: UserData[];
    onRefresh?: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, onRefresh }) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleIssueStrike = async (userId: string, email: string) => {
        const result = await Swal.fire({
            title: 'ISSUE STRIKE',
            html: `<p class="text-xs text-zinc-400">Issue a protocol violation strike to <strong class="text-white">${email}</strong>.<br/>At 5 strikes the account is permanently banned.</p>`,
            input: 'text',
            inputPlaceholder: 'Reason for strike (optional)',
            inputAttributes: { style: 'background:#1a1a1a;color:white;border:1px solid #444;border-radius:8px;padding:10px;' },
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#fcd535',
            confirmButtonText: 'ISSUE STRIKE',
            cancelButtonText: 'Cancel',
            background: '#0a0a0a',
            color: '#fff',
        });
        if (!result.isConfirmed) return;

        setLoadingId(userId);
        try {
            const res = await api.post('/api/airdrop/admin/strike', { userId, reason: result.value || 'Protocol violation' });
            await Swal.fire({
                title: res.data.isBanned ? '⛔ USER BANNED' : '⚠️ STRIKE ISSUED',
                text: res.data.message,
                icon: res.data.isBanned ? 'error' : 'success',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
            onRefresh?.();
        } catch (e: any) {
            Swal.fire('ERROR', e.response?.data?.error || 'Failed to issue strike', 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleUnban = async (userId: string, email: string) => {
        const result = await Swal.fire({
            title: 'UNBAN MEMBER',
            html: `<p class="text-xs text-zinc-400">This will reinstate <strong class="text-white">${email}</strong> and reset their strike count to 0.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            confirmButtonText: 'UNBAN & RESET',
            background: '#0a0a0a',
            color: '#fff',
        });
        if (!result.isConfirmed) return;

        setLoadingId(userId);
        try {
            await api.post('/api/airdrop/admin/unban', { userId });
            Swal.fire({ title: 'MEMBER REINSTATED', text: 'Account restored. Strikes reset to 0.', icon: 'success', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
            onRefresh?.();
        } catch (e: any) {
            Swal.fire('ERROR', e.response?.data?.error || 'Failed to unban', 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const getStrikeBadge = (strikes: number = 0, isBanned: boolean = false) => {
        if (isBanned) return <span className="text-[8px] font-black px-2 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/20 uppercase">BANNED</span>;
        if (strikes === 0) return <span className="text-[8px] font-black px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20 uppercase">Clean</span>;
        if (strikes >= 3) return <span className="text-[8px] font-black px-2 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20 uppercase">{strikes}/5 ⚠️</span>;
        return <span className="text-[8px] font-black px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20 uppercase">{strikes}/5</span>;
    };

    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-alphabag-gray flex justify-between items-center bg-alphabag-black/20">
                <div className="flex items-center space-x-3">
                    <Server size={20} className="text-alphabag-yellow" />
                    <h3 className="font-black text-white uppercase tracking-widest text-sm">Registered Member Database</h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] bg-alphabag-yellow/20 text-alphabag-yellow px-2 py-1 rounded font-bold uppercase">
                        {users.length} Members
                    </div>
                    {onRefresh && (
                        <button onClick={onRefresh} className="p-1.5 text-alphabag-subtext hover:text-white transition-colors rounded-lg hover:bg-white/5">
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-alphabag-black/40 border-b border-alphabag-gray">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Member Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Access Tier</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">ITEMS / BAG</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">BSC Wallet</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Strike Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-alphabag-gray/50 text-sm">
                        {users.map((u, i) => (
                            <tr key={i} className={`hover:bg-white/5 transition-colors group ${u.isBanned ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{u.email}</div>
                                    <div className="text-[10px] text-alphabag-subtext font-mono opacity-50 flex items-center gap-2">
                                        <span>{u.id.substring(0, 8)}...</span>
                                        {u.isAdmin && <span className="text-alphabag-yellow font-black">ADMIN</span>}
                                        {/* @ts-ignore */}
                                        {u.location && <span className="text-alphabag-yellow">• {u.location}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-wide ${u.tier === 'ULTIMATE'
                                        ? 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/50 shadow-[0_0_10px_rgba(252,213,53,0.2)]'
                                        : 'bg-white/5 text-alphabag-subtext border-white/10'
                                        }`}>
                                        {u.tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-bold text-white">{(u.items || 0).toLocaleString()} <span className="text-alphabag-subtext font-normal text-[10px]">ITEMS</span></div>
                                    <div className="text-[10px] text-alphabag-yellow font-mono">{(u.bagTokens || 0).toLocaleString()} <span className="text-alphabag-subtext font-normal">$BAG</span></div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.submittedWallet ? (
                                        <span className="font-mono text-[10px] text-alphabag-subtext">
                                            {u.submittedWallet.slice(0, 6)}···{u.submittedWallet.slice(-4)}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-alphabag-subtext italic opacity-40">Not submitted</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {getStrikeBadge(u.strikes, u.isBanned)}
                                        {!u.isAdmin && !u.isBanned && u.strikes !== undefined && u.strikes > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {Array.from({ length: 5 }).map((_, si) => (
                                                    <div key={si} className={`w-2.5 h-1.5 rounded-sm ${si < (u.strikes || 0) ? 'bg-red-500' : 'bg-white/10'}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!u.isAdmin && (
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {u.isBanned ? (
                                                <Button
                                                    size="sm"
                                                    disabled={loadingId === u.id}
                                                    onClick={() => handleUnban(u.id, u.email)}
                                                    className="h-7 text-[10px] bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 flex items-center gap-1"
                                                >
                                                    <CheckCircle2 size={10} /> UNBAN
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    disabled={loadingId === u.id}
                                                    onClick={() => handleIssueStrike(u.id, u.email)}
                                                    className="h-7 text-[10px] bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/20 flex items-center gap-1"
                                                >
                                                    <ShieldAlert size={10} /> STRIKE
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-alphabag-subtext text-[10px] uppercase font-bold opacity-30">
                                    No members registered yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
