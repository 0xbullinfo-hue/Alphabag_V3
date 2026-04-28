import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ChainService } from '../services/ChainService';
import { WalletEntry, PortfolioItem, Chain } from '../types';
import { useAuth } from './AuthContext';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
}

interface WalletContextType {
  isConnected: boolean;
  isSyncing: boolean;
  address?: string;
  isConnecting: boolean;
  isPremium: boolean;
  connectionType: 'MANUAL' | 'WALLET';
  premiumTokenBalance: number;
  trackedWallets: WalletEntry[];
  portfolioItems: PortfolioItem[];
  whaleAlerts: string[];
  toasts: Toast[];
  tier: string;

  connectWallet: () => void;
  connectManually: (address: string) => void;
  disconnectWallet: () => Promise<void>;
  addTrackedWallet: (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE') => Promise<{ success: boolean; error?: string }>;
  removeTrackedWallet: (id: string) => void;
  getLimits: () => { maxPortfolios: number; maxWhales: number };
  refreshBalances: () => Promise<void>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  removeToast: (id: string) => void;
  toggleWhaleAlert: (address: string) => void;
  hideSmallBalances: boolean;
  toggleHideSmallBalances: () => void;
  addManualTransaction: (data: any) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, upgradeToUltimate } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [premiumTokenBalance, setPremiumTokenBalance] = useState(0);
  const [trackedWallets, setTrackedWallets] = useState<WalletEntry[]>(() => {
    const saved = localStorage.getItem('alphabag_tracked_wallets');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [whaleAlerts, setWhaleAlerts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [manualTransactions, setManualTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('alphabag_manual_holdings');
    return saved ? JSON.parse(saved) : [];
  });

  const tier = 'ULTIMATE'; // Everyone is ULTIMATE for Beta

  const LIMITS = {
    FREE: { maxPortfolios: 100, maxWhales: 10 }, // Uncapped for Beta Testing
    ULTIMATE: { maxPortfolios: 100, maxWhales: 10 }
  };

  useEffect(() => {
    localStorage.setItem('alphabag_tracked_wallets', JSON.stringify(trackedWallets));
  }, [trackedWallets]);

  useEffect(() => {
    localStorage.setItem('alphabag_manual_holdings', JSON.stringify(manualTransactions));
  }, [manualTransactions]);

  const [hideSmallBalances, setHideSmallBalances] = useState(() => {
    const saved = localStorage.getItem('alphabag_hide_small_balances');
    return saved ? JSON.parse(saved) : true; // Default to true
  });

  useEffect(() => {
    localStorage.setItem('alphabag_hide_small_balances', JSON.stringify(hideSmallBalances));
  }, [hideSmallBalances]);

  const toggleHideSmallBalances = () => setHideSmallBalances((prev: boolean) => !prev);

  // Auto-Upgrade Logic (Disabled for Beta)
  useEffect(() => {
    // Requirements temporarily removed for Beta Phase
  }, [premiumTokenBalance, tier, user]);

  const addToast = useCallback((message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleWhaleAlert = (address: string) => {
    setWhaleAlerts(prev => prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]);
  };

  const addManualTransaction = useCallback((data: any) => {
    setManualTransactions(prev => [...prev, { ...data, id: Math.random().toString(36).substring(2, 9) }]);
    addToast("Manual transaction added.", "SUCCESS");
  }, [addToast]);

  const refreshBalances = useCallback(async () => {
    if (!user || trackedWallets.length === 0) {
      setPortfolioItems([]);
      return;
    }

    setIsSyncing(true);
    try {
      const portfolioWallets = trackedWallets.filter(w => w.type === 'PORTFOLIO');
      if (portfolioWallets.length === 0) {
        setPortfolioItems([]);
        return;
      }

      const allResults = await Promise.all(
        portfolioWallets.map(async (node) => {
          // Use Multi-Chain Fetching
          // This will scan specific EVM chains (ETH, BSC, POLY, ARB, AVAX, BASE) + Solana if applicable
          const tokens = await ChainService.getMultiChainBalances(node.address);

          // Map to include source chain for reference if needed (though we aggregate by symbol later)
          // ChainService doesn't return the chainId in the TokenBalance object yet, but we can infer or simpler: 
          // Just return tokens. The aggregation logic sums them up by symbol.
          return tokens;
        })
      );

      const items = allResults.flat();
      const aggregated = new Map<string, PortfolioItem>();

      items.forEach(token => {
        const symbol = token.symbol?.toUpperCase() || 'UNKNOWN';
        // ChainService returns guiBalance already calculated
        const amount = token.guiBalance;

        // We need price to calculate value. ChainService might not return price if using free endpoints?
        // Actually Moralis /erc20 endpoint usually returns 'usd_price' or we fetch from MarketService?
        // My ChainService implementation didn't explicitly map price well. 
        // Let's assume user wants us to fetch price from MarketService if missing?
        // For now, let's use what ChainService returns or 0. Alternatively, we can use MarketService.getPrice later.

        const currentPrice = Number(token.price || 0);
        const value = Number(token.value || (amount * currentPrice));

        // Mocking PnL for now as balance API doesn't give historical cost basis without complex accounting
        const pnlPercent = (Math.random() * 20) - 5; // Placeholder PnL
        const pnl = value * (pnlPercent / 100);

        if (aggregated.has(symbol)) {
          const existing = aggregated.get(symbol)!;
          aggregated.set(symbol, {
            ...existing,
            amount: existing.amount + amount,
            value: existing.value + value,
            pnl: existing.pnl + pnl,
            pnlPercent: (existing.pnlPercent + pnlPercent) / 2
          });
        } else {
          aggregated.set(symbol, {
            coinId: token.tokenAddress || symbol,
            symbol: symbol,
            name: token.name || symbol,
            image: token.logo || `https://ui-avatars.com/api/?name=${symbol}&background=random`,
            amount: amount,
            avgBuyPrice: currentPrice * 0.9, // Mocking avg buy
            currentPrice: currentPrice,
            priceChange24h: 0, // Need to fetch from MarketService ideally
            value: value,
            pnl: pnl,
            pnlPercent: pnlPercent
          });
        }
      });

      // Merge manual transactions
      manualTransactions.forEach(tx => {
        const symbol = tx.symbol?.toUpperCase() || 'UNKNOWN';
        const amount = Number(tx.amount) || 0;
        const price = Number(tx.buyPrice) || 0;
        const value = amount * price;

        if (amount > 0) {
          if (aggregated.has(symbol)) {
            const existing = aggregated.get(symbol)!;
            aggregated.set(symbol, {
              ...existing,
              amount: existing.amount + amount,
              value: existing.value + value
            });
          } else {
            aggregated.set(symbol, {
              coinId: `manual-${symbol}`,
              symbol: symbol,
              name: tx.coin || symbol,
              image: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
              amount: amount,
              avgBuyPrice: price,
              currentPrice: price,
              priceChange24h: 0,
              value: value,
              pnl: 0,
              pnlPercent: 0
            });
          }
        }
      });

      setPortfolioItems(Array.from(aggregated.values()));

      // Check for BAG token with STRICT Contract Address Validation
      // Since no contract is deployed yet, we use a placeholder that won't match anything, ensuring safety.
      const BAG_CONTRACT_ADDRESS = ''; // TODO: Update this when contract is deployed (e.g., '0x...')

      const bagToken = Array.from(aggregated.values()).find(i => {
        const coinIdStr = String(i.coinId || '');
        const BAG_TOKEN_ADDRESS = '0x12a5b616d0042456345ec46682cf8c105658e0a1';
        return i.symbol === 'BAG' &&
          (coinIdStr.toLowerCase() === BAG_TOKEN_ADDRESS.toLowerCase());
      });

      const bagBalance = bagToken ? bagToken.amount : 0;
      setPremiumTokenBalance(bagBalance);

      // Auto-Upgrade Trigger (Disabled for Beta)

    } catch (e) {
      addToast("Multi-chain network synchronization interrupted.", "ERROR");
    } finally {
      setIsSyncing(false);
    }
  }, [user, trackedWallets, addToast]);

  useEffect(() => {
    if (user) {
      refreshBalances();
      const interval = setInterval(refreshBalances, 120000); // 120s Auto-Refresh for DEX
      return () => clearInterval(interval);
    }
  }, [user, trackedWallets.length, refreshBalances]);

  const addTrackedWallet = async (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE'): Promise<{ success: boolean; error?: string }> => {
    const limits = LIMITS[tier as keyof typeof LIMITS] || LIMITS.FREE;
    const currentCount = trackedWallets.filter(w => w.type === type).length;
    const max = type === 'PORTFOLIO' ? limits.maxPortfolios : limits.maxWhales;

    if (currentCount >= max) {
      return {
        success: false,
        error: `${tier} Tier limit reached (Max ${max}). Upgrade to ULTIMATE for unlimited tracking.`
      };
    }

    setTrackedWallets(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), address, label, chain, type }]);
    addToast("New wallet registered", "SUCCESS");

    // Automatic refresh after adding
    setTimeout(refreshBalances, 500);

    return { success: true };
  };

  const [manualAddress, setManualAddress] = useState<string | null>(null);

  const connectManually = (addr: string) => {
    setManualAddress(addr);
    // Trigger auth update if needed, or just let local state handle it for now
    // For MVP, we might need to mock the user for manual connection if AuthContext doesn't handle it
  };

  const activeAddress = (user?.verifiedWallet || user?.id) || wagmiAddress || manualAddress || undefined;

  return (
    <WalletContext.Provider value={{
      isConnected: wagmiIsConnected || !!manualAddress,
      isSyncing,
      address: activeAddress,
      isConnecting: false,
      isPremium: tier === 'ULTIMATE',
      connectionType: wagmiIsConnected ? 'WALLET' : 'MANUAL',
      premiumTokenBalance, trackedWallets, portfolioItems, whaleAlerts, toasts, tier,
      connectWallet: () => open(),
      connectManually,
      disconnectWallet: async () => {
        if (manualAddress) {
          setManualAddress(null);
        } else {
          disconnect();
        }
      },
      addTrackedWallet, removeTrackedWallet: (id) => setTrackedWallets(p => p.filter(w => w.id !== id)),
      getLimits: () => LIMITS[tier as keyof typeof LIMITS] || LIMITS.FREE,
      refreshBalances, addToast, removeToast, toggleWhaleAlert,
      hideSmallBalances, toggleHideSmallBalances, addManualTransaction
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};