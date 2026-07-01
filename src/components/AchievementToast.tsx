import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto liquid-glass-panel border-border-subtle/50 px-6 py-4 flex items-center gap-5 shadow-2xl rounded-2xl max-w-md w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
              {achievement.icon ? (
                <achievement.icon className="w-6 h-6 text-white" />
              ) : (
                <Trophy className="w-6 h-6 text-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">
                Milestone Unlocked
              </p>
              <h4 className="text-base font-display font-bold text-foreground truncate">
                {achievement.title}
              </h4>
              <p className="text-xs text-foreground/60 font-sans truncate">
                {achievement.description}
              </p>
            </div>
            
            {achievement.xp && (
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-amber-600">+{achievement.xp}</span>
                <span className="text-[10px] text-amber-600/70 block uppercase tracking-wider">XP</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
