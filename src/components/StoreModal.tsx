import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Store, Zap, Crown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'market' | 'owned'>('market');
  const [previewEffect, setPreviewEffect] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStore();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        // Reset preview styles
        const root = document.documentElement;
        root.setAttribute('data-active-effect', userSettings.activeEffect || 'none');
        if (userSettings.activeEffect === 'effect-crt') {
          document.body.classList.add('crt-active');
        } else {
          document.body.classList.remove('crt-active');
        }
        root.setAttribute('data-ui-style', userSettings.uiStyle || 'modern');
      };
    }
  }, [isOpen]);

  // History handling to allow "Back" to close modal on mobile
  useEffect(() => {
    if (!isOpen) return;

    const state = { modal: 'store' };
    try {
      window.history.pushState(state, '');
    } catch (e) {
      console.warn('History pushState failed', e);
    }
    
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modal === 'store') {
        try {
          window.history.back();
        } catch (e) {
          console.warn('History back failed', e);
        }
      }
    };
  }, [isOpen, onClose]);

  const loadStore = async () => {
    setLoading(true);
    const fetched = await fetchStoreItems();
    setItems(fetched);
    setLoading(false);
  };

  const currentXp = userSettings.xp || 0;
  const unlocked = userSettings.unlockedEffects || [];
  const activeEffect = userSettings.activeEffect;

  const handlePreview = (item: StoreItem | null) => {
    const root = document.documentElement;
    const effId = item?.effectId || userSettings.activeEffect;
    
    setPreviewEffect(item?.effectId || null);
    
    // Temporarily apply to root for preview
    root.setAttribute('data-active-effect', effId || 'none');
    
    if (effId === 'effect-crt') {
      document.body.classList.add('crt-active');
    } else {
      document.body.classList.remove('crt-active');
    }

    if (effId === 'theme-glass') {
      root.setAttribute('data-ui-style', 'glass');
    } else {
      root.setAttribute('data-ui-style', userSettings.uiStyle || 'modern');
    }
  };

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
    
    // Special defaults for certain effects
    if (item.effectId === 'avatar-glow') {
      newSettings.avatarBorderStyle = 'glow';
      newSettings.avatarBorderSize = 3;
      newSettings.avatarBorderColor = userSettings.themeColor || '#8b5cf6';
    }
    if (item.effectId === 'search-glass') {
      newSettings.searchBarGlass = true;
    }

    // Auto-equip if it's the first effect
    if (!newSettings.activeEffect && item.type === 'effect') {
      newSettings.activeEffect = item.effectId;
    }

    saveSettings(newSettings);
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

  const marketItems = items.filter(i => !unlocked.includes(i.effectId));
  const ownedItems = items.filter(i => unlocked.includes(i.effectId));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          handlePreview(null);
          onClose();
        }}
        className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/80 backdrop-blur-[8px] z-[200000]"
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Store className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-foreground flex items-center gap-2">
                  Marketplace
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                </h2>
                <p className="text-xs text-foreground/45 font-mono uppercase tracking-widest">Neural Enhancements</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center bg-foreground/5 p-1 rounded-2xl border border-border-subtle/50">
                <button 
                  onClick={() => setActiveTab('market')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'market' ? 'bg-background text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground'}`}
                >
                  Market
                </button>
                <button 
                  onClick={() => setActiveTab('owned')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'owned' ? 'bg-background text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground'}`}
                >
                  Owned
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-amber-500 shadow-sm">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-black font-mono">{currentXp} XP</span>
                </div>
                <button 
                  onClick={() => {
                    handlePreview(null);
                    onClose();
                  }}
                  className="p-2.5 hover:bg-foreground/5 rounded-2xl transition-all active:scale-90 text-foreground/40 hover:text-foreground border border-transparent hover:border-border-subtle"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* XP Bar (Mobile Only) */}
          <div className="sm:hidden px-6 py-3 border-b border-border-subtle/30 bg-amber-500/5 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-amber-500/60">Available Balance</span>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-sm font-black font-mono">{currentXp} XP</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 space-y-8 no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <div className="relative">
                  <Zap className="w-12 h-12 animate-pulse text-indigo-500" />
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse" />
                </div>
                <p className="text-xs font-mono tracking-[0.3em] uppercase mt-6 text-foreground/60">Calibrating Market...</p>
              </div>
            ) : (activeTab === 'market' ? marketItems : ownedItems).length === 0 ? (
              <div className="text-center py-24 opacity-40">
                <p className="text-sm font-mono uppercase tracking-widest">
                  {activeTab === 'market' ? 'The vault is currently empty.' : 'You haven\'t unlocked any upgrades yet.'}
                </p>
                {activeTab === 'owned' && (
                  <button 
                    onClick={() => setActiveTab('market')}
                    className="mt-4 px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase tracking-widest"
                  >
                    Visit Market
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {(activeTab === 'market' ? marketItems : ownedItems).map(item => {
                  const isOwned = unlocked.includes(item.effectId);
                  const isEquipped = activeEffect === item.effectId;
                  const isPreviewing = previewEffect === item.effectId;
                  const canAfford = currentXp >= item.price;

                  return (
                    <motion.div 
                      layout
                      key={item.$id || item.effectId} 
                      className={`group p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
                        isEquipped 
                          ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow-[0_20px_50px_rgba(99,102,241,0.08)]' 
                          : isOwned
                          ? 'border-border-subtle bg-foreground/[0.01] hover:bg-foreground/[0.03]'
                          : isPreviewing
                          ? 'border-amber-500/40 bg-amber-500/[0.03] shadow-lg'
                          : 'border-border-subtle/50 bg-background hover:border-indigo-500/20 hover:shadow-xl transition-shadow'
                      }`}
                    >
                      {/* Decoration */}
                      {(isEquipped || isPreviewing) && (
                        <div className={`absolute -top-12 -right-12 w-24 h-24 blur-2xl rounded-full ${isPreviewing ? 'bg-amber-500/10' : 'bg-indigo-500/10'}`} />
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold font-mono text-indigo-500/60 uppercase tracking-[0.2em]">
                              {item.type}
                            </span>
                            <h3 className="font-bold text-lg text-foreground tracking-tight">{item.name}</h3>
                          </div>
                          {!isOwned && (
                            <div className={`px-3 py-1 rounded-full border text-xs font-black font-mono flex items-center gap-1.5 ${canAfford ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-foreground/5 text-foreground/30 border-foreground/10'}`}>
                              {item.price}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground/50 leading-relaxed min-h-[3rem]">
                          {item.description}
                        </p>

                        <div className="pt-4 flex flex-col gap-2">
                          {isOwned ? (
                            <button
                              onClick={() => handleEquip(item)}
                              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                isEquipped 
                                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-[0.98]' 
                                  : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/70'
                              }`}
                            >
                              {isEquipped ? 'Active' : 'Activate'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePurchase(item)}
                                disabled={!canAfford}
                                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                  canAfford
                                    ? 'bg-foreground text-background shadow-lg hover:opacity-90 active:scale-95'
                                    : 'bg-foreground/5 text-foreground/20 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? 'Purchase Upgrade' : 'Locked'}
                              </button>
                              
                              <button
                                onClick={() => handlePreview(isPreviewing ? null : item)}
                                className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  isPreviewing 
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                                    : 'text-foreground/30 hover:text-foreground/60'
                                }`}
                              >
                                {isPreviewing ? 'Stop Preview' : 'Preview Effect'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
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

