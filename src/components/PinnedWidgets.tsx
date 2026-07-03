import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, X, Cloud, Clock, Crown, Zap, Shield } from 'lucide-react';
import { UserSettings, calculateLevel } from '../services/themeStudio';

interface PinnedWidgetsProps {
  settings: UserSettings;
}

export default function PinnedWidgets({ settings }: PinnedWidgetsProps) {
  const pinned = settings.pinnedWidgets || [];
  const levelInfo = calculateLevel(settings.xp || 0);
  
  if (pinned.length === 0 && !settings.unlockedEffects?.includes('widget-weather')) {
    return null;
  }

  // Determine which widgets to show
  const showWeather = settings.unlockedEffects?.includes('widget-weather');
  const showXP = true; // Always show if system active? Or configurable
  const showClock = true;

  return (
    <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none items-end">
      <AnimatePresence>
        {showWeather && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="pointer-events-auto bg-card-bg/80 backdrop-blur-xl border border-border-subtle p-3 rounded-2xl shadow-xl flex items-center gap-3 min-w-[140px]"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Neural Weather</p>
              <p className="text-sm font-black font-mono">Clear Sky</p>
            </div>
          </motion.div>
        )}

        {showClock && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.1 }}
            className="pointer-events-auto bg-card-bg/80 backdrop-blur-xl border border-border-subtle p-3 rounded-2xl shadow-xl flex items-center gap-3 min-w-[140px]"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Local Time</p>
              <p className="text-sm font-black font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        )}

        {showXP && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.2 }}
            className="pointer-events-auto bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 p-3 rounded-2xl shadow-xl flex flex-col gap-2 min-w-[160px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">Level {levelInfo.level}</p>
                  <p className="text-[10px] font-bold font-mono text-amber-500">{settings.xp || 0} XP</p>
                </div>
                <p className="text-[9px] font-black uppercase tracking-tight text-amber-500/40">{levelInfo.tier} Tier</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-amber-500/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
