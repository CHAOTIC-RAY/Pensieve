import React, { useRef, useState } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
  useMotionValueEvent
} from 'motion/react';
import { ArrowRight, Search, Sparkles, Heart, Palette, Compass, Trophy, Activity, Lock, Cloud, Mic, Volume2, LogIn, Github, Play, Check, CircleCheck as CheckCircle2, Quote as QuoteIcon, FileText, Zap, Maximize2, ShoppingBag, Shield, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import SparkleCursor from './SparkleCursor';
import AchievementCard from './AchievementCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Save a note, link, or search...");

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

  // Content grid fades in - TRIGGER EARLIER & FINISH FASTER
  const gridOpacity = useTransform(smoothProgress, [0.08, 0.15], [0, 1]);
  const gridY = useTransform(smoothProgress, [0.08, 0.15], [40, 0]);

  // Additional features section fades in
  const featuresOpacity = useTransform(smoothProgress, [0.18, 0.28], [0, 1]);
  const featuresY = useTransform(smoothProgress, [0.18, 0.28], [40, 0]);

  // Voice Note section fades in
  const voiceOpacity = useTransform(smoothProgress, [0.32, 0.42], [0, 1]);
  const voiceY = useTransform(smoothProgress, [0.32, 0.42], [40, 0]);

  // Serendipity section
  const serendipityOpacity = useTransform(smoothProgress, [0.48, 0.58], [0, 1]);
  const serendipityScale = useTransform(smoothProgress, [0.48, 0.58], [0.97, 1]);

  // Last scroll zoom transitions (Forge-style full screen)
  const lastScrollWidth = useTransform(smoothProgress, [0.85, 0.98], ['90%', '100%']);
  const lastScrollRadius = useTransform(smoothProgress, [0.85, 0.98], ['48px', '0px']);
  const lastScrollPadding = useTransform(smoothProgress, [0.85, 0.98], ['4rem', '8rem']);

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
        </section>

        {/* Section 3: Highlighted Features */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: featuresOpacity, y: featuresY }}
            className="w-full max-w-5xl space-y-16"
          >
            <div className="text-center">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">ARCHITECTURE & FEATURES</span>
              <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mt-4 tracking-tight">Enterprise Infrastructure. <br/><span className="text-primary italic">Consumer Soul.</span></h2>
              <p className="text-xs md:text-sm text-foreground/45 mt-4 max-w-xl mx-auto leading-relaxed">Built on a robust Appwrite + Firebase Auth stack with offline capabilities. Your database stays securely in the cloud with high-performance edge synchronization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550 border border-indigo-500/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Appwrite Database</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Powered by Appwrite for real-time document storage. Features scalable infrastructure that securely syncs your workspace across all devices instantly.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-550 border border-emerald-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">On-Device WebLLM AI</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Run a 1.5B parameter language model entirely locally using WebLLM and WebGPU. 100% private semantic search and AI summarization—no data ever leaves your device.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-550 border border-rose-500/20">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Native Inspector Panel</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">A beautiful, Notion-style rich editor. Fully responsive: full-screen modal on mobile with native gestures, and a sleek focused card on desktop. Optimized for text, images, and voice notes.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550 border border-amber-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Effects Marketplace</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Spend earned XP in the integrated Store. Unlock cosmic themes, CRT monitor visual effects, custom name tags, and premium visual elements for your workspace.</p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-550 border border-teal-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Firebase Auth & Security</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Enterprise-grade authentication with Google Identity Platform. Complete with admin dashboard controls and strictly protected application environments.</p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-550 border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">XP Economy & Gamification</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Build habits with interactive milestones. Track progress via the comprehensive XP system and custom physical-style collectible achievement cards.</p>
              </div>
            </div>
          </motion.div>
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
                Speak your mind. Record brainstorming loops, ambient sounds, or flashes of genius directly from the Omnibar. Audio notes are compressed locally, archived as rich wave playback cards, and queued for offline indexing.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-foreground/75">
                <Volume2 className="w-4 h-4 text-amber-500" /> HTML5 MediaRecorder & WebAudio Nodes
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
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b0764_0%,transparent_50%)] animate-pulse duration-[8s]" />
              <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-blob mix-blend-screen" />
              <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-500/20 blur-[100px] rounded-full animate-blob animation-delay-2000 mix-blend-screen" />
              
              {/* Star field */}
              <div className="absolute inset-0 opacity-30" style={{ 
                backgroundImage: 'radial-gradient(white 1px, transparent 0)', 
                backgroundSize: '40px 40px' 
              }} />
              <div className="absolute inset-0 opacity-20 animate-pulse" style={{ 
                backgroundImage: 'radial-gradient(white 1.5px, transparent 0)', 
                backgroundSize: '100px 100px',
                animationDuration: '3s'
              }} />
              
              {/* Shimmer water effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent mix-blend-overlay animate-wave" />
            </div>
            
            {/* Soft ambient glow */}
            <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-16 h-16 p-2.5 rounded-2xl">
                  <Logo className="w-full h-full" glow={true} />
                </div>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 font-mono font-display">
                  PENSIEVE
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black text-white leading-none">
                Begin your <br/> <span className="text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] italic">Second Brain.</span>
              </h2>
              <p className="text-xs md:text-base text-white/75 max-w-md mx-auto leading-relaxed font-sans">
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
