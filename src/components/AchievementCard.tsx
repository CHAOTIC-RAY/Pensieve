import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Lock, Sparkles, Wand2, Shield, Heart, Eye } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
  onClick?: () => void;
}

export default function AchievementCard({ achievement, unlocked = false, onClick }: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [imgSrc, setImgSrc] = React.useState<string>('');

  const getResolvedImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  React.useEffect(() => {
    if (achievement.image) {
      setImgSrc(getResolvedImageUrl(achievement.image));
    }
  }, [achievement.image]);

  const handleImgError = () => {
    let resolvedFallback = '';
    if (achievement.id.startsWith('generated_')) {
      const parts = achievement.id.split('_');
      const themeIdx = parseInt(parts[1], 10);
      const baseImages = [
        '/assets/images/first_spark_1783225522306.jpg',
        '/assets/images/wandering_mind_1783225553989.jpg',
        '/assets/images/curator_1783225567567.jpg',
        '/assets/images/colorful_thinker_1783225582426.jpg',
        '/assets/images/knowledge_seeker_1783225593832.jpg',
        '/assets/images/time_weaver_1783225609753.jpg',
        '/assets/images/deep_thinker_1783225623783.jpg',
        '/assets/images/cosmic_synthesis_1783225638436.jpg',
        '/assets/images/hoarder_1783225650570.jpg',
        '/assets/images/grand_alchemist_1783225665178.jpg'
      ];
      if (!isNaN(themeIdx) && themeIdx >= 0 && themeIdx < baseImages.length) {
        resolvedFallback = baseImages[themeIdx];
      }
    } else {
      const localMap: Record<string, string> = {
        first_spark: '/assets/images/first_spark_1783225522306.jpg',
        wandering_mind: '/assets/images/wandering_mind_1783225553989.jpg',
        curator: '/assets/images/curator_1783225567567.jpg',
        colorful_thinker: '/assets/images/colorful_thinker_1783225582426.jpg',
        knowledge_seeker: '/assets/images/knowledge_seeker_1783225593832.jpg',
        chronomancer: '/assets/images/time_weaver_1783225609753.jpg',
        deep_thinker: '/assets/images/deep_thinker_1783225623783.jpg',
        mind_meld: '/assets/images/cosmic_synthesis_1783225638436.jpg',
        hoarder: '/assets/images/hoarder_1783225650570.jpg',
        transmuter: '/assets/images/grand_alchemist_1783225665178.jpg',
      };
      resolvedFallback = localMap[achievement.id] || '';
    }
    
    if (resolvedFallback) {
      setImgSrc(getResolvedImageUrl(resolvedFallback));
    } else {
      setImgSrc(getResolvedImageUrl('/assets/images/first_spark_1783225522306.jpg'));
    }
  };

  // Smooth out the mouse values
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Map mouse movement to rotation (tilt)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [18, -18]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-18, 18]);

  // Map mouse movement to a glare effect
  const glareX = useTransform(mouseX, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [100, 0]);
  const glareOpacity = useTransform(mouseX, [-0.5, 0, 0.5], [0.2, 0.7, 0.2]);

  // Soft ambient glow background movement
  const glowX = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [-25, 25]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to center (-0.5 to 0.5)
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    
    x.set(relativeX);
    y.set(relativeY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const RarityConfig = {
    Common: {
      themeName: 'Sorcery Spell',
      gradient: 'from-blue-500/20 via-indigo-500/25 to-sky-500/20',
      badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50',
      glow: 'bg-indigo-500/25',
      holo: 'rgba(99, 102, 241, 0.35)',
      cardFrame: 'bg-gradient-to-br from-slate-400 via-slate-200 to-slate-500 p-[7px] shadow-lg border border-white/20',
      frameBorder: 'border-[2px] border-slate-400/80 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]',
      bgGradient: 'bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-slate-900/95',
      shinyText: 'text-slate-100 font-display font-extrabold',
      bannerStyle: 'bg-slate-900/90 text-slate-300 border-slate-700/50',
      typeIcon: Sparkles
    },
    Rare: {
      themeName: 'Ancient Artifact',
      gradient: 'from-purple-500/20 via-fuchsia-500/25 to-pink-500/20',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
      glow: 'bg-purple-500/30',
      holo: 'rgba(217, 70, 239, 0.45)',
      cardFrame: 'bg-gradient-to-br from-purple-400 via-purple-300 via-pink-400 to-indigo-950 p-[8px] shadow-xl border border-purple-300/30',
      frameBorder: 'border-[2.5px] border-purple-400/80 shadow-[inset_0_0_15px_rgba(217,70,239,0.3)]',
      bgGradient: 'bg-gradient-to-b from-neutral-900/95 via-purple-950/35 to-neutral-950/98',
      shinyText: 'text-purple-100 font-display font-extrabold drop-shadow-[0_2px_4px_rgba(168,85,247,0.4)]',
      bannerStyle: 'bg-purple-950/90 text-purple-200 border-purple-800/60',
      typeIcon: Wand2
    },
    Epic: {
      themeName: 'Eldritch Relic',
      gradient: 'from-rose-500/20 via-orange-500/25 to-amber-500/20',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
      glow: 'bg-rose-500/35',
      holo: 'rgba(244, 63, 94, 0.55)',
      cardFrame: 'bg-gradient-to-br from-rose-500 via-rose-300 via-orange-400 to-rose-950 p-[8px] shadow-2xl border border-rose-400/40',
      frameBorder: 'border-[2.5px] border-rose-400/80 shadow-[inset_0_0_15px_rgba(244,63,94,0.4)]',
      bgGradient: 'bg-gradient-to-b from-neutral-900/95 via-rose-950/35 to-neutral-950/98',
      shinyText: 'text-rose-100 font-display font-extrabold drop-shadow-[0_2px_6px_rgba(244,63,94,0.5)]',
      bannerStyle: 'bg-rose-950/90 text-rose-200 border-rose-800/60',
      typeIcon: Shield
    },
    Legendary: {
      themeName: 'Celestial Source',
      gradient: 'from-amber-400/25 via-yellow-500/30 to-orange-400/25',
      badge: 'bg-amber-950/85 text-amber-200 border-amber-400/60 font-black animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      glow: 'bg-amber-500/45',
      holo: 'rgba(245, 158, 11, 0.65)',
      cardFrame: 'bg-gradient-to-br from-yellow-300 via-amber-400 via-yellow-200 to-amber-950 p-[10px] shadow-[0_0_25px_rgba(245,158,11,0.3)] border border-yellow-300/50',
      frameBorder: 'border-[3px] border-yellow-400/90 shadow-[0_0_12px_rgba(250,204,21,0.5),inset_0_0_20px_rgba(245,158,11,0.5)]',
      bgGradient: 'bg-gradient-to-b from-neutral-950/98 via-amber-950/45 to-neutral-950/99',
      shinyText: 'text-yellow-100 font-display font-black tracking-tight drop-shadow-[0_2px_10px_rgba(234,179,8,0.7)] uppercase',
      bannerStyle: 'bg-amber-950/95 text-yellow-200 border-amber-600/70 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      typeIcon: Wand2
    }
  };

  const config = RarityConfig[achievement.rarity] || RarityConfig.Common;
  const Icon = achievement.icon;
  const TypeIcon = config.typeIcon;

  // Custom magical lore flavor texts for authentic TCG vibe
  const FlavorTexts: Record<string, string> = {
    first_spark: "A single glowing cinder to light the infinite vaults of your memory.",
    wandering_mind: "Not all who drift are lost; some map the nebulous stars of forgotten thoughts.",
    curator: "To cherish a thought is to bind it forever inside the soul's cosmic conservatory.",
    colorful_thinker: "A vibrant prism of absolute imagination, casting prisms onto empty pages.",
    knowledge_seeker: "He who hoards the ancient wisdom holds the keys to tomorrow's magic.",
    chronomancer: "Time is not a line, but a loom on which we weave the infinite threads of remembrance.",
    deep_thinker: "Within the dark sanctum of the crystal brain, the machine whispers its timeless oracle.",
    mind_meld: "A silent junction where organic sparks collide with ancient synthetic consciousness.",
    hoarder: "An infinite treasury of magical artifacts, overflowing with the ultimate wealth of a thousand lifetimes.",
    transmuter: "The perfect alignment of color, style, and spirit to shape your own personal reality."
  };

  const flavor = FlavorTexts[achievement.id] || "An ancient token representing mental mastery and deep thought.";

  return (
    <div className="perspective-1000 relative group select-none" onClick={onClick}>
      {/* 3D Soft Glow Background (iOS / Premium design) */}
      {unlocked && (
        <motion.div 
          style={{
            x: glowX,
            y: glowY,
            filter: 'blur(35px)',
          }}
          className={`absolute inset-2 -z-10 rounded-[32px] transition-all duration-300 opacity-70 group-hover:opacity-100 ${config.glow}`}
        />
      )}

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          WebkitMaskImage: '-webkit-radial-gradient(white, black)', // Fix for Safari/Chrome overflow-hidden on rounded corners with 3D
        }}
        className={`relative w-64 h-96 rounded-[24px] cursor-pointer overflow-hidden transition-all duration-300 ${
          unlocked 
            ? `${config.cardFrame}` 
            : 'bg-neutral-900/90 p-[6px] border border-neutral-800/80 opacity-40 grayscale-[90%]'
        } shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:scale-[1.02] isolation-isolate`}
      >
        {/* Clip container for holographic/glare effects to prevent them escaping the 3D-transformed card */}
        <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none z-30">
          {/* Holographic Sheen/Foil layer */}
          {unlocked && (
            <motion.div 
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-40 group-hover:opacity-65 transition-opacity"
              style={{
                background: `repeating-linear-gradient(45deg, 
                  transparent, 
                  transparent 10px, 
                  ${config.holo} 15px, 
                  transparent 20px, 
                  transparent 30px, 
                  rgba(255, 255, 255, 0.2) 35px, 
                  transparent 40px
                )`,
                left: useTransform(glareX, val => `${val - 50}%`),
                top: useTransform(glareY, val => `${val - 50}%`),
                width: '200%',
                height: '200%'
              }}
            />
          )}

          {/* Animated Glare Spot */}
          {unlocked && (
            <motion.div 
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 65%)',
                opacity: glareOpacity,
                left: useTransform(glareX, val => `${val}%`),
                top: useTransform(glareY, val => `${val}%`),
                transform: 'translate(-50%, -50%)',
                width: '180%',
                height: '180%'
              }}
            />
          )}
        </div>

        {/* Interior Card Content Area */}
        <div className={`w-full h-full rounded-[16px] relative overflow-hidden flex flex-col p-3 ${config.bgGradient}`}>
          
          {/* TOP HEADER BAR: Card Name & XP/HP */}
          <div className="flex items-center justify-between px-1 py-1" style={{ transform: "translateZ(30px)" }}>
            <div className="flex items-center gap-1.5">
              <TypeIcon className={`w-4 h-4 ${unlocked ? 'text-yellow-400' : 'text-neutral-500'}`} />
              <h3 className={`text-sm ${config.shinyText} truncate max-w-[130px]`}>
                {achievement.title}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">XP</span>
              <span className={`text-base font-black ${unlocked ? 'text-red-500 drop-shadow-[0_1px_4px_rgba(239,68,68,0.5)]' : 'text-neutral-500'} font-display`}>
                {achievement.xp || 10}
              </span>
            </div>
          </div>

          {/* MAIN ILLUSTRATION FRAME */}
          <div className={`mt-1.5 w-full h-40 rounded-lg overflow-hidden relative ${config.frameBorder} bg-black/45`} style={{ transform: "translateZ(40px)" }}>
            {/* Swirling celestial backdrop */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
            
            {unlocked && imgSrc ? (
              <img 
                src={imgSrc} 
                onError={handleImgError}
                alt={achievement.title} 
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 gap-2">
                <Lock className="w-8 h-8 text-neutral-600 animate-pulse" />
                <span className="text-[9px] font-mono tracking-widest text-neutral-600 uppercase font-black">Locked</span>
              </div>
            )}
            
            {/* High-quality vignettes & light sheen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />

            {/* Float badge icon in absolute center of illustration for magical overlay */}
            <motion.div 
              style={{ transform: "translateZ(25px)" }}
              className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-black/50 backdrop-blur-md border border-white/10 z-10`}
            >
               {Icon ? <Icon className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-white/30" />}
            </motion.div>
          </div>

          {/* STAGE & RARITY BAR DIVIDER */}
          <div 
            className={`mt-2 w-full py-0.5 px-2 text-[8px] font-mono tracking-wider uppercase font-black rounded border ${config.bannerStyle} flex items-center justify-between`}
            style={{ transform: "translateZ(20px)" }}
          >
            <span>{config.themeName}</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
              <span>{achievement.rarity}</span>
            </div>
          </div>

          {/* MAGIC SPELL DESCRIPTION BOX */}
          <div className="mt-2.5 flex-1 flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
            <div className="space-y-1 px-1 text-center">
              <p className="text-[11px] text-white/90 leading-snug font-sans tracking-wide">
                {achievement.description}
              </p>
            </div>

            {/* PARCHMENT FLAVOR TEXT BOX */}
            <div className="mt-2 p-2 rounded-md bg-black/35 border border-white/5 text-center min-h-[48px] flex items-center justify-center">
              <p className="text-[9px] text-yellow-200/50 italic leading-normal font-serif">
                "{unlocked ? flavor : 'Find the hidden key to unlock this mystical secret...'}"
              </p>
            </div>
          </div>

          {/* CARD FOOTER & METADATA */}
          <div 
            className="w-full mt-auto flex items-center justify-between text-[8px] text-neutral-500 font-mono pt-2 border-t border-white/5" 
            style={{ transform: "translateZ(10px)" }}
          >
            <span>NO. {achievement.id.toUpperCase().substring(0, 4)}-07</span>
            <span>{achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'SEALED'}</span>
          </div>

        </div>

        {/* Card Gold Trim Highlight shine */}
        {unlocked && (
          <div className="absolute inset-0 border border-white/10 rounded-[24px] pointer-events-none mix-blend-overlay z-40" />
        )}
      </motion.div>
    </div>
  );
}

