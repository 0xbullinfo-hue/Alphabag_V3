
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from './ui/Button';
import { X, Plus, Trash2, Wallet, RefreshCw, Layers } from 'lucide-react';
import { Chain } from '../types';

interface WalletManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ isOpen, onClose }) => {
    const { trackedWallets, addTrackedWallet, removeTrackedWallet, refreshBalances, isSyncing } = useWallet();
    const [isAdding, setIsAdding] = useState(false);
    const [newAddress, setNewAddress] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newChain, setNewChain] = useState<Chain>('ETH'); // Default to ETH/EVM
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newAddress) return;

        // Basic validation
        if (newChain === 'SOL' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newAddress)) {
            setError('Invalid Solana Address');
            return;
        }
        if (newChain !== 'SOL' && !/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
            setError('Invalid EVM Address');
            return;
        }

        const res = await addTrackedWallet(newAddress, newLabel || 'My Wallet', newChain, 'PORTFOLIO');

        if (res?.success) {
            setIsAdding(false);
            setNewAddress('');
            setNewLabel('');
            setError('');
        } else {
            setError(res?.error || 'Failed to add wallet');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-alphabag-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-alphabag-gray/50 bg-white/5">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
                        <Layers className="mr-2 text-alphabag-yellow" size={24} />
                        Wallet Manager
                    </h2>
                    <button onClick={onClose} className="text-alphabag-subtext hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-alphabag-subtext uppercase tracking-widest">
                            Active Connections ({trackedWallets.filter(w => w.type === 'PORTFOLIO').length})
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAdding(!isAdding)}
                            className={isAdding ? 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/50' : 'border-alphabag-gray/50 hover:bg-white/5'}
                        >
                            <Plus size={14} className="mr-1" /> {isAdding ? 'Cancel' : 'Add Wallet'}
                        </Button>
                    </div>

                    {/* ADD FORM */}
                    {isAdding && (
                        <div className="bg-alphabag-black/50 p-4 rounded-xl border border-alphabag-gray mb-6 animate-fade-in-up">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-alphabag-subtext uppercase mb-2 block tracking-wider">Chain Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNewChain('ETH')}
                                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${newChain !== 'SOL' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-transparent border-alphabag-gray text-alphabag-subtext hover:bg-white/5'}`}
                                        >
                                            EVM (Eth/Base/Bsc)
                                        </button>
                                        <button
                                            onClick={() => setNewChain('SOL')}
                                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${newChain === 'SOL' ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]' : 'bg-transparent border-alphabag-gray text-alphabag-subtext hover:bg-white/5'}`}
                                        >
                                            SOLANA
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-alphabag-subtext uppercase mb-2 block tracking-wider">Wallet Address</label>
                                    <input
                                        type="text"
                                        className="w-full bg-alphabag-black/50 border border-alphabag-gray rounded-lg px-4 py-3 text-white text-xs font-mono focus:border-alphabag-yellow focus:ring-1 focus:ring-alphabag-yellow/50 outline-none transition-all placeholder:text-alphabag-subtext/30"
                                        placeholder={newChain === 'SOL' ? "Paste Solana Address..." : "Paste 0x Address..."}
                                        value={newAddress}
                                        onChange={(e) => setNewAddress(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-alphabag-subtext uppercase mb-2 block tracking-wider">Label (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-alphabag-black/50 border border-alphabag-gray rounded-lg px-4 py-3 text-white text-xs focus:border-alphabag-yellow focus:ring-1 focus:ring-alphabag-yellow/50 outline-none transition-all placeholder:text-alphabag-subtext/30"
                                        placeholder="e.g. Degen Vault"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                                <Button onClick={handleAdd} className="w-full bg-alphabag-yellow text-black font-black uppercase tracking-widest py-3 hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-alphabag-yellow/20">
                                    Track Wallet
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* WALLET LIST */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                        {trackedWallets.filter(w => w.type === 'PORTFOLIO').length === 0 && !isAdding && (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-alphabag-gray/30 rounded-xl bg-white/[0.02]">
                                <Wallet size={40} className="text-alphabag-subtext mb-3 opacity-50" />
                                <p className="text-sm font-bold text-alphabag-text mb-1">No Connected Wallets</p>
                                <p className="text-xs text-alphabag-subtext max-w-[200px]">Add a wallet to start tracking your net worth across multiple chains.</p>
                            </div>
                        )}

                        {trackedWallets.filter(w => w.type === 'PORTFOLIO').map(wallet => (
                            <div key={wallet.id} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-xl border border-transparent hover:border-alphabag-gray/50 hover:bg-white/[0.05] transition-all group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${wallet.chain === 'SOL'
                                            ? 'bg-gradient-to-br from-purple-500/20 to-purple-900/20 text-purple-400 border border-purple-500/20'
                                            : 'bg-gradient-to-br from-blue-500/20 to-blue-900/20 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        <Layers size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-bold text-white truncate">{wallet.label}</p>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${wallet.chain === 'SOL' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>{wallet.chain === 'SOL' ? 'SOL' : 'EVM'}</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-alphabag-subtext truncate opacity-70 group-hover:opacity-100 transition-opacity">{wallet.address}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeTrackedWallet(wallet.id)}
                                    className="p-2 text-alphabag-subtext hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Remove Wallet"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-alphabag-gray/30 flex justify-between items-center">
                        <div className="text-[10px] text-alphabag-subtext font-medium opacity-60">
                            Updates net worth automatically.
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={refreshBalances}
                            disabled={isSyncing}
                            className={`text-[10px] font-bold uppercase tracking-wider ${isSyncing ? 'text-alphabag-yellow animate-pulse' : 'text-alphabag-subtext hover:text-white'}`}
                        >
                            <RefreshCw size={12} className={`mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Force Sync'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
