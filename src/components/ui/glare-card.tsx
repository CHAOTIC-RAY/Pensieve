import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface GlareCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function GlareCard({ children, className = "", onClick, style = {} }: GlareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse inputs relative to card coordinates (0 to 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Smooth springs for high performance physics
  const rx = useSpring(useTransform(y, [0, 1], [18, -18]), { stiffness: 140, damping: 22 });
  const ry = useSpring(useTransform(x, [0, 1], [-18, 18]), { stiffness: 140, damping: 22 });

  // Shimmer positions
  const shimmerX = useSpring(useTransform(x, [0, 1], [10, 90]), { stiffness: 140, damping: 22 });
  const shimmerY = useSpring(useTransform(y, [0, 1], [10, 90]), { stiffness: 140, damping: 22 });

  // Opacity of glare
  const glareOpacity = useSpring(useTransform(x, [0, 0.5, 1], [0.35, 0.75, 0.35]), { stiffness: 140, damping: 22 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    
    // Constrain to slightly outside bounds or strict 0-1
    x.set(Math.max(0, Math.min(1, relativeX)));
    y.set(Math.max(0, Math.min(1, relativeY)));
  };

  const handleMouseLeave = () => {
    // Return to absolute center
    x.set(0.5);
    y.set(0.5);
  };

  // Convert motion value to inline style CSS variable for linear gradients
  const glareBackground = useTransform(
    [shimmerX, shimmerY],
    ([sx, sy]) => {
      const xVal = Number(sx) || 0;
      const yVal = Number(sy) || 0;
      return `radial-gradient(circle at ${xVal}% ${yVal}%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 80%), 
                     linear-gradient(${xVal + yVal}deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.01) 100%)`;
    }
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        ...style
      }}
      className={`relative rounded-[24px] cursor-pointer overflow-hidden transition-shadow duration-300 select-none ${className}`}
    >
      {/* Content wrapper */}
      <div 
        className="w-full h-full relative" 
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>

      {/* Glossy Reflective Glare Overlay */}
      <motion.div
        style={{
          background: glareBackground,
          opacity: glareOpacity,
          pointerEvents: "none",
        }}
        className="absolute inset-0 z-40 mix-blend-overlay transition-opacity duration-300"
      />

      {/* Iridescent Foil Rainbow Layer */}
      <motion.div
        style={{
          background: useTransform([shimmerX, shimmerY], ([sx, sy]) => {
            const xVal = Number(sx) || 0;
            return `linear-gradient(${xVal * 1.5}deg, rgba(255,0,128,0.06) 0%, rgba(0,255,255,0.08) 40%, rgba(255,255,0,0.06) 70%, rgba(128,0,255,0.08) 100%)`;
          }),
          pointerEvents: "none"
        }}
        className="absolute inset-0 z-35 mix-blend-color-dodge opacity-40 group-hover/comet:opacity-60 transition-opacity duration-300"
      />
    </motion.div>
  );
}
