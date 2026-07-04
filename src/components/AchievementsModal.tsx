import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { X, Trophy, RotateCw, Lock, Sparkles, Brain, Palette, Archive, Heart, Bookmark, Compass, Clock, MessageSquare, Zap } from 'lucide-react';
import { Achievement } from '../types';
import AchievementCard from './AchievementCard';
import { CometCard } from "@/components/ui/comet-card";
import { GlareCard } from "@/components/ui/glare-card";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const BACKSIDE_QUOTES: Record<string, { quote: string; author: string; lore: string }> = {
  first_spark: {
    quote: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
    author: "Albert Einstein",
    lore: "Even the grandest constellation begins with a single burning particle of ambition."
  },
  wandering_mind: {
    quote: "All that is gold does not glitter, not all those who wander are lost.",
    author: "J.R.R. Tolkien",
    lore: "In the quiet labyrinths of the wandering soul, the most beautiful paths are found."
  },
  curator: {
    quote: "Memory is the diary that we all carry about with us.",
    author: "Oscar Wilde",
    lore: "To preserve a moment is to immortalize a piece of the cosmos."
  },
  colorful_thinker: {
    quote: "I found I could say things with color and shapes that I couldn't say any other way.",
    author: "Georgia O'Keeffe",
    lore: "A mind that thinks in hues can paint the void with starlight."
  },
  knowledge_seeker: {
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    lore: "Gathering fragments of the truth to assemble the ultimate grimoire of reality."
  },
  chronomancer: {
    quote: "Yesterday is but today's memory, and tomorrow is today's dream.",
    author: "Kahlil Gibran",
    lore: "To master time is to see the past, present, and future woven as one single tapestry."
  },
  deep_thinker: {
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    lore: "Allowing synthetic sparks to merge with human grace, uncovering hidden geometries."
  },
  mind_meld: {
    quote: "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.",
    author: "Carl Sagan",
    lore: "When mind and machine hum in harmony, the secrets of the cosmos lay bare."
  },
  hoarder: {
    quote: "An index to the world's ancient wisdom is worth more than all the gold of the dragon.",
    author: "Ancient Proverb",
    lore: "He who holds a thousand scrolls is wealthy beyond measure, for knowledge never decays."
  },
  transmuter: {
    quote: "True alchemy is not the transmuting of lead into gold, but the transformation of the mind.",
    author: "Hermes Trismegistus",
    lore: "By altering the canvas, you change the reflection; your perspective is your magic wand."
  }
};

const LARGE_CARD_CONFIGS = {
  Common: {
    themeName: 'Sorcery Spell',
    gradient: 'from-blue-600/30 via-indigo-600/35 to-sky-600/30',
    cardFrame: 'bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 p-[12px] border-2 border-white/40 shadow-2xl',
    frameBorder: 'border-[3px] border-slate-400/80 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]',
    bgGradient: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    bannerStyle: 'bg-slate-900 text-slate-300 border-slate-700/60',
    holo: 'rgba(99, 102, 241, 0.4)',
    textAccent: 'text-slate-100 font-display font-extrabold',
    glow: 'shadow-[0_0_40px_rgba(99,102,241,0.3)]',
    title: 'ANCIENT RUNES'
  },
  Rare: {
    themeName: 'Ancient Artifact',
    gradient: 'from-purple-600/30 via-fuchsia-600/35 to-pink-600/30',
    cardFrame: 'bg-gradient-to-br from-purple-300 via-purple-100 via-pink-200 to-indigo-900 p-[14px] border-2 border-purple-200/40 shadow-2xl',
    frameBorder: 'border-[3.5px] border-purple-400/80 shadow-[inset_0_0_20px_rgba(217,70,239,0.4)]',
    bgGradient: 'bg-gradient-to-b from-neutral-900 via-purple-950/40 to-neutral-950',
    bannerStyle: 'bg-purple-950 text-purple-200 border-purple-800/70',
    holo: 'rgba(217, 70, 239, 0.5)',
    textAccent: 'text-purple-100 font-display font-extrabold drop-shadow-[0_2px_6px_rgba(168,85,247,0.5)]',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.35)]',
    title: 'COSMIC MEMORY'
  },
  Epic: {
    themeName: 'Eldritch Relic',
    gradient: 'from-rose-600/30 via-orange-600/35 to-amber-600/30',
    cardFrame: 'bg-gradient-to-br from-rose-400 via-rose-200 via-orange-300 to-rose-900 p-[14px] border-2 border-rose-300/45 shadow-2xl',
    frameBorder: 'border-[3.5px] border-rose-400/80 shadow-[inset_0_0_20px_rgba(244,63,94,0.5)]',
    bgGradient: 'bg-gradient-to-b from-neutral-900 via-rose-950/40 to-neutral-950',
    bannerStyle: 'bg-rose-950 text-rose-200 border-rose-800/70',
    holo: 'rgba(244, 63, 94, 0.6)',
    textAccent: 'text-rose-100 font-display font-extrabold drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]',
    glow: 'shadow-[0_0_45px_rgba(244,63,94,0.4)]',
    title: 'SYNTHETIC ORACLE'
  },
  Legendary: {
    themeName: 'Celestial Source',
    gradient: 'from-amber-400/30 via-yellow-500/35 to-orange-400/30',
    cardFrame: 'bg-gradient-to-br from-yellow-200 via-amber-300 via-yellow-100 to-amber-950 p-[16px] border-2 border-yellow-200/50 shadow-2xl',
    frameBorder: 'border-[4px] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6),inset_0_0_25px_rgba(245,158,11,0.6)]',
    bgGradient: 'bg-gradient-to-b from-neutral-950 via-amber-950/50 to-neutral-950',
    bannerStyle: 'bg-amber-950 text-yellow-200 border-amber-600/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    holo: 'rgba(245, 158, 11, 0.7)',
    textAccent: 'text-yellow-100 font-display font-black tracking-tight drop-shadow-[0_2px_12px_rgba(234,179,8,0.8)] uppercase',
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.45)]',
    title: 'CELESTIAL REVELATION'
  }
};

export default function AchievementsModal({ isOpen, onClose, achievements }: AchievementsModalProps) {
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalXp = achievements.reduce((acc, ach) => acc + (ach.unlockedAt ? (ach.xp || 10) : 0), 0);

  // Detail Modal Inspection State
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Motion values for smooth high-performance physics (no React re-renders while dragging)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const idleX = useMotionValue(0);
  const idleY = useMotionValue(0);
  const flipRotation = useMotionValue(0);
  const cardScale = useMotionValue(1);

  // Springs for buttery smooth, realistic interpolation
  const rotXSpring = useSpring(dragX, { stiffness: 120, damping: 25 });
  const rotYSpring = useSpring(dragY, { stiffness: 120, damping: 25 });
  const flipSpring = useSpring(flipRotation, { stiffness: 90, damping: 20 });
  const scaleSpring = useSpring(cardScale, { stiffness: 140, damping: 20 });

  // Reset motion values when selected achievement changes
  useEffect(() => {
    if (selectedAch) {
      dragX.set(0);
      dragY.set(0);
      idleX.set(0);
      idleY.set(0);
      cardScale.set(1);
      flipRotation.set(isFlipped ? 180 : 0);
    }
  }, [selectedAch]);

  // Synchronize flip state
  useEffect(() => {
    flipRotation.set(isFlipped ? 180 : 0);
  }, [isFlipped]);

  // Auto-movement when untouched
  const isDraggingRef = useRef(false);
  const lastInteractionTime = useRef(Date.now());

  useEffect(() => {
    if (!selectedAch) return;
    let animFrameId: number;
    const startTime = Date.now();
    
    const updateIdle = () => {
      const now = Date.now();
      // If there is no active dragging or mouse move in the last 1.2 seconds, we animate slow sway
      if (!isDraggingRef.current && (now - lastInteractionTime.current > 1200)) {
        const t = (now - startTime) / 1000;
        idleX.set(Math.sin(t * 1.2) * 5); // slow oscillation tilt up/down
        idleY.set(Math.cos(t * 0.9) * 7); // slow sway left/right
      } else {
        // Decay idle values smoothly when active
        idleX.set(idleX.get() * 0.88);
        idleY.set(idleY.get() * 0.88);
      }
      animFrameId = requestAnimationFrame(updateIdle);
    };
    
    animFrameId = requestAnimationFrame(updateIdle);
    return () => cancelAnimationFrame(animFrameId);
  }, [selectedAch]);

  // Combine components into final transform values
  const rotX = useTransform([rotXSpring, idleX], ([rx, ix]) => (rx as number) + (ix as number));
  const rotY = useTransform([rotYSpring, idleY, flipSpring], ([ry, iy, f]) => (ry as number) + (iy as number) + (f as number));

  const activeQuote = selectedAch ? (BACKSIDE_QUOTES[selectedAch.id] || {
    quote: "All human knowledge starts with an intuition and moves toward deep understanding.",
    author: "Immanuel Kant",
    lore: "An ancient symbol of intellectual mastery and deep understanding."
  }) : null;

  const config = selectedAch ? (LARGE_CARD_CONFIGS[selectedAch.rarity] || LARGE_CARD_CONFIGS.Common) : null;
  const SelectedIcon = selectedAch?.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-full max-h-[85vh] liquid-glass-panel dark:liquid-glass-panel-dark border border-border-subtle/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border-subtle/30 flex items-center justify-between shrink-0 bg-background/25">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Milestones Studio</h2>
                  <p className="text-sm text-foreground/60 font-sans flex items-center gap-2 mt-0.5">
                    <span>{unlockedCount} of {achievements.length} Unlocked</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                    <span className="text-amber-500 font-extrabold">{totalXp} XP Collected</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all duration-300 hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex flex-wrap gap-10 justify-center">
                {achievements.map((ach) => (
                  <AchievementCard 
                    key={ach.id}
                    achievement={ach}
                    unlocked={!!ach.unlockedAt}
                    onClick={() => {
                      setSelectedAch(ach);
                      setIsFlipped(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3D Inspect Overlay */}
      {selectedAch && config && activeQuote && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedAch(null)}
          />

          <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full h-full max-h-[90vh]">
            {/* Close Inspect Button */}
            <button
              onClick={() => setSelectedAch(null)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all z-20 shadow-md"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 3D Perspective Container */}
            <div className="perspective-1000 flex items-center justify-center w-full py-8">
              <motion.div
                onPanStart={() => {
                  isDraggingRef.current = true;
                  cardScale.set(1.05);
                }}
                onPanEnd={() => {
                  isDraggingRef.current = false;
                  lastInteractionTime.current = Date.now();
                  dragX.set(0);
                  dragY.set(0);
                  cardScale.set(1);
                }}
                onPan={(e, info) => {
                  const currentX = dragX.get();
                  const nextX = currentX - info.delta.y * 0.35;
                  dragX.set(Math.max(-45, Math.min(45, nextX)));
                  dragY.set(dragY.get() + info.delta.x * 0.35);
                  lastInteractionTime.current = Date.now();
                }}
                onTap={() => {
                  setIsFlipped(prev => !prev);
                  lastInteractionTime.current = Date.now();
                }}
                style={{
                  rotateX: rotX,
                  rotateY: rotY,
                  scale: scaleSpring,
                  transformStyle: "preserve-3d",
                }}
                className="relative w-[320px] h-[480px] sm:w-[350px] sm:h-[520px] rounded-[28px] cursor-grab active:cursor-grabbing select-none touch-none bg-transparent"
              >
                {/* CARD FRONT FACE */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                  }}
                  className={`absolute inset-0 w-full h-full rounded-[28px] ${config.glow}`}
                >
                  <CometCard className="w-full h-full p-0 bg-transparent">
                    <GlareCard className="w-full h-full bg-transparent p-0" style={{ transformStyle: "preserve-3d" }}>
                      <div className={`w-full h-full rounded-[20px] overflow-hidden flex flex-col p-4 relative ${config.bgGradient}`}>
                        {/* TOP HEADER */}
                        <div className="flex items-center justify-between px-1" style={{ transform: "translateZ(30px)" }}>
                          <div className="flex items-center gap-2">
                            {SelectedIcon && <SelectedIcon className="w-5 h-5 text-amber-400" />}
                            <h3 className={`text-base sm:text-lg font-display font-black tracking-wide ${config.textAccent}`}>
                              {selectedAch.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                            <span className="text-[9px] font-mono font-bold text-neutral-400">XP</span>
                            <span className="text-sm font-black text-red-500 font-display">
                              {selectedAch.xp || 10}
                            </span>
                          </div>
                        </div>

                        {/* MAIN ILLUSTRATION */}
                        <div className={`mt-3 w-full flex-1 rounded-xl overflow-hidden relative border ${config.frameBorder} bg-black/40`} style={{ transform: "translateZ(40px)" }}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
                          {selectedAch.unlockedAt && selectedAch.image ? (
                            <img
                              src={selectedAch.image}
                              alt={selectedAch.title}
                              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 gap-3">
                              <Lock className="w-10 h-10 text-neutral-600 animate-pulse" />
                              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">Locked Memory</span>
                            </div>
                          )}
                          
                          {/* Floating Badge (Refined Round Seal style so it doesn't overlap corner radius) */}
                          <div className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/15 z-10 shadow-lg">
                            {SelectedIcon && <SelectedIcon className="w-5 h-5 text-white" />}
                          </div>
                        </div>

                        {/* STAGE & RARITY BAR DIVIDER */}
                        <div 
                          className={`mt-3 w-full py-1 px-3 text-[10px] font-mono tracking-wider uppercase font-black rounded border ${config.bannerStyle} flex items-center justify-between`}
                          style={{ transform: "translateZ(20px)" }}
                        >
                          <span>{config.themeName}</span>
                          <span className="text-yellow-400 font-bold">{selectedAch.rarity}</span>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="mt-3.5 space-y-2 text-center" style={{ transform: "translateZ(30px)" }}>
                          <p className="text-xs sm:text-sm text-white/90 font-sans px-1 font-medium">
                            {selectedAch.description}
                          </p>
                          
                          {/* LORE TEXT BOX */}
                          <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 text-center flex items-center justify-center min-h-[60px]">
                            <p className="text-[10px] sm:text-xs text-yellow-200/60 italic font-serif leading-relaxed">
                              "{selectedAch.unlockedAt ? activeQuote.lore : 'Find the hidden key to unlock this mystical secret...'}"
                            </p>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="w-full mt-auto flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-3 border-t border-white/5" style={{ transform: "translateZ(10px)" }}>
                          <span>NO. {selectedAch.id.toUpperCase().substring(0, 4)}-07</span>
                          <span>{selectedAch.unlockedAt ? new Date(selectedAch.unlockedAt).toLocaleDateString() : 'SEALED'}</span>
                        </div>
                      </div>
                    </GlareCard>
                  </CometCard>
                </div>

                {/* CARD BACK SIDE (REVEALS QUOTE) */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    transformStyle: "preserve-3d",
                  }}
                  className={`absolute inset-0 w-full h-full rounded-[28px] ${config.glow}`}
                >
                  <CometCard className="w-full h-full p-0 bg-transparent">
                    <GlareCard className="w-full h-full bg-transparent p-0" style={{ transformStyle: "preserve-3d" }}>
                      <div className={`w-full h-full rounded-[20px] overflow-hidden flex flex-col p-6 relative ${config.bgGradient} justify-between border border-white/5`}>
                        
                        {/* Top Celestial title */}
                        <div className="text-center mt-2" style={{ transform: "translateZ(30px)" }}>
                          <span className="text-[10px] font-mono tracking-widest text-amber-500/60 font-black uppercase">
                            {config.themeName}
                          </span>
                          <h4 className="text-sm font-display font-black tracking-wider text-amber-400 mt-0.5">
                            {config.title}
                          </h4>
                        </div>

                        {/* Magic Central Mandala / Sacred Frame */}
                        <div 
                          className="my-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-amber-500/10 relative shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]"
                          style={{ transform: "translateZ(40px)" }}
                        >
                          {/* Pulse circle */}
                          <div className="absolute inset-0 rounded-2xl border border-amber-500/5 animate-pulse" />
                          
                          <div className="relative z-10 flex flex-col items-center text-center">
                            <span className="text-3xl font-serif text-amber-500/30 font-extrabold leading-none select-none">“</span>
                            
                            <p className="text-sm sm:text-base italic font-serif leading-relaxed text-yellow-100/90 font-medium px-2">
                              {selectedAch.unlockedAt ? activeQuote.quote : 'This sacred vault remains locked until the mental achievement is unsealed.'}
                            </p>
                            
                            <span className="text-3xl font-serif text-amber-500/30 font-extrabold leading-none select-none mt-1">”</span>
                            
                            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent my-3" />
                            
                            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                              {selectedAch.unlockedAt ? activeQuote.author : 'ANONYMOUS'}
                            </span>
                          </div>
                        </div>

                        {/* Backside Seal & Flavor Lore */}
                        <div className="flex flex-col items-center text-center mb-2" style={{ transform: "translateZ(20px)" }}>
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2 shadow-md">
                            {SelectedIcon ? <SelectedIcon className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-amber-500/30" />}
                          </div>
                          
                          <p className="text-[9px] font-mono text-neutral-500/80 uppercase tracking-widest">
                            Sacred Knowledge • Sealed Covenant
                          </p>
                        </div>

                      </div>
                    </GlareCard>
                  </CometCard>
                </div>
              </motion.div>
            </div>

            {/* Instruction & Controls Panel */}
            <div className="mt-4 text-center space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-sans text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95"
                >
                  <RotateCw className="w-4 h-4" />
                  Flip Card
                </button>
                <button
                  onClick={() => {
                    dragX.set(0);
                    dragY.set(0);
                    idleX.set(0);
                    idleY.set(0);
                    setIsFlipped(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-sans text-sm font-semibold hover:text-white transition-all active:scale-95 border border-neutral-700/50"
                >
                  Reset View
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
