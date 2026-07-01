import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
} from 'motion/react';
import { 
  ArrowRight, 
  Search,
  Sparkles,
  Play,
  Heart,
  Palette,
  FileText,
  Link2,
  Compass,
  Trophy
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Logo from './Logo';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Animations based on scroll
  // Hero section fades out slightly as you scroll down
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.9]);
  
  // Omnibar animates up and pins or just floats
  const omnibarY = useTransform(smoothProgress, [0, 0.2, 0.4], [0, -100, -150]);
  const omnibarScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

  // Grid fades in
  const gridOpacity = useTransform(smoothProgress, [0.1, 0.3], [0, 1]);
  const gridY = useTransform(smoothProgress, [0.1, 0.3], [100, 0]);

  // Serendipity section
  const serendipityOpacity = useTransform(smoothProgress, [0.4, 0.6], [0, 1]);
  const serendipityScale = useTransform(smoothProgress, [0.4, 0.6], [0.9, 1]);

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
      className="min-h-[400vh] bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden"
    >
      {/* Top Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between backdrop-blur-md bg-background/50 border-b border-border-subtle/30">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center p-1 bg-background rounded-xl shadow-premium border border-border-subtle">
              <Logo className="w-full h-full" glow={false} />
            </div>
            <span className="text-lg font-bold tracking-tight font-display">Pensieve</span>
        </div>
        <div className="flex items-center gap-4">
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

      <main className="relative w-full">
        {/* Ambient Glow */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-5xl h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-60 pointer-events-none" />

        {/* Section 1: Hero */}
        <section className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pointer-events-none">
          <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight text-foreground">
              What are you remembering today?
            </h1>
            <p className="text-sm md:text-lg text-foreground/50 max-w-xl mx-auto leading-relaxed font-sans">
              Search your private workspace or type to save instantly. A fluid mind needs a fluid vault.
            </p>
          </motion.div>
        </section>

        {/* The Omnibar Mockup - animates with scroll */}
        <motion.div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 w-full max-w-3xl z-40 px-4 pointer-events-auto"
          style={{ y: omnibarY, scale: omnibarScale }}
        >
          <div className="w-full liquid-glass-panel shadow-2xl rounded-[32px] p-2 flex items-center gap-4 group transition-all duration-300 hover:shadow-primary/20">
            <div className="pl-4 text-foreground/40">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              placeholder="Save a note, link, or search..." 
              className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-foreground/30 py-4 font-sans"
              disabled
            />
            <div className="pr-4 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Masonry Grid Preview */}
        <section className="relative h-screen flex flex-col items-center justify-center px-6 pointer-events-none">
          <motion.div 
            style={{ opacity: gridOpacity, y: gridY }}
            className="w-full max-w-5xl pt-32"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground">Effortless Organization</h2>
              <p className="text-sm text-foreground/50 mt-2">Everything you save, automatically categorized and beautifully displayed.</p>
            </div>
            
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {/* Mock Cards */}
              {[
                { type: 'note', color: 'bg-rose-100', text: 'Architecture inspiration for the new project.', height: 'h-32' },
                { type: 'link', color: 'bg-blue-100', text: 'https://design.com', height: 'h-24' },
                { type: 'color', color: 'bg-emerald-200', text: '#A8D5BA', height: 'h-48' },
                { type: 'quote', color: 'bg-amber-100', text: '"Design is not just what it looks like and feels like. Design is how it works."', height: 'h-40' },
                { type: 'note', color: 'bg-purple-100', text: 'Grocery list: Milk, Eggs, Bread', height: 'h-24' },
                { type: 'article', color: 'bg-slate-100', text: 'The Future of Interfaces', height: 'h-48' },
              ].map((card, i) => (
                <div key={i} className={`w-full ${card.height} ${card.color} rounded-2xl p-4 break-inside-avoid shadow-sm border border-black/5 relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                  <p className="relative z-10 text-xs font-medium text-black/70">{card.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Section 3: Serendipity & Intelligence */}
        <section className="relative h-screen flex flex-col items-center justify-center px-6 pointer-events-none">
          <motion.div 
            style={{ opacity: serendipityOpacity, scale: serendipityScale }}
            className="w-full max-w-4xl text-center space-y-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-200 to-orange-300 shadow-xl mb-6">
              <Compass className="w-10 h-10 text-orange-700" />
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight">
              Rediscover your <br/> <span className="italic text-primary">Wandering Mind.</span>
            </h2>
            <p className="text-xl text-foreground/60 max-w-2xl mx-auto font-sans">
              Click the Serendipity button to instantly recall a forgotten thought. Earn unique 3D milestone cards as you build your collection.
            </p>

            <div className="flex justify-center gap-6 mt-12">
               <div className="w-48 h-64 liquid-glass-panel rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform -rotate-6 translate-y-4">
                 <Trophy className="w-12 h-12 text-amber-500 mb-4" />
                 <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Milestone</span>
                 <span className="text-lg font-display font-bold">First Spark</span>
               </div>
               <div className="w-48 h-64 liquid-glass-panel rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform rotate-3 -translate-y-2 z-10">
                 <Compass className="w-12 h-12 text-blue-500 mb-4" />
                 <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Milestone</span>
                 <span className="text-lg font-display font-bold">Wandering Mind</span>
               </div>
               <div className="w-48 h-64 liquid-glass-panel rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-6 transform rotate-12 translate-y-6">
                 <Palette className="w-12 h-12 text-rose-500 mb-4" />
                 <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Milestone</span>
                 <span className="text-lg font-display font-bold">Colorful</span>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Section 4: Call to action */}
        <section className="relative h-screen flex flex-col items-center justify-center px-6 pointer-events-auto">
          <div className="w-full max-w-3xl liquid-glass-panel p-16 rounded-[48px] text-center shadow-2xl border border-white/40">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to enter your vault?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
              {!showEmailInput ? (
                <>
                  <button 
                    onClick={() => setShowEmailInput(true)}
                    className="group px-10 py-5 bg-foreground text-background rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-2xl flex items-center gap-3 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={handleGoogleSignIn}
                    className="px-10 py-5 bg-card-bg border border-border-subtle text-foreground rounded-2xl text-base font-bold hover:bg-foreground/5 transition-all flex items-center gap-3 cursor-pointer"
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
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
