import React, { useRef, useState } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
  useMotionValueEvent
} from 'motion/react';
import { 
  ArrowRight, 
  Search,
  Sparkles,
  Heart,
  Palette,
  Compass,
  Trophy,
  Activity,
  Lock,
  Cloud,
  Mic,
  Volume2,
  LogIn,
  Github
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Logo from './Logo';

export default function LandingPage() {
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

  // Content grid fades in
  const gridOpacity = useTransform(smoothProgress, [0.12, 0.25], [0, 1]);
  const gridY = useTransform(smoothProgress, [0.12, 0.25], [80, 0]);

  // Additional features section fades in
  const featuresOpacity = useTransform(smoothProgress, [0.28, 0.45], [0, 1]);
  const featuresY = useTransform(smoothProgress, [0.28, 0.45], [80, 0]);

  // Voice Note section fades in
  const voiceOpacity = useTransform(smoothProgress, [0.48, 0.65], [0, 1]);
  const voiceY = useTransform(smoothProgress, [0.48, 0.65], [80, 0]);

  // Serendipity section
  const serendipityOpacity = useTransform(smoothProgress, [0.68, 0.82], [0, 1]);
  const serendipityScale = useTransform(smoothProgress, [0.68, 0.82], [0.95, 1]);

  // Last scroll zoom transitions (Forge-style full screen)
  const lastScrollWidth = useTransform(smoothProgress, [0.85, 0.98], ['90%', '100%']);
  const lastScrollRadius = useTransform(smoothProgress, [0.85, 0.98], ['48px', '0px']);
  const lastScrollPadding = useTransform(smoothProgress, [0.85, 0.98], ['4rem', '8rem']);

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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Email sign-in link sent to " + email + " (Simulation)");
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-[600vh] bg-[#FDFBF7] text-neutral-900 selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden"
    >
      {/* Sidebar Dock - Minimal tab style containing only sideways Logo, active tab rectangle, and Liquid Glass Login */}
      <motion.div 
        style={{ opacity: sidebarOpacity, x: sidebarX }}
        className="hidden lg:flex flex-col items-center justify-between fixed left-6 top-6 bottom-6 w-20 py-8 z-40 bg-white/70 backdrop-blur-xl border border-black/5 rounded-[28px] shadow-premium"
      >
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* Logo sideways / rotated */}
            <div className="w-11 h-11 flex items-center justify-center p-2 bg-background rounded-2xl border border-black/5 shadow-sm transform -rotate-90">
              <Logo className="w-full h-full" glow={false} />
            </div>
            <span className="text-[9px] font-bold tracking-[0.25em] text-foreground/45 font-mono rotate-90 my-4 inline-block whitespace-nowrap">
              PENSIEVE
            </span>
          </div>
        </div>

        {/* Minimal Tab Area containing only the active indicator (solid rectangle) and the liquid glass Login button */}
        <div className="flex flex-col items-center gap-6 w-full px-3">
          {/* Solid active indicator rectangle mimicking the tab list block */}
          <div className="w-10 h-3 rounded bg-primary/20 border border-primary/30" />
          
          {/* Liquid Glass Styled Login Button */}
          <button 
            onClick={handleGoogleSignIn}
            title="Log In"
            className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center justify-center cursor-pointer shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_8px_rgba(0,0,0,0.05)] hover:scale-105 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
          </button>

          {/* GitHub Icon */}
          <a
            href="https://github.com/CHAOTIC-RAY/Pensieve"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/10 transition-all flex items-center justify-center hover:scale-105"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </motion.div>

      {/* Top Header for Mobile/Navbar Fallback */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between backdrop-blur-md bg-background/30 border-b border-border-subtle/20 lg:hidden">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center p-1 bg-background rounded-xl border border-border-subtle">
            <Logo className="w-full h-full" glow={false} />
          </div>
          <span className="text-base font-bold tracking-tight font-display">Pensieve</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGoogleSignIn} className="px-3 py-1.5 bg-foreground/5 text-foreground rounded-lg text-[10px] font-bold uppercase">Log In</button>
          <button onClick={() => setShowEmailInput(true)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase">Start</button>
        </div>
      </nav>

      <main className="relative w-full">
        {/* Ambient Glow */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-5xl h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-60 pointer-events-none" />

        {/* Hero Section Sticky Container to prevent overlap */}
        <section className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 pointer-events-none select-none">
          {/* Centered Large Logo on first scroll */}
          <motion.div 
            style={{ opacity: centerLogoOpacity, scale: centerLogoScale }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <div className="w-20 h-20 p-2.5 bg-background rounded-3xl shadow-xl border border-border-subtle transform -rotate-90">
              <Logo className="w-full h-full" glow={true} />
            </div>
            <span className="text-sm font-bold tracking-[0.4em] uppercase text-foreground/60 font-mono">
              PENSIEVE
            </span>
          </motion.div>

          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }} 
            className="space-y-4 max-w-xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight leading-tight text-foreground">
              What are you remembering today?
            </h1>
            <p className="text-xs md:text-sm text-foreground/45 max-w-md mx-auto leading-relaxed font-sans">
              Search your private workspace or type to save instantly. A fluid mind needs a fluid vault.
            </p>
          </motion.div>

          {/* Floating Omnibar - Light Glass Mode */}
          <motion.div 
            className="w-full max-w-3xl z-40 px-4 mt-12 pointer-events-auto"
            style={{ y: omnibarY, scale: omnibarScale }}
          >
            <div className="w-full bg-white/95 backdrop-blur-xl shadow-premium rounded-[24px] p-1 flex items-center gap-3 border border-white/60">
              <div className="pl-3.5 text-neutral-450">
                <Search className="w-5 h-5 text-neutral-400" />
              </div>
              <input 
                type="text" 
                placeholder={searchPlaceholder} 
                className="flex-1 bg-transparent border-none outline-none text-base text-neutral-800 placeholder:text-neutral-400 py-3.5 font-sans"
                disabled
              />
              <div className="pr-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary border border-primary/25">
                  <Sparkles className="w-4 h-4" />
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
              <h2 className="text-3xl font-display font-bold text-foreground">Effortless Organization</h2>
              <p className="text-sm text-foreground/45 mt-2">Everything you save, automatically categorized and beautifully displayed.</p>
            </div>
            
            <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              {[
                { type: 'note', color: 'bg-rose-100/80', text: 'Architecture inspiration for the new project.', height: 'h-32' },
                { type: 'link', color: 'bg-blue-100/80', text: 'https://design.com', height: 'h-24' },
                { type: 'color', color: 'bg-emerald-200/80', text: '#A8D5BA', height: 'h-48' },
                { type: 'quote', color: 'bg-amber-100/80', text: '"Design is not just what it looks like and feels like. Design is how it works."', height: 'h-40' },
                { type: 'note', color: 'bg-purple-100/80', text: 'Grocery list: Milk, Eggs, Bread', height: 'h-24' },
                { type: 'article', color: 'bg-slate-100/80', text: 'The Future of Interfaces', height: 'h-48' },
              ].map((card, i) => (
                <div key={i} className={`w-full ${card.height} ${card.color} rounded-2xl p-4 break-inside-avoid shadow-sm border border-black/5 relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                  <p className="relative z-10 text-xs font-semibold text-neutral-800">{card.text}</p>
                </div>
              ))}
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
              <h2 className="text-3xl font-display font-bold text-foreground">Local-First Architecture</h2>
              <p className="text-sm text-foreground/45 mt-2">Maximum privacy. Your database stays securely in your browser context.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Zero Cloud Required</h3>
                <p className="text-xs text-foreground/50 leading-relaxed font-sans">Works entirely offline. All notes and images are parsed locally on your device.</p>
              </div>

              <div className="p-6 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-550">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Delta Sync Fallback</h3>
                <p className="text-xs text-foreground/50 leading-relaxed font-sans">Optionally connect to Firestore or Supabase. Fails back to local storage automatically if you lose connection.</p>
              </div>

              <div className="p-6 rounded-3xl border border-black/5 bg-white/40 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Telemetry & Analytics</h3>
                <p className="text-xs text-foreground/50 leading-relaxed font-sans">Get real-time insights into your mind palette: count favorites, track focused items, and swatch percentages.</p>
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
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Instant Voice Capture</h2>
              <p className="text-sm text-foreground/50 leading-relaxed font-sans">
                Speak your mind. Record brainstorming sessions or simple ideas directly from the Omnibar. Voice notes are compressed, saved as local playback cards, and ready for transcription.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-foreground/45">
                <Volume2 className="w-4 h-4" /> HTML5 MediaRecorder API Integration
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md bg-white/40 backdrop-blur-xl border border-black/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono text-red-500 font-bold uppercase">Recording Voice Note</span>
                </div>
                <span className="text-xs font-mono text-foreground/40">0:12 / 1:00</span>
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
              
              <div className="h-[1px] bg-black/10 w-full" />
              <div className="text-xs text-foreground/50 font-sans italic">"Reviewing user interface transitions for checkpoint 3..."</div>
            </div>
          </motion.div>
        </section>

        {/* Section 5: Serendipity & Intelligence */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none py-24">
          <motion.div 
            style={{ opacity: serendipityOpacity, scale: serendipityScale }}
            className="w-full max-w-4xl text-center space-y-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 shadow-xl mb-6">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
              Rediscover your <br/> <span className="italic text-primary">Wandering Mind.</span>
            </h2>
            <p className="text-sm md:text-base text-foreground/60 max-w-xl mx-auto font-sans">
              Recall long-forgotten thoughts instantly. Earn beautiful collectible achievement cards with 3D parallax effects as your workspace grows.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mt-12">
               <div className="w-44 h-56 bg-white/40 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform -rotate-6 translate-y-4">
                 <Trophy className="w-10 h-10 text-amber-500 mb-4 animate-bounce" />
                 <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/45">Milestone</span>
                 <span className="text-sm font-display font-bold">First Spark</span>
               </div>
               <div className="w-44 h-56 bg-white/40 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform rotate-3 -translate-y-2 z-10">
                 <Compass className="w-10 h-10 text-blue-500 mb-4" />
                 <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/45">Milestone</span>
                 <span className="text-sm font-display font-bold">Wandering Mind</span>
               </div>
               <div className="w-44 h-56 bg-white/40 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform rotate-12 translate-y-6">
                 <Palette className="w-10 h-10 text-rose-500 mb-4 animate-pulse" />
                 <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/45">Milestone</span>
                 <span className="text-sm font-display font-bold">Colorful</span>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Section 6: Call to action (Forge-style full-page zoom-in covering everything) */}
        <section className="relative h-screen flex flex-col items-center justify-center pointer-events-auto z-50">
          <motion.div 
            style={{ 
              width: lastScrollWidth,
              borderRadius: lastScrollRadius,
              padding: lastScrollPadding
            }}
            className="w-full max-w-5xl bg-gradient-to-tr from-foreground to-neutral-900 text-background text-center shadow-3xl relative overflow-hidden group h-full flex flex-col justify-center items-center"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[150px] rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-125 pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-none">
                Begin your <br/> <span className="text-primary italic">Second Brain.</span>
              </h2>
              <p className="text-sm md:text-lg text-white/60 leading-relaxed font-sans">
                Experience the absolute clarity of an organized mind. Your data, completely owned by you.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                {!showEmailInput ? (
                  <>
                    <button 
                      onClick={() => setShowEmailInput(true)}
                      className="group px-10 py-5 bg-white text-black rounded-2xl text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 cursor-pointer"
                    >
                      Enter Workspace
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={handleGoogleSignIn}
                      className="px-10 py-5 bg-white/10 border border-white/20 text-white rounded-2xl text-base font-bold hover:bg-white/20 transition-all flex items-center gap-3 cursor-pointer"
                    >
                      Google Auth
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
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                      required
                    />
                    <div className="flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl cursor-pointer"
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
