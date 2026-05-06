import React, { useState, useEffect } from 'react';
import { 
  X, Briefcase, Wallet, Mail, ArrowRight, Loader, 
  Shield, CheckCircle2, Zap, Rocket, Target, Send, Sparkles 
} from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { siweLogin, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'INFO' | 'CONNECT' | 'SIGN' | 'SUCCESS'>('INFO');
  const [carouselStep, setCarouselStep] = useState(0);
  
  const address = wagmiAddress;
  const isConnected = wagmiIsConnected;
  const navigate = useNavigate();

  const carouselSteps = [
    {
      title: "Genesis Phase: AlphaBAG",
      description: "Welcome to the core community. We seek early testers of our utility and we have rewards for all initial supporters with ITEMS through our Genesis Airdrop Protocol.",
      icon: <Rocket className="text-alphabag-yellow" size={32} />,
      color: "from-alphabag-yellow to-yellow-600",
      bg: "bg-alphabag-yellow/10"
    },
    {
      title: "Accumulate ITEMS Daily",
      description: "Execute missions in the Mission Hub to earn ITEMS. Every action brings you closer to the elite Syndicate tier and higher token allocations. Ensure to claim daily/weekly ITEMS.",
      icon: <Zap className="text-blue-400" size={32} />,
      color: "from-blue-400 to-indigo-600",
      bg: "bg-blue-400/10"
    },
    {
      title: "Mission Feedback",
      description: "On your final mission, a constructive feedback is compulsory. We value our testers' honest input to refine our AlphaBAG infrastructure.",
      icon: <Target className="text-alphabag-green" size={32} />,
      color: "from-alphabag-green to-emerald-600",
      bg: "bg-alphabag-green/10"
    },
    {
      title: "TGE Final Sync",
      description: "Once missions are complete, perform the Final Sync by submitting your BSC wallet. Your ITEMS will be collected for future utility reward conversion during the campaign.",
      icon: <Send className="text-purple-400" size={32} />,
      color: "from-purple-400 to-pink-600",
      bg: "bg-purple-400/10"
    }
  ];

  useEffect(() => {
    // Only auto-transition if NOT in the INFO step
    if (step !== 'INFO') {
      if (isConnected && address && !isAuthenticated) {
        setStep('SIGN');
      } else if (!isConnected) {
        setStep('CONNECT');
      }
    }
  }, [isConnected, address, isAuthenticated, step]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      await open();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError('Connection failed');
    }
  };

  const handleSiwe = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const message = `Sign in to AlphaBAG Protocol Hub.\nTimestamp: ${Date.now()}`;
      
      const signature = await signMessageAsync({ message });

      const success = await siweLogin(address, signature, message);
      if (success) {
        setStep('SUCCESS');
        onClose();
      } else {
        setError('Verification Failed');
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Signature rejected';
      setError(errorMsg);
      console.error("[SIWE Error]", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alphabag-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-alphabag-dark border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative group">
        
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-alphabag-yellow/10 rounded-full blur-[80px] group-hover:bg-alphabag-yellow/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-alphabag-blue/5 rounded-full blur-[80px]" />

        <div className="p-10 relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-alphabag-yellow to-yellow-600 text-black flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(252,213,53,0.3)] transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Briefcase size={26} fill="currentColor" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                  Alpha<span className="text-alphabag-yellow">BAG</span>
                </h2>
                <span className="block text-[9px] text-alphabag-subtext tracking-[0.4em] mt-1 font-black uppercase opacity-60">Genesis Airdrop Protocol</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 text-alphabag-subtext hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>

          {step === 'INFO' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex justify-center mb-8">
                <div className={`w-20 h-20 rounded-3xl ${carouselSteps[carouselStep].bg} flex items-center justify-center border border-white/5 shadow-inner`}>
                  {carouselSteps[carouselStep].icon}
                </div>
              </div>

              <div className="text-center space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-alphabag-muted font-black uppercase tracking-widest">
                  <Sparkles size={10} className="text-alphabag-yellow" /> Deployment Step {carouselStep + 1} of 4
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                  {carouselSteps[carouselStep].title}
                </h3>
                <p className="text-alphabag-subtext text-xs leading-relaxed font-medium">
                  {carouselSteps[carouselStep].description}
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    if (carouselStep < 3) {
                      setCarouselStep(carouselStep + 1);
                    } else {
                      // Transition to real wallet connection
                      setStep('CONNECT');
                    }
                  }}
                  className={`w-full py-5 bg-gradient-to-r ${carouselSteps[carouselStep].color} text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] text-[10px] flex items-center justify-center gap-2`}
                >
                  {carouselStep < 3 ? (
                    <><span>Initiate Next Phase</span><ArrowRight size={14} strokeWidth={3} /></>
                  ) : (
                    <>
                      <Zap size={14} strokeWidth={3} />
                      <span>ENTER ALPHABAG</span>
                    </>
                  )}
                </Button>
                
                <div className="flex justify-center gap-2">
                  {carouselSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i === carouselStep ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8 space-y-2">
                <p className="text-sm text-white font-bold tracking-tight">
                  {step === 'CONNECT' && 'Establish Encrypted Connection'}
                  {step === 'SIGN' && 'Verify Protocol Identity'}
                  {step === 'SUCCESS' && 'Access Granted'}
                </p>
                <p className="text-[11px] text-alphabag-subtext font-medium leading-relaxed opacity-70">
                  {step === 'CONNECT' && 'Sync your professional wallet to interface with the AlphaBAG terminal.'}
                  {step === 'SIGN' && 'Provide a secure signature to initialize your unique member profile.'}
                  {step === 'SUCCESS' && 'Initialization complete. Redirecting to Mission Control...'}
                </p>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="text-red-400 text-[10px] text-center font-black uppercase tracking-widest bg-red-500/5 border border-red-500/20 p-3 rounded-xl animate-in shake duration-300">
                    Error: {error}
                  </div>
                )}

                {step === 'CONNECT' && (
                  <Button
                    onClick={handleConnect}
                    className="w-full py-5 text-[11px] font-black tracking-[0.2em] shadow-2xl uppercase flex items-center justify-center gap-3 bg-alphabag-yellow hover:bg-yellow-400 text-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? <Loader className="animate-spin" size={18} /> : <><Wallet size={18} strokeWidth={3} /> Connect Wallet</>}
                  </Button>
                )}

                {step === 'SIGN' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl mb-2">
                      <div className="w-8 h-8 bg-alphabag-blue/20 rounded-lg flex items-center justify-center text-alphabag-blue">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-[8px] text-alphabag-subtext font-black uppercase tracking-widest">Connected Terminal</div>
                        <div className="text-[10px] text-white font-mono font-bold tracking-tighter">{address}</div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSiwe}
                      className="w-full py-5 text-[11px] font-black tracking-[0.2em] shadow-2xl uppercase flex items-center justify-center gap-3 bg-white text-black hover:bg-alphabag-blue hover:text-white rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader className="animate-spin" size={18} />
                          <span>Verifying Protocol Authority...</span>
                        </div>
                      ) : (
                        <><Shield size={18} strokeWidth={3} /> Sign & Initialize Member</>
                      )}
                    </Button>
                  </div>
                )}

                {step === 'SUCCESS' && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-alphabag-green/20 rounded-full flex items-center justify-center text-alphabag-green shadow-[0_0_40px_rgba(0,255,163,0.2)]">
                      <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-alphabag-green animate-progress" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-10 pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Shield size={10} className="text-alphabag-subtext" />
                <span className="text-[8px] font-black uppercase tracking-widest text-alphabag-subtext">Secure Phase 1</span>
              </div>
              <div className="w-1 h-1 bg-alphabag-subtext rounded-full" />
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-alphabag-subtext" />
                <span className="text-[8px] font-black uppercase tracking-widest text-alphabag-subtext">EVM Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

