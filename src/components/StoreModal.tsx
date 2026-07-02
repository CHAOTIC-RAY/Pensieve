import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, ShoppingBag, Zap, Crown } from 'lucide-react';
import { StoreItem, fetchStoreItems } from '../services/storeService';
import { UserSettings, saveSettings } from '../services/themeStudio';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
}

export default function StoreModal({ isOpen, onClose, userSettings }: StoreModalProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStore();
      
      window.history.pushState({ modal: 'store' }, '');
      const handlePopState = () => onClose();
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'store') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const loadStore = async () => {
    setLoading(true);
    const fetched = await fetchStoreItems();
    setItems(fetched);
    setLoading(false);
  };

  if (!isOpen) return null;

  const currentXp = userSettings.xp || 0;
  const unlocked = userSettings.unlockedEffects || [];
  const activeEffect = userSettings.activeEffect;

  const handlePurchase = (item: StoreItem) => {
    if (currentXp < item.price) {
      alert("Not enough XP!");
      return;
    }
    if (unlocked.includes(item.effectId)) {
      return;
    }

    const newSettings = { ...userSettings };
    newSettings.xp = (newSettings.xp || 0) - item.price;
    newSettings.unlockedEffects = [...(newSettings.unlockedEffects || []), item.effectId];
    
    // Auto-equip if it's the first effect
    if (!newSettings.activeEffect && item.type === 'effect') {
      newSettings.activeEffect = item.effectId;
    }

    saveSettings(newSettings);
    // Force re-render locally by updating state if we were passing setter, but we rely on global event app-settings-updated
  };

  const handleEquip = (item: StoreItem) => {
    const newSettings = { ...userSettings };
    if (newSettings.activeEffect === item.effectId) {
      newSettings.activeEffect = null; // unequip
    } else {
      newSettings.activeEffect = item.effectId;
    }
    saveSettings(newSettings);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/80 backdrop-blur-[8px] z-[200000]"
      />
      
      <div className="fixed inset-0 z-[200010] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-2xl bg-card-bg shadow-2xl rounded-3xl border border-border-subtle relative overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-subtle/50 bg-foreground/[0.02] flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display tracking-tight text-text-heading flex items-center gap-2">
                  Marketplace
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h2>
                <p className="text-xs text-foreground/50">Trade XP for visual effects</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-500">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-bold font-mono">{currentXp} XP</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-foreground/5 rounded-xl transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Zap className="w-8 h-8 animate-pulse mb-4 text-indigo-400" />
                <p className="text-sm font-mono tracking-widest uppercase">Loading Store...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <p>The store is currently empty.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map(item => {
                  const isOwned = unlocked.includes(item.effectId);
                  const isEquipped = activeEffect === item.effectId;
                  const canAfford = currentXp >= item.price;

                  return (
                    <div 
                      key={item.$id || item.effectId} 
                      className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                        isEquipped 
                          ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                          : isOwned
                          ? 'border-border-subtle bg-card-bg'
                          : 'border-border-subtle/50 bg-card-bg hover:border-border-subtle hover:bg-foreground/[0.02]'
                      }`}
                    >
                      {/* Decoration */}
                      {isEquipped && (
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/20 blur-xl rounded-full" />
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-base text-text-heading">{item.name}</h3>
                          <span className="text-[9px] font-mono text-primary/70 uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {item.type}
                          </span>
                        </div>
                        {!isOwned && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-md border ${canAfford ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-foreground/5 text-foreground/40 border-foreground/10'}`}>
                            {item.price} XP
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-foreground/60 leading-relaxed mb-6 min-h-[2.5rem]">
                        {item.description}
                      </p>

                      <div className="pt-4 border-t border-border-subtle/50">
                        {isOwned ? (
                          <button
                            onClick={() => handleEquip(item)}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                              isEquipped 
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                                : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/80'
                            }`}
                          >
                            {isEquipped ? 'Equipped' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={!canAfford}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                              canAfford
                                ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20 hover:bg-amber-400'
                                : 'bg-foreground/5 text-foreground/30 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Purchase Effect' : 'Not enough XP'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
