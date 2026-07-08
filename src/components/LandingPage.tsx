import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
  useMotionValueEvent
} from 'motion/react';
import { ArrowRight, Search, Sparkles, Heart, Palette, Compass, Trophy, Activity, Lock, Cloud, Mic, Volume2, LogIn, Github, Play, Check, CircleCheck as CheckCircle2, Quote as QuoteIcon, FileText, Zap, Maximize2, ShoppingBag, Shield, Layers, Plug, Cpu, ShieldCheck, Code2, Database, Image as ImageIcon, FileSpreadsheet, FileJson, Music, Video, Table2, HardDrive, LayoutGrid, BookOpen, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import SparkleCursor from './SparkleCursor';
import AchievementCard from './AchievementCard';

interface LandingAchievementCardProps {
  achievement: any;
  rotationClass?: string;
}

function LandingAchievementCard({ achievement, rotationClass = "" }: LandingAchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        rootMargin: "-20% 0px -20% 0px", // Trigger when the card is in the middle 60% of the screen
        threshold: 0.15
      }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Unlocked if hovered OR in view (mid-scroll on mobile)
  const unlocked = isHovered || isInView;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`transform transition-all duration-500 pointer-events-auto ${rotationClass} ${unlocked ? 'scale-[1.03] z-20' : 'scale-[0.98] opacity-80'}`}
    >
      <AchievementCard 
        unlocked={unlocked}
        achievement={achievement}
      />
    </div>
  );
}

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

const BACKDROP_STARS = Array.from({ length: 150 }).map((_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${Math.random() * 2 + 0.5}px`,
  delay: Math.random() * 5,
  duration: 3 + Math.random() * 4,
  opacity: Math.random() * 0.5 + 0.2
}));

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

  // Shift transform ranges to accommodate new flow - tighter ranges for faster fade-in
  const gridRange = isMobile ? [0.02, 0.06] : [0.04, 0.09];
  const searchRange = isMobile ? [0.08, 0.12] : [0.12, 0.18];
  const aiRange = isMobile ? [0.14, 0.18] : [0.20, 0.26];
  const captureRange = isMobile ? [0.20, 0.24] : [0.28, 0.34];
  const gamifiedMarketRange = isMobile ? [0.26, 0.30] : [0.36, 0.44];
  const serendipityRange = isMobile ? [0.34, 0.38] : [0.48, 0.56];
  const infraRange = isMobile ? [0.42, 0.46] : [0.60, 0.70];

  // Content grid fades in
  const gridOpacity = useTransform(smoothProgress, gridRange, [0, 1]);
  const gridY = useTransform(smoothProgress, gridRange, [30, 0]);

  // Search section
  const searchOpacity = useTransform(smoothProgress, searchRange, [0, 1]);
  const searchY = useTransform(smoothProgress, searchRange, [30, 0]);

  // AI section
  const aiOpacity = useTransform(smoothProgress, aiRange, [0, 1]);
  const aiY = useTransform(smoothProgress, aiRange, [30, 0]);

  // Capture section
  const captureOpacity = useTransform(smoothProgress, captureRange, [0, 1]);
  const captureY = useTransform(smoothProgress, captureRange, [30, 0]);

  // Gamified Marketplace section (Combined market + xp)
  const marketOpacity = useTransform(smoothProgress, gamifiedMarketRange, [0, 1]);
  const marketY = useTransform(smoothProgress, gamifiedMarketRange, [30, 0]);

  // Serendipity section
  const serendipityOpacity = useTransform(smoothProgress, serendipityRange, [0, 1]);
  const serendipityY = useTransform(smoothProgress, serendipityRange, [30, 0]);
  const serendipityScale = useTransform(smoothProgress, serendipityRange, [0.97, 1]);

  // Infrastructure section
  const infraOpacity = useTransform(smoothProgress, infraRange, [0, 1]);
  const infraY = useTransform(smoothProgress, infraRange, [30, 0]);

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
      setSearchPlaceholder("Neural Search: 'brutalist glassmorphic app designs'...");
    } else if (latest >= 0.3 && latest < 0.48) {
      setSearchPlaceholder("Processing: Image + PDF + Voice context...");
    } else if (latest >= 0.48 && latest < 0.68) {
      setSearchPlaceholder("Aura Unlocked: +150 XP earned...");
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
        <section className="relative min-h-screen flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: gridOpacity, y: gridY }}
            className="w-full max-w-5xl space-y-20"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mx-auto">
                <LayoutGrid className="w-3.5 h-3.5" /> Neural Workspace
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight tracking-tight">Effortless Mind Mapping</h2>
              <p className="text-xs md:text-sm text-foreground/60 leading-relaxed font-sans max-w-xl mx-auto">
                Everything you capture is instantly analyzed, beautifully structured, and preserved inside your local sandboxed database. A fluid vault for a fluid mind.
              </p>
            </div>
            
            <div className="columns-1 sm:columns-2 md:columns-3 gap-8 space-y-8 max-w-4xl mx-auto">
              
              {/* 1. Quote Card Swatch */}
              <div className="w-full bg-[#121212] text-white p-6 rounded-3xl border border-white/10 break-inside-avoid flex flex-col gap-4 text-center justify-center items-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 pointer-events-auto shadow-sm">
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Quote</span>
                <QuoteIcon className="w-4 h-4 text-white/20" />
                <blockquote className="font-serif italic text-xs text-white leading-relaxed">
                  "Simplicity is the ultimate sophistication. It resides in the empty space between things."
                </blockquote>
                <div className="text-[9px] font-mono text-white/50">
                  — Leonardo da Vinci
                </div>
              </div>

              {/* 2. Color Palette Swatches */}
              <div className="w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden break-inside-avoid shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col text-foreground relative group pointer-events-auto">
                <div className="w-full h-24 flex">
                  {['#E8B4B8', '#FFD3B6', '#D4A5A5', '#6C5B7B'].map((hex, i) => (
                    <div key={i} className="flex-1 h-full hover:flex-[1.5] transition-all duration-300 relative cursor-pointer" style={{ backgroundColor: hex }}>
                      <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] font-mono text-white font-bold select-none">
                        Copy
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 flex flex-col gap-1.5 border-t border-card-border bg-card-bg">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-card-title tracking-tight uppercase truncate">
                      #E8B4B8, #FFD3B6, #D4A5...
                    </span>
                    <span className="text-[8px] font-sans font-medium text-card-desc flex items-center gap-1 bg-card-footer px-2 py-0.5 rounded-md border border-card-border">
                      <Palette className="w-2.5 h-2.5 text-card-desc" />
                      Palette
                    </span>
                  </div>
                  <h3 className="font-display font-medium text-xs text-card-title line-clamp-1 leading-snug">
                    Sunset Over Tokyo
                  </h3>
                  <p className="text-[10px] text-card-desc font-sans leading-relaxed line-clamp-2">
                    Warm sepia and dusty violets from the evening landscape.
                  </p>
                </div>
              </div>

              {/* 3. Disruption-Free Reader Card */}
              <div className="w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col text-foreground relative border-l-[3px] border-indigo-300/60 rounded-r-3xl group break-inside-avoid pointer-events-auto">
                <div className="p-4 bg-card-footer border-b border-card-border flex items-center justify-between">
                  <span className="text-[9px] font-mono font-semibold text-card-desc uppercase">Sovereign Mind</span>
                  <span className="text-[8px] font-sans font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" /> Reader Mode
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 bg-card-bg">
                  <h3 className="font-serif font-bold text-xs text-card-title leading-snug tracking-tight">
                    The Philosophy of Subtraction
                  </h3>
                  <p className="text-[10px] text-card-desc leading-relaxed font-sans line-clamp-3">
                    In a world of constant notification noise, the act of removal becomes an act of mental rebellion. By purging secondary inputs, we allow primary intentions to grow...
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-card-border mt-1 text-[9px] font-mono">
                    <span className="text-card-desc opacity-80">subtraction.io</span>
                    <span className="text-indigo-400 font-semibold">3 min read</span>
                  </div>
                </div>
              </div>

              {/* 4. Beautiful Image Card */}
              <div className="w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col text-foreground relative group break-inside-avoid pointer-events-auto">
                <div className="w-full overflow-hidden bg-card-footer relative">
                  <img 
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80" 
                    alt="Ocean beach" 
                    className="w-full object-cover max-h-[180px] transition-transform duration-500 group-hover:scale-102"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col gap-1.5 bg-card-bg border-t border-card-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-card-desc">
                      Captured today
                    </span>
                    <span className="text-[8px] font-sans font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" /> Image
                    </span>
                  </div>
                  <h3 className="font-serif italic text-xs text-neutral-800 dark:text-neutral-200 line-clamp-1 leading-snug text-center">
                    "Infinite Horizons"
                  </h3>
                </div>
              </div>

              {/* 5. Checklist Card */}
              <div className="w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col text-foreground relative group break-inside-avoid pointer-events-auto" style={{ backgroundColor: '#FFFDF5', color: '#2C2114' }}>
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-45">List</span>
                    <span className="text-[9px] font-mono opacity-45">2/3 done</span>
                  </div>
                  <h3 className="font-semibold text-xs tracking-tight leading-snug">
                    Weekend Flow Rituals
                  </h3>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-start gap-2 cursor-pointer">
                      <button type="button" className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all bg-[#B28A54] border-[#B28A54] text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                      <span className="text-[10px] tracking-tight transition-all leading-tight line-through opacity-40 font-normal">
                        Unplug screens for 4 hours
                      </span>
                    </div>
                    <div className="flex items-start gap-2 cursor-pointer">
                      <button type="button" className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all bg-[#B28A54] border-[#B28A54] text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                      <span className="text-[10px] tracking-tight transition-all leading-tight line-through opacity-40 font-normal">
                        Log color swatches of the sunset
                      </span>
                    </div>
                    <div className="flex items-start gap-2 cursor-pointer">
                      <button type="button" className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all border-neutral-300 bg-white" />
                      <span className="text-[10px] tracking-tight transition-all leading-tight font-medium">
                        Sketch new design patterns
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Voice Waveform Card */}
              <div className="w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col text-foreground relative p-4 bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-transparent group break-inside-avoid pointer-events-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                    <Volume2 className="w-2.5 h-2.5 text-amber-500" /> Voice Note
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">0:14</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display font-semibold text-xs text-foreground line-clamp-1 leading-snug tracking-tight">
                    Brainstorming UI cues
                  </h3>
                  <div className="flex items-center gap-2.5 bg-black/5 rounded-2xl p-2 mt-1">
                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer hover:scale-105 transition">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </div>
                    <div className="flex-1 flex items-center gap-0.5 h-4">
                      {[15, 30, 10, 40, 50, 25, 15, 30, 45, 10, 35, 20, 30, 25, 15].map((h, i) => (
                        <div key={i} className="w-1 bg-amber-500 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </section>
        {/* Section 4: Universal Multi-Modal Capture */}
        <section className="relative min-h-screen flex flex-col items-center justify-start pt-28 pb-20 px-6 md:px-16 lg:px-24 pointer-events-none">
          <motion.div 
            style={{ opacity: captureOpacity, y: captureY }}
            className="w-full max-w-5xl flex flex-col items-center gap-12"
          >
            {/* Centered Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest mx-auto">
                <Layers className="w-3.5 h-3.5 animate-pulse" /> Universal Ingestion
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-tight tracking-tight">Universal Capture</h2>
              <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-sans max-w-xl mx-auto">
                Your brain doesn't just work in plain text. Neither does Pensieve. Effortlessly ingest raw voice notes, high-res screen captures, PDF whitepapers, and complex worksheets. Our pipeline normalizes everything into a queryable memory node.
              </p>
            </div>

            {/* Redesigned Multimodal Ingestion Deck */}
            <div className="w-full max-w-4xl grid md:grid-cols-12 gap-6 items-stretch relative">
              <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/10 via-transparent to-purple-500/5 rounded-[4rem] blur-3xl pointer-events-none" />

              {/* Left Panel: The Live Ingest Queue (Col span 5) */}
              <div className="md:col-span-5 bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[360px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-black/[0.05]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">Ingestion Feed</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'voice_memo_04.wav', status: 'Transcribing', pct: '84%', color: 'border-amber-500/20 text-amber-600 bg-amber-500/5', icon: <Mic className="w-3.5 h-3.5" /> },
                      { name: 'market_report.pdf', status: 'Vectorizing', pct: '62%', color: 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5', icon: <FileText className="w-3.5 h-3.5" /> },
                      { name: 'financials_q3.xlsx', status: 'Parsing Tables', pct: '100%', color: 'border-purple-500/20 text-purple-600 bg-purple-500/5', icon: <Table2 className="w-3.5 h-3.5" /> },
                      { name: 'scene_capture_98.jpg', status: 'OCR Semantic Indexing', pct: '28%', color: 'border-blue-500/20 text-blue-600 bg-blue-500/5', icon: <ImageIcon className="w-3.5 h-3.5" /> }
                    ].map((file, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className="p-3 bg-white/85 border border-black/[0.03] rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl border ${file.color}`}>
                            {file.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold text-neutral-800 truncate">{file.name}</h4>
                            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">{file.status}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-600">{file.pct}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-black/[0.05] flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Threads Active: 4/4</span>
                  <span className="text-amber-600 font-bold">Auto-Scaling</span>
                </div>
              </div>

              {/* Right Panel: Ingestion Gateway Center (Col span 7) */}
              <div className="md:col-span-7 bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[360px]">
                <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none" />
                
                {/* Immersive Rotating Scanning Core */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                  {/* Outer Orbital Grid Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-dashed border-amber-500/30 rounded-full"
                  />
                  {/* Secondary Orbital Wave Ring */}
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border border-dashed border-purple-500/20 rounded-full"
                  />
                  
                  {/* Core Particle Glow */}
                  <div className="absolute w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
                  
                  {/* Ingestion Hub Emblem */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        "0 0 20px rgba(245, 158, 11, 0.15)",
                        "0 0 40px rgba(245, 158, 11, 0.35)",
                        "0 0 20px rgba(245, 158, 11, 0.15)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-white z-10"
                  >
                    <Zap className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]" />
                  </motion.div>

                  {/* Flowing Data Nodes */}
                  <motion.div 
                    animate={{ x: [-40, 10], y: [-30, -5], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-2 h-2 rounded-full bg-amber-500"
                  />
                  <motion.div 
                    animate={{ x: [40, -10], y: [30, 5], opacity: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-purple-500"
                  />
                  <motion.div 
                    animate={{ x: [-20, 20], y: [40, -10], opacity: [0, 0.8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute w-2 h-2 rounded-full bg-emerald-500"
                  />
                </div>

                <div className="text-center space-y-1.5 z-10">
                  <h3 className="text-sm font-black tracking-widest text-neutral-850 font-mono uppercase">Thought Normalization</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em]">Embedding Pipeline Active • 3072 dims</p>
                </div>

                {/* Cyber HUD overlay bars */}
                <div className="w-full mt-6 grid grid-cols-2 gap-4 border-t border-black/[0.05] pt-4 text-center">
                  <div>
                    <div className="text-[10px] font-mono text-neutral-500 uppercase">Vector Latency</div>
                    <div className="text-xs font-black text-amber-600 font-mono">1.2ms / node</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-neutral-500 uppercase">Memory Index</div>
                    <div className="text-xs font-black text-purple-600 font-mono">Normalized</div>
                  </div>
                </div>

              </div>
            </div>

          </motion.div>
        </section>

        {/* Section 5: Gamified Intelligence & XP Economy */}
        <section className="relative min-h-screen flex flex-col items-center justify-start pt-28 pb-20 px-6 md:px-16 lg:px-24 pointer-events-none">
          <motion.div 
            style={{ opacity: marketOpacity, y: marketY }}
            className="w-full max-w-5xl flex flex-col items-center gap-12"
          >
            {/* Centered Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-black uppercase tracking-widest mx-auto">
                <Activity className="w-3.5 h-3.5" /> Intelligence Loop
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-tight tracking-tight">Intelligence Redefined</h2>
              <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-sans max-w-xl mx-auto">
                Cognition is your currency. Every thought captured, every pattern recognized, and every milestone reached fuels your neural economy. Unlock custom aesthetic effects and auras.
              </p>
            </div>

            {/* Redesigned Quantum Aura Engine HUD */}
            <div className="w-full max-w-4xl grid md:grid-cols-12 gap-6 items-stretch relative">
              <div className="absolute -inset-12 bg-purple-500/10 rounded-[4rem] blur-[100px] pointer-events-none" />

              {/* Left Column: Concentric Quantum Level Orbits (Col span 5) */}
              <div className="md:col-span-5 bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[440px]">
                <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 to-transparent pointer-events-none" />
                
                {/* Multi-layered rotating level orb */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl animate-pulse rounded-full" />
                  
                  {/* Outer Orbit (Clockwise) */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-purple-500/20 rounded-full"
                  />
                  {/* Inner Orbit (Counter-clockwise) */}
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 border border-indigo-500/10 border-dashed rounded-full"
                  />
                  {/* Level node circle */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </motion.div>
                  
                  {/* Core Glowing Ball */}
                  <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-500 to-indigo-400 text-white z-10">
                    <Trophy className="w-7 h-7 mb-1 animate-bounce" />
                    <span className="text-3xl font-black font-display leading-none">24</span>
                    <span className="text-[8px] font-mono font-bold text-white/50 tracking-wider mt-0.5">LEVEL</span>
                  </div>
                </div>

                <div className="text-center mt-6 z-10 space-y-1">
                  <h3 className="text-xl font-black text-neutral-800">Cognitive Master</h3>
                  <p className="text-[10px] font-mono font-bold text-indigo-600 tracking-[0.2em] uppercase">Pensieve Tier III Status</p>
                </div>

                {/* In-HUD Progress Indicator */}
                <div className="w-full mt-6 space-y-2 z-10">
                  <div className="flex justify-between items-end text-[10px] font-mono">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider">Aura Progress</span>
                    <span className="text-indigo-600 font-bold">14,200 / 15,000 XP</span>
                  </div>
                  <div className="h-5 bg-white/80 rounded-full border border-black/[0.04] p-1 overflow-hidden shadow-inner flex items-center">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '94%' }}
                      transition={{ duration: 2, ease: "circOut" }}
                      className="relative h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full overflow-hidden"
                    >
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Right Column: Cybernetic Aura Slots (Col span 7) */}
              <div className="md:col-span-7 bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[440px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-black/[0.05]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">Aura Socket Interface</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">6 Active Categories</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {[
                      { name: 'Widget Auras', desc: 'Active Card Theme', effect: 'Floating Neon', status: 'Equipped', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
                      { name: 'Border Rings', desc: 'Avatar Profile Halo', effect: 'Rotating Neon', status: 'Equipped', icon: <Palette className="w-3.5 h-3.5 text-purple-500" /> },
                      { name: 'SearchBar Glow', desc: 'Focus-Linked Lens', effect: 'Refractive Crystal', status: 'Equipped', icon: <Search className="w-3.5 h-3.5 text-blue-500" /> },
                      { name: 'App UI Themes', desc: 'Global CSS Presets', effect: 'Glassmorphism v2', status: 'Equipped', icon: <Layers className="w-3.5 h-3.5 text-emerald-500" /> },
                      { name: 'Profile PFPs', desc: 'Crest Icon Insignia', effect: 'Golden Badge', status: 'LOCKED', icon: <Lock className="w-3.5 h-3.5 text-neutral-400" /> },
                      { name: 'Name Tag', desc: 'Chroma Glitch Active', effect: 'Matrix Offset', status: 'LOCKED', icon: <Lock className="w-3.5 h-3.5 text-neutral-400" /> }
                    ].map((slot, index) => (
                      <div 
                        key={index} 
                        className={`p-3 bg-white/85 border rounded-2xl flex flex-col justify-between min-h-[90px] shadow-sm transition-all hover:scale-[1.01] ${
                          slot.status === 'Equipped' 
                            ? 'border-indigo-500/20 bg-indigo-500/[0.01] shadow-md shadow-indigo-500/5' 
                            : 'border-black/[0.03] opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${slot.status === 'Equipped' ? 'bg-indigo-500/10' : 'bg-neutral-500/10'}`}>
                            {slot.icon}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-800 truncate">{slot.name}</span>
                        </div>
                        
                        <div className="space-y-0.5 mt-2">
                          <p className="text-[9px] font-mono text-neutral-500 leading-none">{slot.desc}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] font-bold text-neutral-800 truncate">{slot.effect}</span>
                            <span className={`text-[8px] font-mono font-bold uppercase ${slot.status === 'Equipped' ? 'text-indigo-600' : 'text-neutral-400'}`}>
                              {slot.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-black/[0.05] flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>System Synced: +120 XP today</span>
                  <span className="text-purple-600 font-bold">12/12 Aura Achievements</span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-xl space-y-8 flex flex-col items-center mt-6">
              <div className="grid grid-cols-2 gap-12 w-full max-w-xs mx-auto text-center">
                <div className="space-y-1 group">
                  <div className="text-2xl font-black text-foreground group-hover:text-indigo-500 transition-colors">14.2k</div>
                  <div className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60 transition-colors">Total Aura XP</div>
                </div>
                <div className="space-y-1 group">
                  <div className="text-2xl font-black text-foreground group-hover:text-purple-500 transition-colors">12</div>
                  <div className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60 transition-colors">Auras Unlocked</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: "Dynamic GLSL Shader Auras", color: "text-indigo-500" },
                  { label: "Neural Level Scaling System", color: "text-purple-500" },
                  { label: "Effect Marketplace Rewards", color: "text-amber-500" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-foreground/80 bg-white/50 border border-black/[0.03] p-2.5 rounded-xl">
                    <CheckCircle2 className={`w-4 h-4 ${item.color}`} /> {item.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 6: Serendipity & Intelligence (High Fidelity Achievement Cards) */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: serendipityOpacity, y: serendipityY }}
            className="w-full max-w-5xl space-y-16"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-widest mx-auto">
                <Sparkles className="w-3.5 h-3.5" /> High Fidelity
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight tracking-tight">Magical Moments. <br/><span className="text-rose-600 italic">Visual Serendipity.</span></h2>
              <p className="text-xs md:text-sm text-foreground/60 leading-relaxed font-sans max-w-xl mx-auto">
                Every memory card is a work of art. Our generative UI engine crafts unique visual achievements for your milestones, turning data into digital keepsakes.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-12 scale-90 md:scale-100">
              
              {/* Achievement 1: First Spark */}
              <LandingAchievementCard 
                rotationClass="-rotate-6 translate-y-4"
                achievement={{
                  id: 'first_spark',
                  title: 'First Spark',
                  description: 'Save your very first card to kick off your database.',
                  rarity: 'Common',
                  icon: Sparkles,
                  xp: 10,
                  image: '/assets/images/first_spark_1783225522306.jpg',
                  unlockedAt: new Date().toISOString()
                }}
              />

              {/* Achievement 2: Wandering Mind */}
              <LandingAchievementCard 
                rotationClass="rotate-1 -translate-y-2 z-10"
                achievement={{
                  id: 'wandering_mind',
                  title: 'Wandering Mind',
                  description: 'Collect 50 distinct thoughts inside your neural context.',
                  rarity: 'Rare',
                  icon: Compass,
                  xp: 50,
                  image: '/assets/images/wandering_mind_1783225553989.jpg',
                  unlockedAt: new Date().toISOString()
                }}
              />

              {/* Achievement 3: Colorful */}
              <LandingAchievementCard 
                rotationClass="rotate-6 translate-y-6"
                achievement={{
                  id: 'colorful_thinker',
                  title: 'Colorful',
                  description: 'Log five distinct aesthetic color palettes.',
                  rarity: 'Epic',
                  icon: Palette,
                  xp: 40,
                  image: '/assets/images/colorful_thinker_1783225582426.jpg',
                  unlockedAt: new Date().toISOString()
                }}
              />

            </div>
          </motion.div>
        </section>

        {/* Section: Technical Infrastructure Grid */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: infraOpacity, y: infraY }}
            className="w-full max-w-5xl space-y-20"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mx-auto">
                <Database className="w-3.5 h-3.5" /> Core Architecture
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight tracking-tight">Enterprise Infrastructure. <br/><span className="text-primary italic">Consumer Soul.</span></h2>
              <p className="text-xs md:text-sm text-foreground/60 leading-relaxed font-sans max-w-xl mx-auto">
                Built on a mission-critical stack with local-first persistence. Your second brain is secured by industry-leading cloud protocols while maintaining a human-centric experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-555 border border-indigo-500/20">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Native Inspector</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">A gesture-optimized Notion-style rich editor. Fully responsive with native haptic feedback support.</p>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-555 border border-teal-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Identity & Security</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">Firebase Identity Platform integration with encrypted session management and global edge sync.</p>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-555 border border-rose-500/20">
                  <Plug className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Universal Bridges</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">Import external assets from Google Photos, Drive, and OneDrive via our experimental Cloud Plugins.</p>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-555 border border-indigo-500/20">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Appwrite Realtime</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">High-performance document storage with sub-100ms synchronization across all linked instances.</p>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-555 border border-emerald-500/20">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Offline Persistence</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">Robust IndexedDB implementation ensuring your data remains editable even in zero-connectivity environments.</p>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-black/[0.03] shadow-sm bg-white/40 backdrop-blur-md space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-555 border border-amber-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-display tracking-tight text-foreground">Power User Shell</h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-sans">A frictionless CLI-style keyboard interface designed for rapid thought logging and workspace navigation.</p>
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
              
               {/* Ultra-fine randomized star field */}
               {BACKDROP_STARS.map((star, idx) => (
                 <motion.div
                   key={`backdrop-${idx}`}
                   className="absolute bg-white rounded-full pointer-events-none"
                   style={{
                     left: star.left,
                     top: star.top,
                     width: star.size,
                     height: star.size,
                     opacity: star.opacity
                   }}
                   animate={{
                     opacity: [star.opacity, star.opacity * 0.5, star.opacity]
                   }}
                   transition={{
                     duration: star.duration,
                     delay: star.delay,
                     repeat: Infinity,
                     ease: "easeInOut"
                   }}
                 />
               ))}

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
