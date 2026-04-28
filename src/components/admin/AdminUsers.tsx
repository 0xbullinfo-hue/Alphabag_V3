
import React from 'react';
import { Server, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

interface UserData {
    id: string;
    email: string;
    tier: string;
    isAdmin: boolean;
    lastActive: string;
    location?: string;
    visits?: number;
}

interface AdminUsersProps {
    users: UserData[];
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users }) => {
    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-alphabag-gray flex justify-between items-center bg-alphabag-black/20">
                <div className="flex items-center space-x-3">
                    <Server size={20} className="text-alphabag-yellow" />
                    <h3 className="font-black text-white uppercase tracking-widest text-sm">Registered Member Database</h3>
                </div>
                <div className="text-[10px] bg-alphabag-yellow/20 text-alphabag-yellow px-2 py-1 rounded font-bold uppercase">
                    Admin Access Only
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-alphabag-black/40 border-b border-alphabag-gray">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Member Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Access Tier</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Role</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.1em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-alphabag-gray/50 text-sm">
                        {users.map((u, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{u.email}</div>
                                    <div className="text-[10px] text-alphabag-subtext font-mono opacity-50 flex items-center gap-2">
                                        <span>{u.id.substring(0, 8)}...</span>
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
                                    {u.isAdmin ? (
                                        <span className="flex items-center text-xs font-bold text-alphabag-blue">
                                            <Shield size={12} className="mr-1" /> ADMIN
                                        </span>
                                    ) : (
                                        <div className="text-xs text-alphabag-subtext">
                                            {/* @ts-ignore */}
                                            <div className="font-bold">{u.visits || 0} Visits</div>
                                            <div className="text-[9px]">Last: {new Date(u.lastActive || Date.now()).toLocaleDateString()}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-alphabag-gray text-alphabag-subtext hover:text-white">
                                            EDIT
                                        </Button>
                                        <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white">
                                            BAN
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
