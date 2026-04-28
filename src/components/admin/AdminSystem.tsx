
import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Power, Activity, Server, RefreshCw } from 'lucide-react';

interface AdminSystemProps {
    onReboot: () => void;
}

export const AdminSystem: React.FC<AdminSystemProps> = ({ onReboot }) => {
    const { token } = useAuth();
    const [isRebooting, setIsRebooting] = useState(false);

    const handleReboot = async () => {
        if (!confirm("⚠️ NETWORK RESET WARNING ⚠️\n\nThis will flush all caches (Price, Portfolio, AI) and reset system state.\n\nAre you sure you want to RESTART?")) return;

        setIsRebooting(true);
        try {
            await api.post('/api/admin/reboot', {});
            alert(`✅ Hub Initialization Success`);
            onReboot(); // Trigger parent refresh
        } catch (error) {
            alert("❌ Restart Failed: Network Unresponsive");
        } finally {
            setIsRebooting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 border-l-4 border-l-red-500 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center">
                            <Server className="mr-3 text-red-500" />
                            Emergency Controls
                        </h3>
                        <p className="text-alphabag-subtext mt-2 text-sm max-w-lg">
                            Use these controls only when system stability is compromised. Rebooting will clear the Redis/Memory cache and reset API rate limits.
                        </p>
                    </div>
                    <Button
                        onClick={handleReboot}
                        className="bg-alphabag-red hover:bg-red-600 text-white border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] px-8 py-4 h-auto"
                    >
                        <div className="flex flex-col items-center">
                            <Power size={24} className={`mb-1 ${isRebooting ? 'animate-pulse' : ''}`} />
                            <span className="font-black text-sm uppercase tracking-widest">
                                {isRebooting ? 'RESETTING...' : 'RESTART HUB'}
                            </span>
                        </div>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-alphabag-black/20 border border-alphabag-gray rounded-xl p-6 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center">
                        <Activity size={24} className="text-alphabag-subtext mr-3" />
                        <div>
                            <div className="font-bold text-white">Database Integrity Check</div>
                            <div className="text-[10px] text-alphabag-subtext">Last run: 24h ago</div>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>Run Check</Button>
                </div>

                <div className="bg-alphabag-black/20 border border-alphabag-gray rounded-xl p-6 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center">
                        <RefreshCw size={24} className="text-alphabag-subtext mr-3" />
                        <div>
                            <div className="font-bold text-white">Flush CDN Cache</div>
                            <div className="text-[10px] text-alphabag-subtext">Manual trigger</div>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>Flush</Button>
                </div>
            </div>
        </div>
    );
};
