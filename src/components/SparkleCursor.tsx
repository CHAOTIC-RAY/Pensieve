import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

let sparkleIdCounter = 0;

export default function SparkleCursor({ intensity = 0.4 }: { intensity?: number }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const lastActiveTime = useRef<number>(Date.now());
  const isMobileRef = useRef<boolean>(false);

  useEffect(() => {
    isMobileRef.current = window.matchMedia('(max-width: 768px)').matches;
    const handleResize = () => {
      isMobileRef.current = window.matchMedia('(max-width: 768px)').matches;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timeout: any;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollSpeed(Math.abs(currentScrollY - lastScrollY));
      lastScrollY = currentScrollY;
      clearTimeout(timeout);
      timeout = setTimeout(() => setScrollSpeed(0), 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addSparkle = useCallback((x: number, y: number) => {
    const id = ++sparkleIdCounter;
    
    // Performance optimization: smaller size and count on mobile
    const maxSparkles = isMobileRef.current ? 12 : 60;
    const size = isMobileRef.current ? (Math.random() * 5 + 1.5) : (Math.random() * 8 + 2);
    
    // Purple variants + gold + cyan
    const colors = ['#c084fc', '#a855f7', '#d8b4fe', '#ffffff', '#fbbf24', '#38bdf8'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newSparkle: Sparkle = { id, x, y, size, color };
    
    setSparkles((prev) => [...prev.slice(-maxSparkles), newSparkle]);

    // Cleanup after animation
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, isMobileRef.current ? 500 : 800); // Shorter duration on mobile
  }, []);

  useEffect(() => {
    let time = 0;
    let animationFrameId: number;

    const autoAnimate = () => {
      const isMobile = isMobileRef.current;
      const idleTime = Date.now() - lastActiveTime.current;
      const isIdle = idleTime > 2000; // Idle after 2 seconds

      // Auto play on desktop if idle, or auto play on mobile as default
      if (isIdle || isMobile) {
        time += isMobile ? 0.012 : 0.018; // speed of auto movement
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Figure-8 pattern, centered slightly above middle
        const targetX = w / 2 + Math.sin(time) * (w * 0.32);
        const targetY = h / 2.5 + Math.sin(time * 2) * (h * 0.18);
        
        // Lerp to target coordinates so transition into idle mode is buttery smooth
        let nextX = mousePosRef.current.x;
        let nextY = mousePosRef.current.y;
        
        if (nextX === 0 && nextY === 0) {
          nextX = targetX;
          nextY = targetY;
        } else {
          const lerpFactor = isMobile ? 0.05 : 0.08;
          nextX = nextX + (targetX - nextX) * lerpFactor;
          nextY = nextY + (targetY - nextY) * lerpFactor;
        }
        
        mousePosRef.current = { x: nextX, y: nextY };
        setMousePos({ x: nextX, y: nextY });
        
        // Slightly lower chance of sparkles for mobile, higher on desktop idle
        const sparkleChance = isMobile ? (intensity * 0.3) : (intensity * 0.85);
        if (Math.random() < sparkleChance && nextX > 0 && nextY > 0) {
          addSparkle(nextX, nextY);
        }
      }
      animationFrameId = requestAnimationFrame(autoAnimate);
    };

    animationFrameId = requestAnimationFrame(autoAnimate);

    const handleMouseMove = (e: MouseEvent) => {
      lastActiveTime.current = Date.now();
      const pos = { x: e.clientX, y: e.clientY };
      mousePosRef.current = pos;
      setMousePos(pos);
      
      const isMobile = isMobileRef.current;
      if (isMobile) return;

      // Calculate chance based on intensity and scroll speed
      const baseChance = intensity + (scrollSpeed / 50);
      if (Math.random() < baseChance) {
        addSparkle(pos.x, pos.y);
        if (scrollSpeed > 10 && Math.random() < 0.6) {
           addSparkle(pos.x + (Math.random() - 0.5) * 60, pos.y + (Math.random() - 0.5) * 60);
        }
      }
    };

    const handleTouch = (e: TouchEvent) => {
      lastActiveTime.current = Date.now();
      const touch = e.touches[0];
      if (touch) {
        const pos = { x: touch.clientX, y: touch.clientY };
        mousePosRef.current = pos;
        setMousePos(pos);
        const isMobile = isMobileRef.current;
        const sparkleChance = isMobile ? (intensity * 0.4) : (intensity + 0.2);
        if (Math.random() < sparkleChance) {
          addSparkle(pos.x, pos.y);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('scroll', () => { lastActiveTime.current = Date.now(); }, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, [addSparkle, intensity, scrollSpeed]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Main Cursor Glow */}
      <motion.div
        className="w-6 h-6 bg-primary/20 blur-md rounded-full absolute -ml-3 -mt-3"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
      />
      <motion.div
        className="w-1.5 h-1.5 bg-white shadow-[0_0_10px_#a855f7] rounded-full absolute -ml-0.75 -mt-0.75"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.2 }}
      />

      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: sparkle.x,
              y: sparkle.y,
              rotate: 0 
            }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              y: sparkle.y + (Math.random() - 0.5) * 50,
              x: sparkle.x + (Math.random() - 0.5) * 50,
              rotate: 180
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobileRef.current ? 0.5 : 0.8, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: sparkle.color,
              borderRadius: '50%',
              boxShadow: `0 0 8px ${sparkle.color}`,
              marginLeft: -sparkle.size / 2,
              marginTop: -sparkle.size / 2,
            }}
          />
        ))}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .cursor-sparkle-active {
          cursor: none !important;
        }
        @media (max-width: 768px) {
          .cursor-sparkle-active {
            cursor: auto !important;
          }
        }
      `}} />
    </div>
  );
}
