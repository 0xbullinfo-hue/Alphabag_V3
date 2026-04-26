import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, MapPin, Link as LinkIcon, Users, MessageSquare, 
    Heart, Share2, Rocket, Edit3, ShieldCheck, Zap, ArrowLeft,
    Flame, CheckCircle2, Globe, ExternalLink, Bookmark, BarChart,
    TrendingUp, Award, DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { AlphaRadarService } from '../services/alphaRadarService';
import { Project, Post } from '../types';

export const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isOwnProfile = user?.id === id || (!id && user) || id === 'me';
    const targetId = id === 'me' ? user?.id : (id || user?.id);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!targetId) return;
            setIsLoading(true);
            try {
                // Determine user type and data based on ID
                if (targetId === 'user1') {
                    setProfileUser({
                        id: 'user1',
                        email: 'founder@neuralbag.com',
                        accountType: 'FOUNDER',
                        bio: "Architecting the future of decentralized alpha discovery. Neural engine specialist and BAG holder.",
                        website: 'neuralbag.com',
                        location: 'Silicon Valley, CA'
                    });
                } else if (targetId === 'user2') {
                    setProfileUser({
                        id: 'user2',
                        email: 'whale_trader@alphabag.com',
                        accountType: 'TRADER',
                        bio: "Professional yield farmer and alpha seeker. 80% Win Rate on DEX gems. #AlphaRadar Expert.",
                        website: 'alpharadar.io',
                        location: 'Dubai, UAE'
                    });
                } else if (isOwnProfile) {
                    setProfileUser({
                        ...user,
                        bio: user?.bio || "AlphaXP community member. Early adopter of the intelligence-first platform.",
                        website: user?.website || "alphabag.com",
                        location: user?.location || "Web3 Native"
                    });
                } else {
                    // General fallback
                    setProfileUser({
                        id: targetId,
                        email: 'explorer@alphabag.com',
                        accountType: 'TRADER',
                        bio: "Decentralized explorer seeking out the next big play.",
                        website: 'alphabag.com',
                        location: 'Global'
                    });
                }

                // Fetch Project if Founder
                const projectData = await AlphaRadarService.getProject(targetId);
                if (projectData) {
                    setProject(projectData);
                }

                // Mock posts for timeline (Filtered by targetId)
                const mockAllPosts = [
                    {
                        id: 'p1',
                        authorId: 'user1',
                        content: "Scaling the neural core to handle 50k requests/sec. The AlphaXP engine is built for institutional load. #AlphaRadar",
                        likeCount: 420,
                        commentCount: 12,
                        shareCount: 55,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'p2',
                        authorId: 'user2',
                        content: "Just spotted a massive whale move on the Alpha Hub. The liquidity depth is incredible. Strong buy signals across the board.",
                        likeCount: 89,
                        commentCount: 4,
                        shareCount: 12,
                        createdAt: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 'p3',
                        authorId: user?.id || 'me',
                        content: "Finally set up my AlphaXP dashboard. The CEX + DEX unified portfolio view is a game changer for my workflow.",
                        likeCount: 15,
                        commentCount: 2,
                        shareCount: 3,
                        createdAt: new Date(Date.now() - 7200000).toISOString()
                    }
                ];

                setPosts(mockAllPosts.filter(p => p.authorId === targetId || (targetId === user?.id && p.authorId === 'me')));
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [targetId, user, isOwnProfile]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-alphabag-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isFounder = profileUser?.accountType === 'FOUNDER';

    return (
        <div className="bg-alphabag-black min-h-screen text-white pb-20">
            {/* Header / Banner */}
            <div className="h-48 bg-gradient-to-r from-alphabag-dark to-alphabag-black border-b border-white/5 relative">
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors z-10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-3xl mx-auto px-4">
                {/* Profile Info Card */}
                <div className="relative -mt-16 mb-8 px-4 py-6 bg-alphabag-darkgray/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl">
                    <div className="flex justify-between items-start">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-alphabag-yellow to-orange-500 p-1 shadow-glow-yellow/20">
                                <div className="w-full h-full bg-alphabag-black rounded-[20px] flex items-center justify-center overflow-hidden">
                                    <span className="text-4xl font-black text-alphabag-yellow uppercase">{profileUser?.email?.[0] || 'U'}</span>
                                </div>
                            </div>
                            {isFounder && (
                                <div className="absolute -bottom-2 -right-2 bg-alphabag-yellow text-black p-1.5 rounded-xl shadow-lg border-4 border-alphabag-black">
                                    <ShieldCheck size={18} fill="currentColor" />
                                </div>
                            )}
                        </div>

                        {isOwnProfile && (
                            <div className="pt-16 flex gap-3">
                                {isFounder && (
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/genesis-manifesto')}
                                        className="rounded-full border-alphabag-yellow/30 text-alphabag-yellow hover:bg-alphabag-yellow/10 font-black uppercase tracking-widest text-[10px] px-6 py-2"
                                    >
                                        {project ? <><Edit3 size={14} className="mr-2" /> Edit Manifesto</> : <><Rocket size={14} className="mr-2" /> Post Manifesto</>}
                                    </Button>
                                )}
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 py-2"
                                >
                                    Edit Profile
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight">
                                    {profileUser?.email?.split('@')[0]}
                                </h2>
                                {isFounder && <CheckCircle2 size={18} className="text-alphabag-yellow" fill="currentColor" />}
                                {/* ROLE TAG [NEW] */}
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-2 ${isFounder ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                    {isFounder ? 'FOUNDER' : 'ELITE TRADER'}
                                </div>
                            </div>
                            <p className="text-alphabag-muted text-sm font-medium">@{profileUser?.email?.split('@')[0].toLowerCase() || 'anonymous'}_member</p>
                        </div>

                        <p className="text-zinc-300 text-sm leading-relaxed max-w-xl">
                            {profileUser?.bio}
                        </p>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-alphabag-muted font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-alphabag-yellow" /> {profileUser?.location}</div>
                            <div className="flex items-center gap-1.5"><Globe size={14} className="text-alphabag-yellow" /> {profileUser?.website}</div>
                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-alphabag-yellow" /> Joined March 2026</div>
                        </div>

                        <div className="flex gap-6 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-black text-sm">4.2K</span>
                                <span className="text-alphabag-muted text-[10px] font-black uppercase tracking-widest">Following</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-black text-sm">12.8K</span>
                                <span className="text-alphabag-muted text-[10px] font-black uppercase tracking-widest">Followers</span>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Hub / Performance Section */}
                    {isFounder ? (
                        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                            <div className="text-center p-3 bg-alphabag-yellow/5 rounded-2xl border border-alphabag-yellow/10">
                                <div className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest mb-1">Alpha Rep</div>
                                <div className="text-lg font-black text-white">98%</div>
                                <div className="text-[8px] font-bold text-alphabag-yellow/60 uppercase">Diamond Founder</div>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Project Heat</div>
                                <div className="flex items-center justify-center gap-1">
                                    <Flame size={14} className="text-orange-500" fill="currentColor" />
                                    <span className="text-lg font-black text-white">{project?.heatIndex || 999}</span>
                                </div>
                                <div className="text-[8px] font-bold text-alphabag-muted uppercase">Top 1% Global</div>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Vetting</div>
                                <div className="text-lg font-black text-alphabag-green">LVL 1</div>
                                <div className="text-[8px] font-bold text-alphabag-muted uppercase">Phase 1 Verified</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                            <div className="text-center p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 col-span-1">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Trader Rank</div>
                                <div className="flex items-center justify-center gap-1">
                                    <Award size={14} className="text-blue-400" />
                                    <span className="text-lg font-black text-white">ELITE</span>
                                </div>
                                <div className="text-[8px] font-bold text-blue-400/60 uppercase">Top 5% PnL</div>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/10 col-span-2">
                                <div className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Alpha Win Rate</div>
                                <div className="flex items-center justify-center gap-1">
                                    <TrendingUp size={14} className="text-alphabag-green" />
                                    <span className="text-lg font-black text-white">74.2%</span>
                                </div>
                                <div className="text-[8px] font-bold text-alphabag-muted uppercase">Monthly Streak based on feed activity</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline Tabs */}
                <div className="flex border-b border-white/5 mb-6">
                    {['Alphas', isFounder ? 'Manifesto' : 'Replies', 'Media'].map((tab) => (
                        <button 
                            key={tab}
                            className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-colors ${tab === 'Alphas' ? 'text-alphabag-yellow' : 'text-alphabag-muted hover:text-white'}`}
                        >
                            {tab}
                            {tab === 'Alphas' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-alphabag-yellow rounded-full" />}
                        </button>
                    ))}
                </div>

                {/* Timeline Content */}
                <div className="space-y-6">
                    {/* AUTO-PINNED MANIFESTO CARD (Only for Founders) */}
                    {isFounder && project && (
                        <div className="group relative">
                            {/* Pin Indicator */}
                            <div className="flex items-center gap-2 mb-2 ml-4">
                                <Zap size={12} className="text-alphabag-yellow" fill="currentColor" />
                                <span className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest">Pinned Manifesto</span>
                            </div>

                            <div className="glass-panel p-0 border-2 border-alphabag-yellow/30 bg-alphabag-black shadow-glow-yellow/5 relative overflow-hidden rounded-3xl">
                                {/* Banner */}
                                <div className="h-32 w-full relative overflow-hidden bg-alphabag-darkgray/30 border-b border-white/5">
                                    {project.bannerUrl ? (
                                        <img src={project.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-alphabag-yellow/20 to-transparent flex items-center justify-center">
                                            <Rocket size={32} className="text-alphabag-yellow/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black to-transparent"></div>
                                </div>

                                <div className="p-8 pt-4">
                                    <div className="absolute top-0 right-0 p-6 pointer-events-none mt-32">
                                        <Flame size={48} className="text-alphabag-yellow/10" />
                                    </div>

                                    <div className="flex items-center gap-4 mb-6 relative -mt-12">
                                        <div className="w-16 h-16 bg-alphabag-black border-2 border-alphabag-yellow rounded-2xl flex items-center justify-center font-black text-2xl text-alphabag-yellow shadow-2xl overflow-hidden">
                                            {project.logoUrl ? (
                                                <img src={project.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-black">{project.symbol[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                                {project.name} <span className="text-alphabag-yellow">({project.symbol})</span>
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-alphabag-muted">
                                                    <Flame size={12} className="text-alphabag-yellow" fill="currentColor" />
                                                    HEAT: {project.heatIndex || 999}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-alphabag-muted">
                                                    <Users size={12} />
                                                    HOLDERS: 0
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-zinc-200 text-lg font-bold leading-snug mb-6 italic border-l-4 border-alphabag-yellow pl-4">
                                        "{project.theHook}"
                                    </p>

                                    <p className="text-zinc-400 text-sm leading-relaxed mb-8 line-clamp-3">
                                        {project.description}
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Market Cap</div>
                                            <div className="text-sm font-black text-white">$0.00</div>
                                        </div>
                                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Total Supply</div>
                                            <div className="text-sm font-black text-white truncate">{project.totalSupply}</div>
                                        </div>
                                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Liquidity</div>
                                            <div className="text-sm font-black text-alphabag-green">Locked</div>
                                        </div>
                                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-1">Audit</div>
                                            <div className="text-sm font-black text-alphabag-yellow">Passed</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <Button 
                                            onClick={() => window.open(project.buyLink, '_blank')}
                                            className="bg-alphabag-yellow text-black font-black uppercase tracking-widest text-[11px] rounded-full px-8 py-3 shadow-glow-yellow/20 flex-1 sm:flex-initial shadow-lg shadow-alphabag-yellow/20 hover:shadow-alphabag-yellow/40 hover:-translate-y-0.5 transition-all"
                                        >
                                            Buy $ {project.symbol}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => window.open(project.websiteUrl, '_blank')}
                                            className="border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] rounded-full px-8 py-3 flex-1 sm:flex-initial"
                                        >
                                            <Globe size={16} className="mr-2" /> Website
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] rounded-full px-8 py-3 flex-1 sm:flex-initial"
                                        >
                                            <ExternalLink size={16} className="mr-2" /> View Manifesto
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Posts (Filtered by user) */}
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <div key={post.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors rounded-2xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 flex-shrink-0 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow uppercase shadow-inner">
                                        {profileUser?.email?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-[15px]">{profileUser?.email?.split('@')[0]}</span>
                                            {isFounder && <CheckCircle2 size={14} className="text-alphabag-yellow" fill="currentColor" />}
                                            <span className="text-alphabag-muted text-[14px]">@{profileUser?.email?.split('@')[0].toLowerCase() || 'anonymous'}_member · 2h</span>
                                        </div>
                                        <p className="text-zinc-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center justify-between max-w-sm text-alphabag-muted -ml-2">
                                            <button className="flex items-center gap-2 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-blue-400/10">
                                                <MessageSquare size={18} />
                                                <span className="text-xs">{post.commentCount}</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-alphabag-yellow transition-colors p-2 rounded-full hover:bg-alphabag-yellow/10">
                                                <Heart size={18} />
                                                <span className="text-xs">{post.likeCount}</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-alphabag-green transition-colors p-2 rounded-full hover:bg-alphabag-green/10">
                                                <Share2 size={18} />
                                                <span className="text-xs">{post.shareCount}</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                                                <BarChart size={18} />
                                                <span className="text-xs">42K</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-alphabag-yellow transition-colors p-2 rounded-full hover:bg-alphabag-yellow/10">
                                                <Bookmark size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <MessageSquare size={24} className="text-alphabag-muted" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">No Alphas Yet</h3>
                            <p className="text-sm text-alphabag-muted">This user hasn't shared any intelligence with the community yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
