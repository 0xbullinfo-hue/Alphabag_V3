import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { bsc } from 'wagmi/chains';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  logout: () => void;
  upgradeToUltimate: (walletAddress: string) => Promise<boolean>;
  updateAiUsage: (seconds: number) => void;
  completeOnboarding: (accountType: 'FOUNDER' | 'TRADER', profileData: any) => Promise<void>;
  siweLogin: (address: string, signature: string, message: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration for eligibility access
const BAG_TOKEN_ADDRESS = '0x12a5b616d0042456345ec46682cf8c105658e0a1'; // Placeholder address
const PRO_THRESHOLD = 10000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Token Balance check for Pro status
  const { data: bagBalance } = useBalance({
    address: address,
    token: BAG_TOKEN_ADDRESS as `0x${string}`,
    chainId: bsc.id,
    watch: true
  });

  // Beta period: auto-grant ULTIMATE to all users on first login
  useEffect(() => {
    if (user && !user.isPro) {
      const updatedUser = { ...user, isPro: true, tier: 'ULTIMATE' as const };
      setUser(updatedUser);
      sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
    }
  }, [user?.id]); // Only re-run when the user identity changes, not every state update

  // Admin Allowlist (Strict Wallet Access)
  const ADMIN_WALLETS = [
    '0x1234567890123456789012345678901234567890', // Placeholder
    // Add User's Wallet Here
  ];

  const siweLogin = async (address: string, signature: string, message: string) => {
    try {
      setIsLoading(true);
      
      const { api } = await import('../services/api');
      
      // Get referral code if exists
      const refCode = sessionStorage.getItem('alphabag_ref_code');
      
      const res = await api.post('/api/auth/siwe', { 
        address, 
        signature, 
        message, 
        refCode 
      });

      if (res.data.user && res.data.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data.user));
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.response?.data) {
        console.error("SIWE Server Error:", e.response.data);
      } else {
        console.error("SIWE Network Error:", e.message);
      }
      setIsLoading(false);
      throw e;
    }
  };

  // Auto-login with wallet disabled in favor of SIWE as per new mandate
  useEffect(() => {
    if (!address && user && user.id.startsWith('0x')) {
      console.log("Wallet disconnected, logging out.");
      logout();
    }
  }, [address]);

  // Auto-logout on Inactivity (Security)
  useEffect(() => {
    const TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 Hours

    // Key for local storage to persist activity across tabs
    const STORAGE_KEY = 'alphabag_last_active';

    const updateActivity = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    const checkActivity = () => {
      if (!user) return; // Only track if logged in

      const lastActiveStr = localStorage.getItem(STORAGE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr) : Date.now();
      const now = Date.now();

      if (now - lastActive > TIMEOUT_MS) {
        console.warn("Session expired due to inactivity.");
        logout();
      }
    };

    // Listeners for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Initial set
    updateActivity();

    // Check every minute
    const interval = setInterval(checkActivity, 60000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, [user]);

  // Session Restoration — runs once on mount to restore user state from sessionStorage
  useEffect(() => {
    const savedUserStr = sessionStorage.getItem('alphabag_user');
    const savedToken = sessionStorage.getItem('alphabag_token');

    if (savedUserStr && savedToken) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        // Restore ALL session types (SIWE wallet users and email users)
        setUser(savedUser);
        setToken(savedToken);
        console.log("Session restored for:", savedUser.email || savedUser.id);
      } catch (e) {
        console.error("Failed to parse saved user — clearing corrupt session.");
        sessionStorage.removeItem('alphabag_user');
        sessionStorage.removeItem('alphabag_token');
      } finally {
        setIsLoading(false);
      }
    } else {
      // No saved session — guest mode
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    disconnect();
  };

  const upgradeToUltimate = async (walletAddress: string): Promise<boolean> => {
    if (!user) return false;
    const updatedUser: User = { ...user, tier: 'ULTIMATE', verifiedWallet: walletAddress };
    setUser(updatedUser);
    sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
    return true;
  };

  const updateAiUsage = (seconds: number) => {
    if (!user || user.tier === 'ULTIMATE' || user.isPro) return;
    const updated = { ...user, alphaAiUsageSeconds: (user.alphaAiUsageSeconds || 0) + seconds };
    setUser(updated);
  };

  const refreshUser = async () => {
    try {
      const { api } = await import('../services/api');
      const res = await api.get('/api/auth/me');
      if (res.data) {
        setUser(res.data);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('[AUTH] Failed to refresh user profile:', err);
    }
  };


  const completeOnboarding = async (accountType: 'FOUNDER' | 'TRADER', profileData: any) => {
    if (!user) return;
    
    // Simulate API update
    const updatedUser = { 
      ...user, 
      accountType, 
      onboardingComplete: true,
      // In a real app, profileData would be saved to DB/linked Project
    };
    
    setUser(updatedUser);
    sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, token,
      logout, upgradeToUltimate, updateAiUsage, siweLogin, completeOnboarding, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};