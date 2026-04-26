
import React from 'react';
import { Activity, Cpu, Database, Users } from 'lucide-react';

interface SystemStats {
    uptime: number;
    memory: any;
    activeUsers: number;
    cacheStats: {
        portfolio: any;
        price: any;
        ai: any;
    };
    systemHealth: string;
    lastReboot: string;
    freeUsers?: number;
    ultimateUsers?: number;
    totalVisits?: number;
}

interface AdminOverviewProps {
    stats: SystemStats | null;
    registeredCount: number;
    activeCount: number;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ stats, registeredCount, activeCount }) => {
    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
            {/* UPTIME */}
            <div className="bg-alphabag-dark border border-alphabag-gray/50 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Activity size={64} /></div>
                <p className="text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.2em] mb-2">System Uptime</p>
                <h3 className="text-3xl font-black text-white">{stats ? formatUptime(stats.uptime) : '-'}</h3>
                <div className="mt-2 text-xs font-bold text-green-500 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Stable
                </div>
            </div>

            {/* MEMORY */}
            <div className="bg-alphabag-dark border border-alphabag-gray/50 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Cpu size={64} /></div>
                <p className="text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.2em] mb-2">Memory Load</p>
                <h3 className="text-3xl font-black text-white">{stats ? Math.round(stats.memory?.rss / 1024 / 1024) : '-'} <span className="text-sm text-alphabag-subtext">MB</span></h3>
                <div className="mt-2 text-xs font-bold text-alphabag-blue flex items-center">
                    RSS Usage
                </div>
            </div>

            {/* CACHE HEALTH */}
            <div className="bg-alphabag-dark border border-alphabag-gray/50 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Database size={64} /></div>
                <p className="text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.2em] mb-2">Cache Layers</p>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-xs font-bold text-alphabag-subtext">
                        <span>Portfolio</span>
                        <span className="text-white">{stats?.cacheStats?.portfolio?.keys || 0} keys</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-alphabag-subtext">
                        <span>Prices</span>
                        <span className="text-white">{stats?.cacheStats?.price?.keys || 0} keys</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-alphabag-subtext">
                        <span>AI Briefs</span>
                        <span className="text-white">{stats?.cacheStats?.ai?.keys || 0} keys</span>
                    </div>
                </div>
            </div>

            {/* TOTAL USERS */}
            <div className="bg-alphabag-dark border border-alphabag-gray/50 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Users size={64} /></div>
                <p className="text-[10px] font-black text-alphabag-subtext uppercase tracking-[0.2em] mb-2">Member Database</p>
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-3xl font-black text-white">{registeredCount}</h3>
                        <p className="text-[10px] text-alphabag-subtext uppercase font-bold">Total Members</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-alphabag-yellow">{stats?.ultimateUsers || 0} ULTIMATE</div>
                        <div className="text-xs font-bold text-alphabag-subtext">{stats?.freeUsers || 0} Free</div>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-alphabag-border text-[10px] font-bold text-alphabag-green flex items-center justify-between">
                    <span>{activeCount} Active Sessions</span>
                    <span>{(stats as any)?.totalVisits || 0} Total Visits</span>
                </div>
            </div>
        </div>
    );
};
