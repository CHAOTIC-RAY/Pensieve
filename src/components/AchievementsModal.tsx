import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy } from 'lucide-react';
import { Achievement } from '../types';
import AchievementCard from './AchievementCard';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export default function AchievementsModal({ isOpen, onClose, achievements }: AchievementsModalProps) {
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-full max-h-[85vh] liquid-glass-panel border border-border-subtle/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border-subtle/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Milestones</h2>
                  <p className="text-sm text-foreground/60 font-sans">
                    {unlockedCount} of {achievements.length} Unlocked
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
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
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
