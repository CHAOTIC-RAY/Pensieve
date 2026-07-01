import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Lock } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
}

export default function AchievementCard({ achievement, unlocked = false }: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Map mouse movement to rotation (tilt)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);

  // Map mouse movement to a glare effect
  const glareX = useTransform(mouseX, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [100, 0]);
  const glareOpacity = useTransform(mouseX, [-0.5, 0, 0.5], [0.15, 0.6, 0.15]);

  // Soft ambient glow background movement
  const glowX = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);

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
      gradient: 'from-blue-500/20 via-indigo-500/25 to-sky-500/20',
      badge: 'bg-indigo-500/30 text-indigo-200 border-indigo-500/40',
      glow: 'bg-indigo-500/30',
      holo: 'rgba(99, 102, 241, 0.2)'
    },
    Rare: {
      gradient: 'from-purple-500/20 via-fuchsia-500/25 to-pink-500/20',
      badge: 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-500/40',
      glow: 'bg-fuchsia-500/30',
      holo: 'rgba(217, 70, 239, 0.2)'
    },
    Epic: {
      gradient: 'from-rose-500/20 via-orange-500/25 to-amber-500/20',
      badge: 'bg-rose-500/30 text-rose-200 border-rose-500/40',
      glow: 'bg-rose-500/30',
      holo: 'rgba(244, 63, 94, 0.2)'
    },
    Legendary: {
      gradient: 'from-amber-400/20 via-yellow-500/25 to-orange-400/20',
      badge: 'bg-amber-500/30 text-amber-200 border-amber-500/40',
      glow: 'bg-amber-500/35',
      holo: 'rgba(245, 158, 11, 0.2)'
    }
  };

  const config = RarityConfig[achievement.rarity] || RarityConfig.Common;
  const Icon = achievement.icon;

  return (
    <div className="perspective-1000 relative group">
      {/* 3D Soft Glow Background (iOS / Premium design) */}
      {unlocked && (
        <motion.div 
          style={{
            x: glowX,
            y: glowY,
            filter: 'blur(30px)',
          }}
          className={`absolute inset-2 -z-10 rounded-[32px] transition-all duration-300 opacity-60 group-hover:opacity-90 ${config.glow}`}
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
        }}
        className={`relative w-64 h-80 rounded-[28px] cursor-pointer overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 ${
          unlocked ? 'opacity-100 border border-white/20' : 'opacity-40 grayscale border border-white/5'
        } bg-white/[0.04] backdrop-blur-[40px] saturate-[180%]`}
      >
        {/* Holographic Sheen/Foil layer */}
        {unlocked && (
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none mix-blend-color-dodge opacity-30"
            style={{
              background: `linear-gradient(115deg, transparent 20%, ${config.holo} 40%, transparent 60%)`,
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
            className="absolute inset-0 z-25 pointer-events-none mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)',
              opacity: glareOpacity,
              left: useTransform(glareX, val => `${val}%`),
              top: useTransform(glareY, val => `${val}%`),
              transform: 'translate(-50%, -50%)',
              width: '180%',
              height: '180%'
            }}
          />
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 z-10 p-5 flex flex-col items-center text-center">
          {/* Header Rarity Badge */}
          <div className="w-full flex items-center justify-between">
            <span className={`text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${config.badge}`}>
              {achievement.rarity}
            </span>
            <div className="text-white/40">
              {!unlocked && <Lock className="w-4 h-4" />}
            </div>
          </div>

          {/* Rarity art pattern backdrop */}
          <div className="mt-4 w-full h-32 rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center bg-black/10">
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
            
            {/* The Badge Icon floating in 3D space */}
            <motion.div 
              style={{ transform: "translateZ(40px)" }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white/10 backdrop-blur-md border border-white/20`}
            >
               {Icon ? <Icon className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white/30" />}
            </motion.div>
          </div>

          {/* Title & Description */}
          <div className="mt-5 flex-1 w-full space-y-1 relative" style={{ transform: "translateZ(30px)" }}>
            <h3 className="text-lg font-bold font-display text-white tracking-tight drop-shadow-md">
              {achievement.title}
            </h3>
            <p className="text-[11px] text-white/60 leading-relaxed max-w-[90%] mx-auto font-sans">
              {achievement.description}
            </p>
          </div>

          {/* Footer Points/XP */}
          <div className="w-full mt-auto flex items-center justify-between text-[9px] text-white/40 font-bold uppercase tracking-widest pt-3 border-t border-white/10" style={{ transform: "translateZ(20px)" }}>
            <span>{achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Locked'}</span>
            <span className="flex items-center gap-1 text-white/80 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              +{achievement.xp || 10} XP
            </span>
          </div>
        </div>

        {/* Depth Shadow / 3D Illusion base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
}
