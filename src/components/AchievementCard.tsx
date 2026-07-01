import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
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
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  // Map mouse movement to a glare effect
  const glareX = useTransform(mouseX, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [100, 0]);
  const glareOpacity = useTransform(
    mouseX, 
    [-0.5, 0, 0.5], 
    [0.1, 0.5, 0.1]
  );

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

  const RarityColor = {
    Common: 'from-blue-400 to-indigo-500',
    Rare: 'from-purple-400 to-fuchsia-500',
    Epic: 'from-rose-400 to-orange-400',
    Legendary: 'from-amber-300 to-yellow-500'
  };

  const Icon = achievement.icon;

  return (
    <div className="perspective-1000">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-64 h-80 rounded-[24px] cursor-pointer overflow-hidden shadow-2xl transition-all duration-300 ${
          unlocked ? 'opacity-100' : 'opacity-40 grayscale blur-[1px] hover:blur-none hover:grayscale-0'
        }`}
      >
        {/* Card Background / Border */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[24px] pointer-events-none z-10" />
        
        {/* Animated Glare Layer */}
        {unlocked && (
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%)',
              opacity: glareOpacity,
              left: useTransform(glareX, val => `${val}%`),
              top: useTransform(glareY, val => `${val}%`),
              transform: 'translate(-50%, -50%)',
              width: '200%',
              height: '200%'
            }}
          />
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 z-10 p-5 flex flex-col items-center text-center">
          {/* Header Rarity Badge */}
          <div className="w-full flex items-center justify-between opacity-60">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr ${RarityColor[achievement.rarity]}`}>
               {Icon && <Icon className="w-4 h-4 text-white" />}
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-white drop-shadow-md">
              {achievement.rarity}
            </span>
          </div>

          {/* Image Art */}
          <div className="mt-2 w-full h-32 rounded-2xl overflow-hidden relative border border-white/10">
            {achievement.image ? (
              <img src={achievement.image} alt={achievement.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${RarityColor[achievement.rarity]} opacity-20`} />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Title & Description */}
          <div className="mt-4 flex-1 w-full space-y-1 relative" style={{ transform: "translateZ(30px)" }}>
            <h3 className="text-xl font-bold font-display text-white tracking-tight drop-shadow-lg">
              {achievement.title}
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-[90%] mx-auto font-sans">
              {achievement.description}
            </p>
          </div>

          {/* Footer Points/XP */}
          <div className="w-full mt-auto flex items-center justify-between text-[10px] text-white/50 font-bold uppercase tracking-widest pt-3 border-t border-white/10" style={{ transform: "translateZ(20px)" }}>
            <span>{achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Locked'}</span>
            <span className="flex items-center gap-1 text-white/80">
              +{achievement.xp || 10} XP
            </span>
          </div>
        </div>

        {/* Depth Shadow / 3D Illusion base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
}
