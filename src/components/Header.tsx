
import React, { useEffect, useState } from 'react';
import { Menu, Search, X, TrendingUp, Briefcase, LogOut, ChevronDown, ShieldCheck, Layers, Settings, Bell, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGlobalStats } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { TierBadge } from './ui/TierBadge';
import { Button } from './ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { NotificationCenter } from './NotificationCenter';
import { useWallet } from '../context/WalletContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}


export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [stats, setStats] = useState<any>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const { portfolioItems } = useWallet();
  const [cexTotal, setCexTotal] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '1',
      type: 'SYSTEM',
      title: 'Phase 1 Active',
      message: 'AlphaBAG Protocol Hub is live. Complete missions to secure your TGE allocation.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);
  const navigate = useNavigate();
  const { open } = useWeb3Modal();

  const attemptConnect = async () => {
    try {
      await open();
    } catch (e) {
      console.error("Failed to open Web3Modal", e);
    }
  };

  useEffect(() => {
    fetchGlobalStats().then(setStats);
    
    // Calculate CEX Total
    const savedCex = localStorage.getItem('alphabag_cex_connections');
    if (savedCex) {
        try {
            const parsed = JSON.parse(savedCex);
            const total = parsed.reduce((acc: number, item: any) => acc + (item.balance || 0), 0);
            setCexTotal(total);
        } catch (e) { console.error("Error parsing CEX data in Header", e); }
    }
  }, []);

  const dexTotal = portfolioItems?.reduce((acc, item) => acc + (item.value || 0), 0) || 0;
  const totalAssets = dexTotal + cexTotal;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/markets?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  const handleNavigateToSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-alphabag-black/60 backdrop-blur-md border-b border-alphabag-border z-50 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md text-alphabag-muted hover:text-zinc-50 hover:bg-white/10 md:hidden transition-all duration-200 active:scale-[0.98]"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-alphabag-yellow text-black flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(252,213,53,0.3)]">
              <Briefcase size={20} fill="currentColor" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-zinc-50 tracking-tight uppercase">Alpha<span className="text-alphabag-yellow">BAG</span></span>
          </Link>

          <nav className="hidden md:flex items-center ml-10 space-x-8">

            <Link to="/markets" className="text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted hover:text-white transition-colors">
              Markets
            </Link>
            <Link to="/airdrop" className="text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted hover:text-white transition-colors">
              Airdrop
            </Link>
          </nav>

          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-6 ml-8 text-xs text-alphabag-muted border-l border-alphabag-border pl-6">
              <div className="flex flex-col">
                <span className="uppercase tracking-wider font-bold opacity-70 text-[9px] flex items-center gap-1"><Briefcase size={10} className="text-alphabag-yellow"/> Total Holding Assets</span>
                <span className="text-zinc-50 font-bold tabular-data text-[13px]">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-alphabag-muted" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search coin, pair, or contract..."
            className="w-full bg-alphabag-black border border-alphabag-border text-zinc-50 text-sm rounded-lg focus:ring-1 focus:ring-alphabag-yellow focus:border-alphabag-yellow block pl-10 p-2.5 placeholder:text-alphabag-muted/50 outline-none transition-all duration-200"
          />
        </form>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                    }}
                    className={`p-2 rounded-xl transition-all duration-200 active:scale-[0.98] relative ${showNotifications ? 'bg-alphabag-yellow text-black' : 'bg-white/5 text-alphabag-muted hover:text-white hover:bg-white/10'}`}
                >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-alphabag-red rounded-full border-2 border-alphabag-black animate-pulse"></div>
                    )}
                </button>

                <button
                    onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                    }}
                    className="flex items-center space-x-3 bg-alphabag-black/50 border border-alphabag-border px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
                >
                    <div className="hidden sm:block text-right">
                    <div className="text-[10px] font-black text-white leading-none mb-0.5">{user?.email?.split('@')[0]}</div>
                    <div className="text-[8px] font-bold text-alphabag-yellow uppercase tracking-widest">BETA ACCESS</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-alphabag-yellow to-orange-500 shadow-inner"></div>
                    <ChevronDown size={14} className={`text-alphabag-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications} 
              />

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-alphabag-dark/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-2 animate-fade-in z-[100]">
                  <div className="p-4 border-b border-alphabag-border mb-1">
                    <p className="text-[9px] text-alphabag-muted font-bold uppercase mb-1 tracking-widest">Authenticated Member</p>
                    <p className="text-xs text-zinc-50 font-bold truncate">{user?.email}</p>
                    <div className="mt-3">
                      <span className="px-2 py-1 bg-alphabag-yellow/20 text-alphabag-yellow text-[10px] font-black uppercase rounded-lg border border-alphabag-yellow/30">
                        EARLY ACCESS
                      </span>
                    </div>
                  </div>


                  {user?.isAdmin && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-black text-alphabag-yellow hover:bg-alphabag-yellow/5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center"
                    >
                      <ShieldCheck size={14} className="mr-2" /> Admin Core Panel
                    </button>
                  )}

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-50 hover:bg-white/5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center mb-1 group"
                  >
                    <div className="mr-2 p-1.5 bg-alphabag-yellow/10 rounded-lg group-hover:bg-alphabag-yellow text-alphabag-yellow group-hover:text-black transition-colors">
                      <Briefcase size={14} />
                    </div>
                    My Timeline
                  </button>

                  <button
                    onClick={handleNavigateToSettings}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-50 hover:bg-white/5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center mb-1 group"
                  >
                    <div className="mr-2 p-1.5 bg-white/5 rounded-lg group-hover:bg-white/20 transition-colors">
                      <Settings size={14} />
                    </div>
                    Hub Settings
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-alphabag-red hover:bg-alphabag-red/10 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center"
                  >
                    <LogOut size={14} className="mr-2" /> Disconnect Hub
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/settings')}
              className="font-black px-6 uppercase tracking-widest transition-all duration-200 active:scale-[0.98]"
              leftIcon={<Briefcase size={14} />}
            >
              Start Portfolio
            </Button>
          )}
        </div>
      </header>
    </>
  );
};
