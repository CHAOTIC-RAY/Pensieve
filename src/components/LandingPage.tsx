import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useMotionValueEvent, 
  useSpring,
  AnimatePresence
} from 'motion/react';
import { 
  Brain, 
  Shield, 
  Zap, 
  ArrowRight, 
  Github, 
  Cloud, 
  Lock, 
  Layers, 
  Smartphone,
  Eye,
  Database,
  Search,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  Square,
  ChevronDown,
  Quote,
  Palette,
  FileText,
  Link2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Logo from './Logo';
import { animateScrollTo, waitMs, easeInOutQuint } from '../lib/guidedScroll';

// --- Sub-Components ---

/**
 * Sidebar component that mimics the app's side tab style
 */
const LandingSidebar = ({ activeSection, onLogoClick }: { activeSection: string; onLogoClick?: () => void }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-between fixed left-0 top-0 bottom-0 w-24 py-10 z-50 bg-background/5 backdrop-blur-xl border-r border-border-subtle/50">
      <div className="flex flex-col items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center gap-4 group cursor-pointer"
          onClick={onLogoClick}
        >
          <div className="w-12 h-12 flex items-center justify-center p-1.5 bg-background rounded-2xl shadow-premium border border-border-subtle group-hover:scale-105 transition-transform">
            <Logo className="w-full h-full" glow={false} />
          </div>
          <span className="text-[12px] font-bold tracking-[0.3em] uppercase text-foreground/40 font-mono vertical-text">
            PENSIEVE
          </span>
        </motion.div>

        <nav className="flex flex-col gap-6">
          {[
            { id: 'hero', icon: Sparkles, label: 'Hero' },
            { id: 'import', icon: Database, label: 'Vault' },
            { id: 'intelligent', icon: Brain, label: 'AI' },
            { id: 'sync', icon: Cloud, label: 'Sync' }
          ].map((item) => (
            <motion.div
              key={item.id}
              className="relative group"
              whileHover={{ x: 4 }}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border ${
                activeSection === item.id 
                  ? 'bg-primary/20 border-primary/30 text-primary' 
                  : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground hover:bg-foreground/10'
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-card-bg border border-border-subtle rounded-lg text-[10px] font-bold uppercase tracking-widest text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-premium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-4">
        <a href="https://github.com" target="_blank" rel="noreferrer" className="p-3 text-foreground/30 hover:text-foreground transition-colors">
          <Github className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};

/**
 * Feature Card with 3D UI Preview
 */
const FeaturePreview = ({ id, index }: { id: string, index: number }) => {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      className="relative w-full aspect-[16/10] rounded-[32px] overflow-hidden bg-[#111] border border-white/10 group shadow-2xl perspective-[1000px]"
      whileHover={{ 
        scale: 1.05, 
        rotateY: isEven ? -5 : 5,
        rotateX: 2,
        z: 20
      }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
    >
      {/* Background Gradient / Mesh */}
      <div className="absolute inset-0 opacity-20">
        {id === 'import' && (
           <div className="w-full h-full bg-gradient-to-br from-purple-500 via-transparent to-blue-500 animate-pulse" />
        )}
        {id === 'intelligent' && (
           <div className="w-full h-full bg-gradient-to-br from-amber-500 via-transparent to-red-500" />
        )}
        {id === 'sync' && (
           <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-transparent to-blue-500" />
        )}
      </div>

      {/* UI Mockup Content */}
      <div className="absolute inset-0 p-8 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
        {id === 'import' && <VaultMockup />}
        {id === 'intelligent' && <AIMockup />}
        {id === 'sync' && <SyncMockup />}
      </div>
      
      {/* Overlay Info */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold tracking-widest uppercase text-xs">
          Live Preview
        </div>
      </div>
    </motion.div>
  );
};

const VaultMockup = () => (
  <div className="w-full h-full bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
      </div>
      <div className="px-3 py-1 bg-white/5 rounded-md text-[10px] font-mono text-white/40">vault.local</div>
    </div>
    <div className="p-6 flex-1 grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="aspect-square rounded-xl bg-white/[0.03] border border-white/5 p-3 flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            {i % 3 === 0 ? <Quote className="w-4 h-4 text-primary" /> : i % 3 === 1 ? <FileText className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4 text-primary" />}
          </div>
          <div className="space-y-1.5">
             <div className="h-2 w-full bg-white/10 rounded-full" />
             <div className="h-2 w-2/3 bg-white/5 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const AIMockup = () => (
  <div className="w-[85%] h-[85%] bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Private Intelligence</div>
            <div className="text-[10px] text-white/40">Local LLM Processing</div>
          </div>
        </div>
        <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-widest">Active</div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="h-2 w-3/4 bg-white/10 rounded-full" />
          </div>
          <div className="h-2 w-1/2 bg-white/5 rounded-full ml-4" />
          <div className="pt-2 flex flex-wrap gap-2">
            <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold">#architecture</div>
            <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-bold">#minimalism</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SyncMockup = () => (
  <div className="relative w-full h-full flex items-center justify-center gap-8">
     <motion.div 
       animate={{ y: [0, -10, 0] }}
       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
       className="w-32 h-56 bg-[#0a0a0a] rounded-[24px] border border-white/10 shadow-2xl p-4 flex flex-col gap-3"
     >
       <div className="h-1 w-8 bg-white/20 rounded-full mx-auto" />
       <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-2 space-y-2">
          <div className="h-2 w-full bg-white/10 rounded-full" />
          <div className="h-2 w-2/3 bg-white/5 rounded-full" />
          <div className="aspect-square rounded-lg bg-primary/10 mt-4" />
       </div>
     </motion.div>
     
     <div className="flex flex-col items-center gap-4">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-full bg-primary/20 blur-xl" 
        />
        <Zap className="w-6 h-6 text-primary animate-pulse" />
     </div>

     <motion.div 
       animate={{ y: [0, 10, 0] }}
       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
       className="w-48 h-32 bg-[#0a0a0a] rounded-[16px] border border-white/10 shadow-2xl p-4 flex flex-col gap-3"
     >
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500" />
           <div className="text-[8px] font-mono text-white/40">DESKTOP-CLIENT_V2</div>
        </div>
        <div className="flex-1 rounded-lg bg-white/[0.02] border border-white/5" />
     </motion.div>
  </div>
);

// --- Main Page Component ---

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  
  // Guided Tour State
  const [tourActive, setTourActive] = useState(false);
  const [tourFocusId, setTourFocusId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ctaImmersive, setCtaImmersive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track active section for sidebar
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest > 0.9) setCtaImmersive(true);
    else setCtaImmersive(false);

    if (latest > 0.8) setActiveSection('sync');
    else if (latest > 0.5) setActiveSection('intelligent');
    else if (latest > 0.2) setActiveSection('import');
    else setActiveSection('hero');
  });

  const startAutoScroll = async () => {
    setTourActive(true);
    setIsPaused(false);
    
    const stops = [
      { id: 'hero', dwellMs: 2000 },
      { id: 'feature-import', dwellMs: 4000 },
      { id: 'feature-intelligent', dwellMs: 4000 },
      { id: 'feature-sync', dwellMs: 4000 },
      { id: 'footer-cta', dwellMs: 6000 }
    ];

    for (let i = 0; i < stops.length; i++) {
      if (!tourActive) break;
      
      const stop = stops[i];
      setTourFocusId(stop.id);
      
      const element = document.getElementById(stop.id);
      if (element) {
        const targetTop = element.offsetTop;
        await animateScrollTo({ 
          target: targetTop, 
          duration: i === stops.length - 1 ? 2500 : 1500,
          easing: i === stops.length - 1 ? easeInOutQuint : undefined
        });
      }

      // Wait while allowing for pause
      let elapsed = 0;
      while (elapsed < stop.dwellMs) {
        if (!tourActive) return;
        if (isPaused) {
          await waitMs(100);
          continue;
        }
        await waitMs(100);
        elapsed += 100;
      }
    }

    setTourActive(false);
  };

  useEffect(() => {
    // If user interacts with scroll, stop tour?
    // For now we keep it explicit.
  }, []);

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
      className="min-h-[400vh] bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden perspective-[1000px]"
    >
      {/* Side Navigation */}
      <LandingSidebar 
        activeSection={activeSection} 
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
      />

      {/* Main Content Area */}
      <main className="lg:pl-24">
        
        {/* Top Header for Mobile/Small Screens */}
        <nav className="fixed top-0 left-0 right-0 lg:left-24 z-50 px-6 py-6 flex items-center justify-between backdrop-blur-md bg-background/50 border-b border-border-subtle/30 lg:border-none">
          <div className="flex lg:hidden items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center p-1 bg-background rounded-xl shadow-premium border border-border-subtle">
                <Logo className="w-full h-full" glow={false} />
              </div>
              <span className="text-lg font-bold tracking-tight font-display">Pensieve</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button 
              onClick={startAutoScroll}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3" />
              Guided Tour
            </button>
            <button 
              onClick={handleGoogleSignIn}
              className="px-5 py-2.5 bg-foreground/5 text-foreground rounded-full text-xs font-bold hover:bg-foreground/10 transition-all cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => setShowEmailInput(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-5xl h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-60" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12 max-w-5xl"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-foreground/[0.03] border border-border-subtle text-foreground/60 text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              Private Beta Now Open
            </div>
            
            <h1 className="text-[12vw] md:text-[8vw] lg:text-[100px] font-bold font-display tracking-tight leading-[0.95] text-foreground">
              Memory is <br/>
              <span className="text-primary italic relative">
                Fluid.
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1.5 }}
                  className="absolute bottom-4 left-0 h-2 bg-primary/10 -z-10"
                />
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-foreground/50 max-w-2xl mx-auto leading-relaxed font-medium">
              The on-device digital vault for your evolving mind. <br className="hidden md:block" />
              Capture instantly, retrieve intelligently, sync globally.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
              {!showEmailInput ? (
                <>
                  <button 
                    onClick={() => setShowEmailInput(true)}
                    className="group px-10 py-5 bg-foreground text-background rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-2xl flex items-center gap-3 cursor-pointer active:scale-95"
                  >
                    Build Your Vault
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={handleGoogleSignIn}
                    className="px-10 py-5 bg-card-bg border border-border-subtle text-foreground rounded-2xl text-base font-bold hover:bg-foreground/5 transition-all flex items-center gap-3 cursor-pointer active:scale-95"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" />
                    Google Auth
                  </button>
                </>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onSubmit={handleEmailSignIn}
                  className="w-full max-w-md flex flex-col gap-3"
                >
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.03] border border-border-subtle focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                    required
                  />
                  <div className="flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl cursor-pointer"
                    >
                      Continue
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowEmailInput(false)}
                      className="px-6 py-4 bg-foreground/5 text-foreground/50 rounded-2xl font-bold hover:bg-foreground/10 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-foreground/30"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Explore Architecture</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </section>

        {/* Feature Scroll Sections */}
        <div className="max-w-7xl mx-auto px-6 space-y-[40vh] pb-[20vh]">
          
          {/* Section 1: Data Vault */}
          <section id="feature-import">
            <FeatureSection 
              id="import" 
              index={0} 
              progress={scrollYProgress} 
              range={[0.1, 0.4]}
            />
          </section>

          {/* Section 2: AI Intelligence */}
          <section id="feature-intelligent">
            <FeatureSection 
              id="intelligent" 
              index={1} 
              progress={scrollYProgress} 
              range={[0.4, 0.7]}
            />
          </section>

          {/* Section 3: Sync */}
          <section id="feature-sync">
            <FeatureSection 
              id="sync" 
              index={2} 
              progress={scrollYProgress} 
              range={[0.7, 0.9]}
            />
          </section>

        </div>

        {/* Closing Section */}
        <section id="footer-cta" className={`transition-all duration-1000 px-6 text-center ${ctaImmersive ? 'bg-foreground scale-100' : 'bg-transparent scale-95'}`}>
          <div className={`max-w-5xl mx-auto py-40 md:py-60 transition-all duration-1000 ${ctaImmersive ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-20'}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`max-w-5xl mx-auto p-12 md:p-24 rounded-[64px] transition-colors duration-1000 relative overflow-hidden group ${ctaImmersive ? 'bg-background text-foreground' : 'bg-foreground text-background shadow-3xl'}`}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-125" />
              
              <div className="relative z-10 space-y-10">
                <h2 className="text-4xl md:text-8xl font-bold font-display tracking-tight leading-none">
                  Begin your <br/> <span className="text-primary italic">Second Brain.</span>
                </h2>
                <p className="text-lg md:text-2xl opacity-60 max-w-xl mx-auto leading-relaxed">
                  Experience the clarity of a unified digital memory. Your thoughts, finally organized.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setShowEmailInput(true);
                    }}
                    className="px-12 py-6 bg-primary text-white rounded-2xl text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 cursor-pointer"
                  >
                    Enter the Vault
                  </button>
                </div>
              </div>
            </motion.div>
            
            <div className={`mt-40 flex flex-col items-center gap-12 pb-20 transition-colors duration-1000 ${ctaImmersive ? 'text-background/60' : 'text-foreground/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 p-1.5 rounded-xl border transition-colors ${ctaImmersive ? 'bg-background/10 border-background/20' : 'bg-foreground/5 border-border-subtle'}`}>
                  <Logo className="w-full h-full" glow={false} />
                </div>
                <span className={`text-xl font-bold tracking-tight font-display transition-colors ${ctaImmersive ? 'text-background' : 'text-foreground'}`}>Pensieve</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 text-[11px] font-bold uppercase tracking-widest opacity-60">
                <a href="#" className="hover:text-primary transition-colors">Architecture</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy Model</a>
                <a href="#" className="hover:text-primary transition-colors">LiteRT Engine</a>
                <a href="#" className="hover:text-primary transition-colors">Manifesto</a>
              </div>
              <p className="text-xs font-mono opacity-40">© 2026 Pensieve Systems Inc. All metadata encrypted on-device.</p>
            </div>
          </div>
        </section>

        {/* Guided Tour Controls */}
        <AnimatePresence>
          {tourActive && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-background/80 backdrop-blur-xl border border-border-subtle rounded-full shadow-2xl flex items-center gap-6"
            >
              <div className="flex items-center gap-3 pr-6 border-r border-border-subtle">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Guided Tour</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setTourActive(false)}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/**
 * Feature Section component that handles its own scroll progress
 */
function FeatureSection({ 
  id, 
  index, 
  progress, 
  range 
}: { 
  id: string; 
  index: number; 
  progress: any; 
  range: [number, number] 
}) {
  const isEven = index % 2 === 0;

  // Visual transformations
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [100, 0]);
  const scale = useTransform(progress, range, [0.95, 1]);
  
  // Spring versions for smoothness
  const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div 
      style={{ 
        opacity: springOpacity, 
        y: springY,
        scale: springScale
      }}
      className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16 md:gap-32 min-h-[70vh]`}
    >
      <div className="flex-1 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              MODULE 0{index + 1}
            </span>
            <div className="h-[1px] w-12 bg-border-subtle" />
          </div>
          <h2 className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[0.9] text-foreground">
            {id === 'import' && <>Structural <br/> Clarity.</>}
            {id === 'intelligent' && <>Deeply <br/> Private.</>}
            {id === 'sync' && <>Seamless <br/> Flow.</>}
          </h2>
        </div>
        
        <p className="text-lg md:text-xl text-foreground/50 leading-relaxed max-w-md font-medium">
          {id === 'import' && "Organize your life without the burden of folders. Our visual tagging system adapts to how you actually think, not how files are stored."}
          {id === 'intelligent' && "Experience world-class AI that respects your boundaries. Your notes are indexed and analyzed locally on your GPU, never reaching our servers."}
          {id === 'sync' && "Start a thought on your morning commute and finish it at your desk. High-speed delta synchronization keeps your entire vault updated across all surfaces."}
        </p>

        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2 group cursor-pointer">
             <div className="p-2 rounded-lg bg-foreground/5 group-hover:bg-primary/10 transition-colors">
                <Search className="w-4 h-4 text-foreground/40 group-hover:text-primary transition-colors" />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-foreground/30 group-hover:text-foreground transition-colors">Technical Spec</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
             <div className="p-2 rounded-lg bg-foreground/5 group-hover:bg-primary/10 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-foreground/40 group-hover:text-primary transition-colors" />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-foreground/30 group-hover:text-foreground transition-colors">Privacy Audit</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full perspective-[2000px]">
        <FeaturePreview id={id} index={index} />
      </div>
    </motion.div>
  );
}
