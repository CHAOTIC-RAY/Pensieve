import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
  useMotionValueEvent
} from 'motion/react';
import { ArrowRight, Search, Sparkles, Heart, Palette, Compass, Trophy, Activity, Lock, Cloud, Mic, Volume2, LogIn, Github, Play, Check, CircleCheck as CheckCircle2, Quote as QuoteIcon, FileText, Zap, Maximize2, ShoppingBag, Shield, Layers, Plug, Cpu, ShieldCheck, Code2, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import SparkleCursor from './SparkleCursor';
import AchievementCard from './AchievementCard';

const FANTASY_STARS = [
  { left: '12%', top: '15%', size: '16px', delay: 0, duration: 4, color: 'text-amber-200' },
  { left: '85%', top: '10%', size: '22px', delay: 1.5, duration: 5, color: 'text-purple-300' },
  { left: '42%', top: '22%', size: '24px', delay: 0.5, duration: 6, color: 'text-white' },
  { left: '72%', top: '35%', size: '14px', delay: 2.2, duration: 4.5, color: 'text-sky-200' },
  { left: '22%', top: '42%', size: '18px', delay: 1.2, duration: 5.5, color: 'text-emerald-100' },
  { left: '88%', top: '55%', size: '20px', delay: 3, duration: 7, color: 'text-pink-300' },
  { left: '15%', top: '75%', size: '20px', delay: 0.8, duration: 5, color: 'text-amber-100' },
  { left: '48%', top: '78%', size: '16px', delay: 1.8, duration: 4, color: 'text-indigo-200' },
  { left: '80%', top: '82%', size: '24px', delay: 2.5, duration: 6, color: 'text-yellow-100' },
  { left: '28%', top: '88%', size: '14px', delay: 0.4, duration: 3.5, color: 'text-white' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Save a note, link, or search...");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Sidebar transition: visible as we scroll past the hero, fades out at the very bottom zoom
  const sidebarOpacity = useTransform(smoothProgress, [0.05, 0.15, 0.85, 0.95], [0, 1, 1, 0]);
  const sidebarX = useTransform(smoothProgress, [0.05, 0.15, 0.85, 0.95], [-50, 0, 0, -50]);

  // Center Hero Logo fades out
  const centerLogoOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
  const centerLogoScale = useTransform(smoothProgress, [0, 0.1], [1, 0.8]);

  // Hero text transitions (fades out and moves up)
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.15], [0, -50]);

  // Omnibar positions: floats down, pinned in a comfortable viewing location
  const omnibarY = useTransform(smoothProgress, [0, 0.15, 0.8], [0, -180, -180]);
  const omnibarScale = useTransform(smoothProgress, [0, 0.15], [1, 0.95]);

  // Shift transform ranges on mobile to eliminate delay/blank screen feeling
  const gridRange = isMobile ? [0.03, 0.08] : [0.08, 0.15];
  const searchRange = isMobile ? [0.10, 0.16] : [0.18, 0.25];
  const aiRange = isMobile ? [0.18, 0.24] : [0.27, 0.34];
  const marketRange = isMobile ? [0.26, 0.32] : [0.36, 0.43];
  const xpRange = isMobile ? [0.34, 0.40] : [0.45, 0.52];
  const voiceRange = isMobile ? [0.42, 0.48] : [0.54, 0.61];
  const serendipityRange = isMobile ? [0.50, 0.56] : [0.63, 0.70];

  // Content grid fades in
  const gridOpacity = useTransform(smoothProgress, gridRange, [0, 1]);
  const gridY = useTransform(smoothProgress, gridRange, [30, 0]);

  // Search section
  const searchOpacity = useTransform(smoothProgress, searchRange, [0, 1]);
  const searchY = useTransform(smoothProgress, searchRange, [30, 0]);

  // AI section
  const aiOpacity = useTransform(smoothProgress, aiRange, [0, 1]);
  const aiY = useTransform(smoothProgress, aiRange, [30, 0]);

  // Marketplace section
  const marketOpacity = useTransform(smoothProgress, marketRange, [0, 1]);
  const marketY = useTransform(smoothProgress, marketRange, [30, 0]);

  // XP section
  const xpOpacity = useTransform(smoothProgress, xpRange, [0, 1]);
  const xpY = useTransform(smoothProgress, xpRange, [30, 0]);

  // Voice Note section fades in
  const voiceOpacity = useTransform(smoothProgress, voiceRange, [0, 1]);
  const voiceY = useTransform(smoothProgress, voiceRange, [30, 0]);

  // Serendipity section
  const serendipityOpacity = useTransform(smoothProgress, serendipityRange, [0, 1]);
  const serendipityScale = useTransform(smoothProgress, serendipityRange, [0.97, 1]);

  // Last scroll zoom transitions (Forge-style full screen)
  const lastScrollWidth = useTransform(smoothProgress, [0.85, 0.98], ['90%', '100%']);
  const lastScrollRadius = useTransform(smoothProgress, [0.85, 0.98], ['48px', '0px']);
  const lastScrollPadding = useTransform(
    smoothProgress, 
    [0.85, 0.98], 
    isMobile ? ['1.5rem', '1.5rem'] : ['4rem', '8rem']
  );

  // Sparkle intensity increases at the end (lower threshold = more sparkles)
  const sparkleIntensity = useTransform(smoothProgress, [0, 0.8, 1], [0.75, 0.75, 0.1]);

  const [sparkleDensity, setSparkleDensity] = useState(0.75);

  useMotionValueEvent(sparkleIntensity, "change", (latest) => {
    setSparkleDensity(latest);
  });

  // Change search placeholder text dynamically as user scrolls
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.15) {
      setSearchPlaceholder("Save a note, link, or search...");
    } else if (latest >= 0.15 && latest < 0.3) {
      setSearchPlaceholder("Typing: 'brutalist glassmorphic app designs'...");
    } else if (latest >= 0.3 && latest < 0.48) {
      setSearchPlaceholder("Categorizing: #design #ux #glassmorphism...");
    } else if (latest >= 0.48 && latest < 0.68) {
      setSearchPlaceholder("Recording: 'Review meeting thoughts' (0:12s)...");
    } else if (latest >= 0.68 && latest < 0.85) {
      setSearchPlaceholder("Recalling memory: 'First Spark' milestone...");
    } else {
      setSearchPlaceholder("Search your entire second brain...");
    }
  });

  const handleGoogleSignIn = () => {
    navigate('/login');
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const scrollToPreview = () => {
    const targetScroll = window.innerHeight * 0.85; 
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-[600vh] bg-[#FDFBF7] text-neutral-900 selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden cursor-sparkle-active"
    >
      <SparkleCursor intensity={sparkleDensity} />
      {/* Sidebar Dock - Minimal tab style containing only sideways Logo and Liquid Glass Login */}
      <motion.div 
        style={{ opacity: sidebarOpacity, x: sidebarX }}
        className="hidden lg:flex flex-col items-center justify-between fixed left-6 top-6 bottom-6 w-20 py-8 z-40 bg-transparent"
      >
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* Logo sideways / rotated */}
            <div className="w-11 h-11 flex items-center justify-center p-2">
              <Logo className="w-full h-full" glow={false} />
            </div>
            <div className="flex flex-col items-center text-[9px] font-bold text-foreground/75 font-mono my-4 uppercase gap-1.5">
              {Array.from("PENSIEVE").map((char, i) => (
                <span key={i} className="leading-none">{char}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Minimal Area containing only the liquid glass Login button and round icons */}
        <div className="flex flex-col items-center gap-6 w-full px-3">
          {/* Liquid Glass Styled Login Button */}
          <button 
            onClick={handleGoogleSignIn}
            title="Log In"
            className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center justify-center cursor-pointer shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_8px_rgba(0,0,0,0.05)] hover:scale-105 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
          </button>

          {/* GitHub Icon */}
          <a
            href="https://github.com/CHAOTIC-RAY/Pensieve"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/10 transition-all flex items-center justify-center hover:scale-105"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </motion.div>

      {/* Top Header for Mobile/Navbar Fallback */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-md bg-background/30 border-b border-border-subtle/20 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center p-1">
            <Logo className="w-full h-full" glow={false} />
          </div>
          <span className="text-sm font-bold tracking-tight font-display">pensieve</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGoogleSignIn} className="px-2.5 py-1.5 bg-foreground/5 text-foreground rounded-lg text-[9px] font-bold uppercase">Log In</button>
          <button onClick={() => setShowEmailInput(true)} className="px-2.5 py-1.5 bg-primary text-white rounded-lg text-[9px] font-bold uppercase">Start</button>
        </div>
      </nav>

      <main className="relative w-full">
        {/* Ambient Glow */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-5xl h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-60 pointer-events-none" />

        {/* Global Dark Background for the last scroll zoom (galaxy feel) */}
        <motion.div 
          style={{ opacity: useTransform(smoothProgress, [0.85, 0.98], [0, 1]) }}
          className="fixed inset-0 bg-[#0c0d12] -z-20 pointer-events-none"
        />

        {/* Hero Section Sticky Container to prevent overlap */}
        <section className="sticky top-0 h-[100svh] flex flex-col items-center justify-center text-center px-4 pointer-events-none select-none">
          {/* Light purple fade at the bottom of the first screen */}
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-500/[0.08] via-purple-500/[0.03] to-transparent pointer-events-none"
          />

          {/* Centered Large Logo on first scroll */}
          <motion.div 
            style={{ opacity: centerLogoOpacity, scale: centerLogoScale }}
            className="flex flex-col items-center gap-3 mb-4 md:mb-6"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 p-2 md:p-2.5 flex items-center justify-center">
              <Logo className="w-full h-full" glow={true} />
            </div>
            <span className="text-[10px] md:text-sm font-bold tracking-[0.4em] uppercase text-foreground/85 font-mono font-display">
              PENSIEVE
            </span>
          </motion.div>

          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }} 
            className="space-y-3 md:space-y-4 max-w-xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight leading-tight text-foreground px-2">
              What are you remembering today?
            </h1>
            <p className="text-[10px] md:text-sm text-foreground/75 max-w-[280px] md:max-w-md mx-auto leading-relaxed font-sans font-medium">
              Search your private workspace or type to save instantly. A fluid mind needs a fluid vault.
            </p>
          </motion.div>

          {/* Floating Omnibar - Light Glass Mode */}
          <motion.div 
            onClick={scrollToPreview}
            className="w-full max-w-3xl z-40 px-4 mt-8 md:mt-12 pointer-events-auto cursor-pointer"
            style={{ y: omnibarY, scale: omnibarScale }}
          >
            <div className="w-full bg-white/95 backdrop-blur-xl shadow-premium rounded-[20px] md:rounded-[24px] p-1 flex items-center gap-2 md:gap-3 border border-white/60 hover:border-primary/40 transition-colors group">
              <div className="pl-3 md:pl-3.5 text-neutral-450">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-neutral-400 group-hover:text-primary transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder={searchPlaceholder} 
                className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-neutral-800 placeholder:text-neutral-400 py-3 md:py-3.5 font-sans pointer-events-none"
                readOnly
              />
              <div className="pr-2 md:pr-3 flex items-center gap-1.5 md:gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary border border-primary/25">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 2: Masonry Grid Preview */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: gridOpacity, y: gridY }}
            className="w-full max-w-5xl"
          >
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">WORKSPACE PREVIEW</span>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mt-4">Effortless Mind Mapping</h2>
              <p className="text-xs md:text-sm text-foreground/75 mt-2 max-w-lg mx-auto leading-relaxed">Everything you capture is instantly analyzed, beautifully structured, and preserved inside your local sandboxed database.</p>
            </div>
            
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6 max-w-4xl mx-auto">
              
              {/* 1. Quote Card Swatch */}
              <div className="w-full bg-[#fdf2f2] text-neutral-800 rounded-3xl p-6 break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-rose-100 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[8px] uppercase tracking-widest text-rose-500 font-bold">Quote Swatch</span>
                  <span className="text-[9px] font-mono text-rose-300">saved just now</span>
                </div>
                <QuoteIcon className="w-5 h-5 text-rose-200 mb-2" />
                <blockquote className="font-serif italic text-sm text-neutral-800 leading-relaxed mb-3">
                  "Simplicity is the ultimate sophistication. It resides in the empty space between things."
                </blockquote>
                <p className="text-[10px] font-sans text-neutral-400">— Leonardo da Vinci</p>
              </div>

              {/* 2. Color Palette Swatches */}
              <div className="w-full bg-white dark:bg-[#18181b] rounded-3xl overflow-hidden break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 group hover:scale-[1.01] transition-all duration-500">
                <div className="w-full h-24 flex">
                  {['#E8B4B8', '#FFD3B6', '#D4A5A5', '#6C5B7B'].map((hex, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-wider">COLOR PALETTE</span>
                    <span className="text-[8px] font-mono text-neutral-400">4 swatches</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-200">Sunset Over Tokyo</h3>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">Warm sepia and dusty violets from the evening landscape.</p>
                </div>
              </div>

              {/* 3. Disruption-Free Reader Card */}
              <div className="w-full bg-[#F6F0E5] text-[#2c2826] rounded-3xl p-5 break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-[#e2d6be] group hover:scale-[1.01] transition-all duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[8px] uppercase tracking-widest text-[#5f5a54] font-black flex items-center gap-1 bg-[#ecdcb9]/50 px-2 py-0.5 rounded-md">
                    <FileText className="w-2.5 h-2.5 text-[#5f5a54]" /> Reader Mode
                  </span>
                  <span className="text-[9px] font-mono text-[#5f5a54]/65">3 min read</span>
                </div>
                <h3 className="font-serif font-bold text-sm text-[#2c2826] leading-snug mb-2">
                  The Philosophy of Subtraction
                </h3>
                <p className="text-[11px] text-[#5f5a54] leading-relaxed line-clamp-3">
                  In a world of constant notification noise, the act of removal becomes an act of mental rebellion. By purging secondary inputs, we allow primary intentions to grow...
                </p>
              </div>

              {/* 4. Beautiful Image Card */}
              <div className="w-full bg-white dark:bg-[#18181b] rounded-3xl overflow-hidden break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 p-3.5 group hover:scale-[1.01] transition-all duration-500">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80" 
                    alt="Ocean beach" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2.5 text-center">
                  <span className="font-serif italic text-xs text-neutral-700 dark:text-neutral-300 block">
                    "Infinite Horizons"
                  </span>
                  <span className="block text-[8px] font-mono text-neutral-400 mt-1 uppercase tracking-wider">
                    Captured today
                  </span>
                </div>
              </div>

              {/* 5. Checklist Card */}
              <div className="w-full bg-[#FEF3C7] text-[#451a03] rounded-3xl p-5 break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-[#fde68a] group hover:scale-[1.01] transition-all duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[8px] uppercase tracking-widest text-[#92400e] font-black">Interactive List</span>
                  <span className="text-[9px] font-mono text-[#92400e]/60">2/3 done</span>
                </div>
                <h3 className="font-bold text-xs tracking-tight mb-2.5">Weekend Flow Rituals</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded border border-[#b45309] bg-[#b45309] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-[11px] line-through text-[#92400e]/50">Unplug screens for 4 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded border border-[#b45309] bg-[#b45309] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-[11px] line-through text-[#92400e]/50">Log color swatches of the sunset</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded border border-[#b45309] bg-[#fef8e2]" />
                    <span className="text-[11px] font-semibold text-[#451a03]">Sketch new design patterns</span>
                  </div>
                </div>
              </div>

              {/* 6. Voice Waveform Card */}
              <div className="w-full bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent bg-white dark:bg-[#18181b] rounded-3xl p-5 break-inside-avoid shadow-[0_12px_28px_rgba(0,0,0,0.04)] border border-amber-500/10 group hover:scale-[1.01] transition-all duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                    Voice
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">0:14 duration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Brainstorming UI cues</h4>
                    <div className="h-4 flex items-center gap-0.5 mt-1">
                      {[15, 30, 10, 40, 50, 25, 15, 30, 45, 10, 35, 20, 30, 25, 15].map((h, i) => (
                        <div key={i} className="w-[2px] bg-amber-500 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </section>        {/* Neural Search Engine Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: searchOpacity, y: searchY }}
            className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550 border border-indigo-500/20">
                <Search className="w-5 h-5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">Neural Search Engine</h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                Eliminate the latency of sequential scans. Our engine utilizes a custom Inverted Index paired with B-Tree temporal sorting to deliver instant recall across your entire memory vault. 
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <Zap className="w-4 h-4 text-indigo-500" /> Sub-millisecond Cardinality Estimation
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <Code2 className="w-4 h-4 text-indigo-500" /> Heuristic Rule-Based Optimization (RBO)
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2.5rem] blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
              <div className="relative aspect-video rounded-[2rem] border border-black/[0.03] bg-white/40 backdrop-blur-md flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)]"></div>
                <div className="font-mono text-[10px] text-indigo-600/40 p-8 leading-tight">
                  {`SELECT * FROM mind_items \nWHERE terms @@ to_tsquery('neural')\nORDER BY rank DESC, created_at DESC;\n\n[Optimizer] Plan: B-Tree Scan\n[Status] 0.12ms execution time`}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* LiteRT & WebGPU Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: aiOpacity, y: aiY }}
            className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="relative group">
              <div className="absolute -inset-8 bg-emerald-500/15 rounded-[3rem] blur-3xl group-hover:bg-emerald-500/25 transition-all duration-700 animate-pulse"></div>
              <div className="relative aspect-video rounded-[2.5rem] border border-black/[0.05] bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent)]"></div>
                
                {/* Neural Network Visual */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                  <div className="absolute inset-4 border border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="relative w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  {/* Floating Nodes */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [0, -10, 0],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{ 
                        duration: 3 + i, 
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                      className="absolute w-2 h-2 bg-emerald-400 rounded-full"
                      style={{ 
                        top: `${20 + Math.random() * 60}%`, 
                        left: `${20 + Math.random() * 60}%` 
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    TENSOR_CORE_ACTIVE: 1.5B PARAMS
                  </div>
                  <div className="text-[9px] font-mono text-emerald-600/40 uppercase tracking-[0.2em]">
                    ON-DEVICE WEBGPU INFERENCE
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
                LiteRT Intelligence
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  OFFLINE
                </span>
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                Experience neural analysis without the server. We compile and run a custom language model directly in your browser using Google LiteRT and WebGPU acceleration. 100% private semantic analysis—your context never touches the cloud.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-End Privacy First
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <Zap className="w-4 h-4 text-emerald-500" /> Hardware Accelerated LLM Inference
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Effect Marketplace Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: marketOpacity, y: marketY }}
            className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-555 border border-amber-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">Effect Marketplace</h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                Your workspace is a canvas. Exchange your earned XP for custom visual modifiers. From dynamic GLSL shaders to vintage CRT monitor filters, personalize every pixel of your digital sanctuary with high-fidelity effects.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-black/[0.03] bg-white/60 shadow-sm flex flex-col gap-1 items-center justify-center group/item hover:border-amber-500/30 transition-all cursor-pointer">
                  <span className="text-[10px] font-black text-amber-600">LIQUID GLASS</span>
                  <div className="w-full h-1 bg-amber-500/10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-amber-500/40 translate-x-[-100%] group-hover/item:translate-x-0 transition-transform duration-500"></div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-black/[0.03] bg-white/60 shadow-sm flex flex-col gap-1 items-center justify-center group/item hover:border-amber-500/30 transition-all cursor-pointer">
                  <span className="text-[10px] font-black text-amber-600">CRT PHOSPHOR</span>
                  <div className="w-full h-1 bg-amber-500/10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-amber-500/40 translate-x-[-100%] group-hover/item:translate-x-0 transition-transform duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-8 bg-amber-500/15 rounded-[3rem] blur-3xl group-hover:bg-amber-500/25 transition-all duration-700 animate-pulse"></div>
              <div className="relative aspect-square max-w-[340px] mx-auto rounded-[2.5rem] border border-black/[0.05] bg-white/40 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-2xl group/market">
                {/* Visual Effect Stack Preview */}
                <div className="relative w-56 h-72 space-y-4">
                  {/* Layer 3: Base */}
                  <div className="absolute inset-0 bg-white/20 rounded-2xl border border-white/40 transform translate-x-4 translate-y-4 scale-95 opacity-50 blur-[1px]"></div>
                  {/* Layer 2: Content */}
                  <div className="absolute inset-0 bg-white/30 rounded-2xl border border-white/40 transform translate-x-2 translate-y-2 scale-[0.97] opacity-80 flex flex-col p-4 gap-3">
                    <div className="h-6 w-1/2 bg-amber-500/20 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-black/5 rounded"></div>
                      <div className="h-2 w-full bg-black/5 rounded"></div>
                    </div>
                  </div>
                  {/* Layer 1: Active Filter (Holographic/Glass) */}
                  <div className="relative h-full w-full bg-white/40 rounded-2xl border border-white/60 shadow-xl flex flex-col overflow-hidden group-hover/market:scale-[1.02] transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-amber-500/5"></div>
                    {/* Scanline Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)' }}></div>
                    {/* Dynamic "Liquid" Reflection */}
                    <motion.div 
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                    />
                    <div className="p-4 space-y-3 relative z-10">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Palette className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-3/4 bg-amber-500/10 rounded"></div>
                        <div className="h-3 w-full bg-amber-500/10 rounded"></div>
                        <div className="h-3 w-2/3 bg-amber-500/10 rounded"></div>
                      </div>
                    </div>
                    <div className="mt-auto p-4 border-t border-amber-500/10 bg-amber-500/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-amber-600 uppercase">CRT_EMULATION_01</span>
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Price Tags */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-8 -right-4 bg-amber-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg border border-amber-400 z-20"
                >
                  600 XP
                </motion.div>
                <motion.div 
                  animate={{ y: [0, 10, 0] }} 
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-8 -left-4 bg-foreground text-background text-[10px] font-black px-4 py-2 rounded-full shadow-lg border border-white/10 z-20"
                >
                  COLLECTIBLE
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* XP Economy Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: xpOpacity, y: xpY }}
            className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="relative group">
              <div className="absolute -inset-8 bg-purple-500/15 rounded-[3rem] blur-3xl group-hover:bg-purple-500/25 transition-all duration-700 animate-pulse"></div>
              <div className="relative aspect-video rounded-[2.5rem] border border-black/[0.05] bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/40">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-foreground">LVL 24</div>
                    <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Cognitive Architect</div>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-foreground/40 uppercase">
                    <span>XP Progress</span>
                    <span>14,200 / 15,000</span>
                  </div>
                  <div className="w-full h-3 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden border border-purple-200 dark:border-purple-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '70%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-purple-600/60 uppercase tracking-widest animate-pulse">+150 XP EARNED FROM LAST CAPTURE</div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-555 border border-purple-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">XP Economy & Gamification</h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                Cognition is rewarded. Every item captured, link saved, and insight discovered contributes to your experience points. Build long-term memory habits while unlocking functional milestones and social badges.
              </p>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-foreground">14.2k</span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase">Total XP</span>
                </div>
                <div className="w-px h-10 bg-black/5"></div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-foreground">12</span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase">Achievements</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 4: Architecture Grid */}
        <section className="relative py-24 px-6 flex flex-col items-center">
          <div className="w-full max-w-5xl space-y-16">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">TECHNICAL ARCHITECTURE</span>
              <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">Enterprise Infrastructure. <br/><span className="text-primary italic">Consumer Soul.</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550 border border-indigo-500/20">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Native Inspector Panel</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">A beautiful, Notion-style rich editor. Fully responsive: full-screen modal on mobile with native gestures, and a sleek focused card on desktop optimized for text and images.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-555 border border-teal-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Firebase Auth & Security</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Enterprise-grade authentication with Google Identity Platform. Complete with admin dashboard controls and strictly protected application environments.</p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-555 border border-rose-500/20">
                  <Plug className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                  Cloud Connections
                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">BETA</span>
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Connect Google Photos, Drive, or OneDrive. Safely browse and import external photos, files, and documents directly into your memory vault.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550 border border-indigo-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Appwrite Database Sync</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Powered by Appwrite for real-time document storage. Features scalable infrastructure that securely syncs your workspace across all devices instantly.</p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-555 border border-emerald-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Offline-First Engine</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Never lose access. Our core storage utilizes a robust local-first architecture that functions perfectly without an internet connection, syncing only when you are back online.</p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-555 border border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Keyboard Driven</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Power user efficiency. Navigate, search, and capture using a comprehensive set of keyboard shortcuts designed for frictionless thought logging.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Voice Notes & Audio Capture */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: voiceOpacity, y: voiceY }}
            className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-650">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">Instant Voice Capture</h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                Never lose a fleeting thought. Tap once to initiate high-fidelity audio sampling. Our system uses zero-latency HTML5 MediaRecorder and custom WebAudio nodes to process and compress your voice notes locally before background indexing.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <Volume2 className="w-4 h-4 text-amber-500" /> Real-time Spectral Analysis
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Lossless Local Compression
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md bg-white/60 backdrop-blur-xl border border-black/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono text-red-500 font-bold uppercase">Recording Voice Note</span>
                </div>
                <span className="text-xs font-mono text-foreground/70">0:12 / 1:00</span>
              </div>
              
              <div className="h-16 flex items-center justify-between gap-1.5 px-2">
                {[4, 8, 12, 16, 24, 16, 12, 8, 14, 20, 28, 16, 12, 6, 10, 16, 22, 14, 8, 4].map((h, i) => (
                  <motion.div 
                    key={i} 
                    className="flex-1 bg-amber-500/70 rounded-full" 
                    style={{ height: `${h * 1.5}px` }} 
                    animate={{ scaleY: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                  />
                ))}
              </div>
              
              <div className="h-[1px] bg-black/10 dark:bg-white/10 w-full" />
              <div className="text-xs text-foreground/75 font-sans italic">"Reviewing user interface transitions for the holographic milestone decks..."</div>
            </div>
          </motion.div>
        </section>

        {/* Section 5: Serendipity & Intelligence (High Fidelity Achievement Cards) */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: serendipityOpacity, scale: serendipityScale }}
            className="w-full max-w-4xl text-center space-y-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 shadow-xl mb-4">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground leading-tight">
              Rediscover your <br/> <span className="italic text-primary drop-shadow-[0_0_15px_rgba(232,180,184,0.35)]">Wandering Mind.</span>
            </h2>
            <p className="text-xs md:text-sm text-foreground/85 max-w-xl mx-auto font-sans leading-relaxed">
              Earn actual collectible physical-style cards as you cultivate your vault. Tilt and pan cards to reveal rare holographic elements, golden borders, and mystical lore.
            </p>

            <div className="flex flex-wrap justify-center gap-8 mt-12 scale-90 md:scale-100">
              
              {/* Achievement 1: First Spark */}
              <div className="transform -rotate-6 translate-y-4 hover:scale-105 hover:rotate-0 transition-all duration-500 pointer-events-auto">
                <AchievementCard 
                  unlocked={true}
                  achievement={{
                    id: 'first_spark',
                    title: 'First Spark',
                    description: 'Save your very first card to kick off your database.',
                    rarity: 'Common',
                    icon: Sparkles,
                    xp: 10,
                    unlockedAt: new Date().toISOString()
                  }}
                />
              </div>

              {/* Achievement 2: Wandering Mind */}
              <div className="transform rotate-1 -translate-y-2 z-10 hover:scale-105 hover:rotate-0 transition-all duration-500 pointer-events-auto">
                <AchievementCard 
                  unlocked={true}
                  achievement={{
                    id: 'wandering_mind',
                    title: 'Wandering Mind',
                    description: 'Collect 50 distinct thoughts inside your neural context.',
                    rarity: 'Rare',
                    icon: Compass,
                    xp: 50,
                    unlockedAt: new Date().toISOString()
                  }}
                />
              </div>

              {/* Achievement 3: Colorful */}
              <div className="transform rotate-6 translate-y-6 hover:scale-105 hover:rotate-0 transition-all duration-500 pointer-events-auto">
                <AchievementCard 
                  unlocked={true}
                  achievement={{
                    id: 'colorful_thinker',
                    title: 'Colorful',
                    description: 'Log five distinct aesthetic color palettes.',
                    rarity: 'Epic',
                    icon: Palette,
                    xp: 40,
                    unlockedAt: new Date().toISOString()
                  }}
                />
              </div>

            </div>
          </motion.div>
        </section>

        {/* Section 6: Call to action (Charcoal/Dark Grey Refined) */}
        <section className="relative h-screen flex flex-col items-center justify-center pointer-events-auto z-50">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            style={{ 
              width: lastScrollWidth,
              borderRadius: lastScrollRadius,
              padding: lastScrollPadding
            }}
            className="w-full h-full bg-[#1c1d22] text-[#f8fafc] text-center shadow-[0_0_80px_rgba(0,0,0,0.2)] relative overflow-hidden group flex flex-col justify-center items-center"
          >
            {/* Shimmery Water Galaxy Background */}
            <div className="absolute inset-0 pointer-events-none opacity-85">
              {/* Deep Space Background Nebulae */}
              <div className="absolute inset-0 bg-[#06070b]" />
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_25%,#4c1d95_0%,transparent_50%)] animate-pulse duration-[10s]" />
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_75%,#831843_0%,transparent_50%)] animate-pulse duration-[12s]" />
              <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_50%_50%,#1e3a8a_0%,transparent_60%)]" />
              <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 blur-[130px] rounded-full animate-blob mix-blend-screen" />
              <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-500/20 blur-[110px] rounded-full animate-blob animation-delay-2000 mix-blend-screen" />
              
              {/* Ultra-fine backdrop star field */}
              <div className="absolute inset-0 opacity-35" style={{ 
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 0)', 
                backgroundSize: '30px 30px' 
              }} />
              <div className="absolute inset-0 opacity-25 animate-pulse" style={{ 
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1.5px, transparent 0)', 
                backgroundSize: '80px 80px',
                animationDuration: '4s'
              }} />

              {/* Twinkling Magical Fantasy Stars */}
              {FANTASY_STARS.map((star, idx) => (
                <motion.div
                  key={idx}
                  className={`absolute ${star.color} pointer-events-none`}
                  style={{
                    left: star.left,
                    top: star.top,
                    width: star.size,
                    height: star.size,
                  }}
                  animate={{
                    opacity: [0.2, 0.95, 0.2],
                    scale: [0.75, 1.15, 0.75],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: star.duration,
                    delay: star.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                </motion.div>
              ))}
              
              {/* Shimmer water effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent mix-blend-overlay animate-wave" />
            </div>
            
            {/* Soft ambient glow */}
            <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
            
            <div className="max-w-2xl mx-auto px-6 sm:px-0 space-y-6 md:space-y-8 relative z-10 w-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="w-12 h-12 md:w-16 md:h-16 p-2 rounded-2xl">
                  <Logo className="w-full h-full" glow={true} />
                </div>
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 font-mono font-display">
                  PENSIEVE
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-black text-white leading-tight sm:leading-none text-center">
                Begin your <br/> <span className="text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] italic">Second Brain.</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-white/75 max-w-md mx-auto leading-relaxed font-sans text-center">
                Experience the absolute clarity of an unburdened mind. Your memory cards, completely sovereign to you.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                {!showEmailInput ? (
                  <>
                    <button 
                      onClick={() => setShowEmailInput(true)}
                      className="group px-10 py-5 bg-primary text-white rounded-2xl text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 flex items-center gap-3 cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      Enter Workspace
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={handleGoogleSignIn}
                      className="px-10 py-5 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-base font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <form 
                    onSubmit={handleEmailSignIn}
                    className="w-full max-w-md flex flex-col gap-3 mx-auto"
                  >
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                      required
                    />
                    <div className="flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
