import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plug } from 'lucide-react';
import CloudPlugins from './CloudPlugins';
import { MindItem } from '../types';

interface PluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (newItem: Omit<MindItem, 'id' | 'createdAt'>) => Promise<string>;
  onTriggerToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  initialPluginName?: string;
}

export default function PluginModal({ isOpen, onClose, onItemCreated, onTriggerToast, initialPluginName }: PluginModalProps) {
  const [localToast, setLocalToast] = useState<string | null>(null);

  const handleToast = (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => {
    if (onTriggerToast) {
      onTriggerToast(msg, type);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 3000);
    }
  };

  // Map plugin name argument to the plugin ID used by CloudPlugins
  const getMappedPluginId = (name?: string): 'googleDrive' | 'googlePhotos' | 'oneDrive' | null => {
    if (!name) return null;
    const clean = name.toLowerCase().trim();
    if (clean.includes('drive') || clean.includes('google-drive') || clean.includes('google drive')) {
      return 'googleDrive';
    }
    if (clean.includes('photo') || clean.includes('photos') || clean.includes('google-photos') || clean.includes('google photos') || clean.includes('image') || clean.includes('images')) {
      return 'googlePhotos';
    }
    if (clean.includes('onedrive') || clean.includes('one drive') || clean.includes('one-drive') || clean.includes('microsoft')) {
      return 'oneDrive';
    }
    return null;
  };

  const initialPluginId = getMappedPluginId(initialPluginName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Desktop Only) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="hidden md:block fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/80 backdrop-blur-[8px] z-[200000]"
          />
          
          <div className="fixed inset-0 z-[200010] flex items-end md:items-center justify-center md:p-6 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
              className="w-full h-full md:max-w-5xl md:h-[90vh] bg-background md:bg-card-bg shadow-2xl md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 md:px-8 md:py-6 border-b border-border-subtle/50 bg-background/80 md:bg-card-bg/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Plug className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-foreground flex items-center gap-2">
                      Cloud Connections
                      <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        Experimental
                      </span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-foreground/45 font-mono uppercase tracking-widest">
                      Bridge External Archives Read-Only
                    </p>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="p-2 md:p-2.5 bg-foreground/5 md:bg-transparent hover:bg-foreground/10 md:hover:bg-foreground/5 rounded-xl md:rounded-2xl transition-all active:scale-90 text-foreground/60 md:text-foreground/40 hover:text-foreground border border-border-subtle md:border-transparent md:hover:border-border-subtle flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 md:w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-foreground/[0.01]">
                <CloudPlugins 
                  onItemCreated={onItemCreated} 
                  onTriggerToast={handleToast}
                  initialActiveExplorer={initialPluginId}
                />
              </div>

              {/* Bottom Sticky action area for mobile/all screens */}
              <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-border-subtle bg-background/95 dark:bg-card-bg/95 backdrop-blur-md z-30 flex justify-center">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-foreground text-background font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Close Plugins
                </button>
              </div>
            </motion.div>
          </div>

          {/* Local Toast Alert */}
          <AnimatePresence>
            {localToast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200020] px-4 py-2.5 bg-neutral-900/90 text-white text-xs font-semibold rounded-xl border border-neutral-800 shadow-xl flex items-center gap-2 pointer-events-none"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{localToast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
