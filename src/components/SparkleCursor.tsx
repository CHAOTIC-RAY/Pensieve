import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function SparkleCursor({ intensity = 0.4 }: { intensity?: number }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [scrollSpeed, setScrollSpeed] = useState(0);

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
    const id = Date.now() + Math.random();
    const size = Math.random() * 8 + 2;
    // Purple variants + gold + cyan
    const colors = ['#c084fc', '#a855f7', '#d8b4fe', '#ffffff', '#fbbf24', '#38bdf8'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newSparkle: Sparkle = { id, x, y, size, color };
    
    setSparkles((prev) => [...prev.slice(-80), newSparkle]);

    // Cleanup after animation
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 800);
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let time = 0;
    let animationFrameId: number;
    let isTouching = false;

    const autoAnimate = () => {
      if (isMobile && !isTouching) {
        time += 0.02; // speed of auto movement
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Figure-8 pattern, centered slightly above middle
        const nx = w / 2 + Math.sin(time) * (w * 0.35);
        const ny = h / 2.5 + Math.sin(time * 2) * (h * 0.2);
        
        setMousePos({ x: nx, y: ny });
        
        // Slightly higher chance of sparkles for mobile auto mode
        if (Math.random() < intensity + 0.1) {
          addSparkle(nx, ny);
        }
      }
      animationFrameId = requestAnimationFrame(autoAnimate);
    };

    if (isMobile) {
      animationFrameId = requestAnimationFrame(autoAnimate);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Calculate chance based on intensity and scroll speed
      const baseChance = intensity + (scrollSpeed / 50);
      if (Math.random() < baseChance) {
        addSparkle(e.clientX, e.clientY);
        if (scrollSpeed > 10 && Math.random() < 0.6) {
           addSparkle(e.clientX + (Math.random() - 0.5) * 60, e.clientY + (Math.random() - 0.5) * 60);
        }
      }
    };

    let touchTimeout: any;
    const handleTouch = (e: TouchEvent) => {
      isTouching = true;
      clearTimeout(touchTimeout);
      const touch = e.touches[0];
      if (touch) {
        setMousePos({ x: touch.clientX, y: touch.clientY });
        if (Math.random() < intensity + 0.2) {
          addSparkle(touch.clientX, touch.clientY);
        }
      }
      touchTimeout = setTimeout(() => { isTouching = false; }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    if (isMobile) {
      window.addEventListener('touchstart', handleTouch, { passive: true });
      window.addEventListener('touchmove', handleTouch, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(touchTimeout);
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
            transition={{ duration: 0.8, ease: "easeOut" }}
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
