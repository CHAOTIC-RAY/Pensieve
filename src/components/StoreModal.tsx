import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Store, Zap, Crown, Loader2, Check, Lock, Info, ChevronRight, Eye, Package, Palette } from 'lucide-react';
import { StoreItem, fetchStoreItems } from '../services/storeService';
import { UserSettings, saveSettings, getEffectCategory } from '../services/themeStudio';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
}

// Neat visual change descriptions for each item
const EFFECT_CHANGES: Record<string, { impact: string; details: string[] }> = {
  'theme-glass': {
    impact: 'Workspace Cards & Panels',
    details: [
      'Converts solid card backgrounds to stunning frosted semi-transparent layers.',
      'Enables native hardware-accelerated background glass blurs.',
      'Enhances depth, light-refracting borders, and high-contrast text contrast.',
      'Blends perfectly with both ambient light and glowing dark modes.'
    ]
  },
  'effect-crt': {
    impact: 'Vault Interface & Overlay',
    details: [
      'Overlays horizontal, nostalgic scanlines across the entire app workspace.',
      'Applies a retro phosphor pixel glow with a soft, realistic screen flicker.',
      'Transforms display panels with a classic terminal terminal phosphor vibe.',
      'Perfect for immersive vintage cybernetic or terminal aesthetic enthusiasts.'
    ]
  },
  'widget-weather': {
    impact: 'Command Bar / Status Header',
    details: [
      'Injects a weather diagnostics module directly into your search omnibar.',
      'Visual weather conditions (Sun, Rain, Storms) animate based on focus level.',
      'Features a dynamic, smooth ambient pulse synchronized with workspace activity.',
      'Integrates localized temperature status tied directly to your focus streak.'
    ]
  },
  'avatar-glow': {
    impact: 'Header Profile Identity',
    details: [
      'Surrounds your avatar profile frame with a high-fidelity neon aura.',
      'Implements a multi-layered breathing color shadow light pulse.',
      'Highlights your avatar and level in the global header interface.',
      'Dynamically synchronizes with your currently active dashboard accent color.'
    ]
  },
  'search-glass': {
    impact: 'Global Search Command Bar',
    details: [
      'Upgrades your primary input field into a refractive crystal slab.',
      'Triggers a full spectrum light-sweep animation whenever focused.',
      'Applies a crisp crystal-like border accent when actively typing thoughts.',
      'Improves field prominence for rapid navigation and command triggers.'
    ]
  },
  'icon-royal': {
    impact: 'User Profile Identity',
    details: [
      'Replaces default username initials with a premium Golden Crown emblem.',
      'Renders a majestic royal amber radial glow behind your profile avatar.',
      'Features custom gold visual accents on the settings card.',
      'Establishes ultimate cerebral distinction across all workspace modules.'
    ]
  },
  'rank-insignia': {
    impact: 'Evolving Profile Badges',
    details: [
      'Equips an evolving holographic crest frame surrounding your profile.',
      'Badge complexity and layout automatically upgrades as you level up.',
      'Cycles through Bronze, Silver, Gold, Platinum, and Neural tiers.',
      'Provides instant visual prestige of your focus achievements.'
    ]
  },
  'search-neon': {
    impact: 'Global Search Command Bar',
    details: [
      'Wraps your search bar in a high-intensity cyan neon energy aura.',
      'Casts soft, atmospheric ambient light diffusion onto nearby containers.',
      'Adds a lightning-fast sweep effect when executing search queries.',
      'Delivers exceptional visibility, perfect for high-tech dark themes.'
    ]
  },
  'aura-aurora': {
    impact: 'Ambient Workspace Aura',
    details: [
      'Washes the vault in drifting teal, violet, and rose northern-light ribbons.',
      'Slow parallax bloom that breathes behind your mind cards.',
      'Stacks cleanly with CRT or film overlays without fighting the UI.',
      'Ideal for late-night capture sessions with a soft cinematic mood.'
    ]
  },
  'aura-ember': {
    impact: 'Ambient Workspace Aura',
    details: [
      'Warm amber and coral edge lighting like candlelight around the canvas.',
      'Gentle breathing glow from the corners of the vault.',
      'Pairs well with editorial light themes and cozy focus blocks.',
      'Unequips other ambient auras so only one mood is active.'
    ]
  },
  'aura-ocean': {
    impact: 'Ambient Workspace Aura',
    details: [
      'Cool indigo–cyan depth wash for calm, deep-focus sessions.',
      'Layered aquatic gradients that drift slowly across the workspace.',
      'Keeps text and cards readable while adding atmospheric depth.',
      'Great companion to minimal or glass UI styles.'
    ]
  },
  'aura-mist': {
    impact: 'Ambient Workspace Aura',
    details: [
      'Soft fog vignette that gently feathers the edges of the vault.',
      'Diffused light haze for a quiet, uncluttered atmosphere.',
      'Reduces harsh contrast without dimming card content.',
      'Perfect for long reading and note-review sessions.'
    ]
  },
  'aura-sunset': {
    impact: 'Ambient Workspace Aura',
    details: [
      'Peach and rose golden-hour bloom across the workspace.',
      'Warm evening gradient that slowly breathes in intensity.',
      'Editorial mood lighting without covering your mind cards.',
      'Exclusive ambient aura slot — swaps with other auras on equip.'
    ]
  },
  'effect-film-grain': {
    impact: 'Screen Texture Overlay',
    details: [
      'Subtle cinematic grain across the entire vault canvas.',
      'Analog film noise with a soft multiply blend.',
      'Adds tactile depth without obscuring text or cards.',
      'Shares the screen-overlay slot with CRT and Digital Rain.'
    ]
  },
  'effect-matrix': {
    impact: 'Screen Texture Overlay',
    details: [
      'Whisper-quiet matrix glyphs drifting behind the vault.',
      'Terminal-green code rain at very low opacity.',
      'Cyberpunk accent that stays out of the way of reading.',
      'Exclusive with other screen overlays like CRT and film grain.'
    ]
  },
  'effect-particles': {
    impact: 'Ambient Particle Field',
    details: [
      'Floating dust motes that drift slowly through workspace air.',
      'Soft-light particles for depth without distraction.',
      'Uses the ambient aura slot so it swaps with color auras.',
      'Lovely with dark themes and glass cards.'
    ]
  },
  'effect-sparkle': {
    impact: 'Interactive Surface Shimmer',
    details: [
      'Light-sweep shimmer across the omnibar edge.',
      'Soft highlight outline when hovering mind cards.',
      'Premium micro-interaction without cluttering the canvas.',
      'Stacks with search styles and card effects.'
    ]
  },
  'card-halo': {
    impact: 'Mind Card Hover Presence',
    details: [
      'Soft colored halo blooms behind cards on hover.',
      'Accent-tinted lift that follows your theme color.',
      'Gives the masonry grid a premium, tactile feel.',
      'Exclusive cards-category effect — one halo style at a time.'
    ]
  },
  'avatar-orbit': {
    impact: 'Header Profile Identity',
    details: [
      'Tiny accent dots orbit your avatar like a micro solar system.',
      'Primary-color and gold satellites for dual-tone motion.',
      'Works alongside rank frames in the avatar border slot.',
      'Subtle prestige without replacing your profile icon.'
    ]
  },
  'search-pulse': {
    impact: 'Global Search Command Bar',
    details: [
      'Soft breathing ring around the omnibar while you search.',
      'Calm focus cue synchronized with your accent color.',
      'Lightweight pulse that never fights typed text.',
      'Shares the search-bar slot with neon and crystal styles.'
    ]
  },
  'theme-neko': {
    impact: 'Workspace Theme Palette',
    details: [
      'Soft sakura blush canvas with mint ambient blooms.',
      'Pastel card borders and cozy café-tinted chrome.',
      'Accent color shifts to warm pink for buttons and focus rings.',
      'Exclusive theme slot — swaps with Frosted Glass when equipped.'
    ]
  },
  'effect-neko': {
    impact: 'Floating Mascot Buddy',
    details: [
      'Spawns a tiny dancing neko in the corner of your vault.',
      'Bouncy paw and tail animation while you browse and capture.',
      'Respects reduced-motion preferences automatically.',
      'Exclusive mascot slot — one buddy at a time.'
    ]
  }
};

export default function StoreModal({ isOpen, onClose, userSettings, onUpdateSettings }: StoreModalProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'owned'>('market');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'effect' | 'theme' | 'avatar'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadStore();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const loadStore = async () => {
    setLoading(true);
    const fetched = await fetchStoreItems();
    setItems(fetched);
    setLoading(false);
  };

  const currentXp = userSettings.xp || 0;
  const unlocked = userSettings.unlockedEffects || [];
  const activeEffects = userSettings.activeEffects || (userSettings.activeEffect ? userSettings.activeEffect.split(' ').filter(Boolean) : []);

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
    let currentActive = [...activeEffects];
    if (currentActive.length === 0 && item.type === 'effect') {
      currentActive.push(item.effectId);
      newSettings.activeEffects = currentActive;
      newSettings.activeEffect = currentActive.join(' ');
    }

    if (onUpdateSettings) {
      onUpdateSettings(newSettings);
    } else {
      saveSettings(newSettings);
    }
  };

  const handleEquip = (item: StoreItem) => {
    const newSettings = { ...userSettings };
    let currentActive = [...(newSettings.activeEffects || (newSettings.activeEffect ? newSettings.activeEffect.split(' ').filter(Boolean) : []))];
    
    if (currentActive.includes(item.effectId)) {
      currentActive = currentActive.filter(id => id !== item.effectId);
    } else {
      // Equip: remove any existing active effects of the same category
      const itemCategory = getEffectCategory(item.effectId);
      currentActive = currentActive.filter(id => getEffectCategory(id) !== itemCategory);
      currentActive.push(item.effectId);
    }
    
    newSettings.activeEffects = currentActive;
    newSettings.activeEffect = currentActive.join(' ');
    
    if (onUpdateSettings) {
      onUpdateSettings(newSettings);
    } else {
      saveSettings(newSettings);
    }
  };

  const marketItems = items.filter(i => !unlocked.includes(i.effectId));
  const ownedItems = items.filter(i => unlocked.includes(i.effectId));

  // Render a beautiful interactive animation preview inside the detail view
  const renderEffectAnimation = (effectId: string) => {
    switch (effectId) {
      case 'theme-glass':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-500 via-indigo-600 to-cyan-500 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/10 backdrop-blur-[2px]" />
            <div className="absolute w-28 h-28 bg-rose-400/30 rounded-full blur-xl animate-pulse -top-4 -left-4" />
            <div className="absolute w-36 h-36 bg-cyan-400/25 rounded-full blur-2xl animate-bounce bottom-2 right-2" />
            <div className="relative z-10 w-full max-w-[200px] p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-2">
              <div className="w-16 h-3 bg-white/40 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
              <div className="w-3/4 h-2 bg-white/20 rounded" />
              <div className="flex justify-between items-center mt-2">
                <div className="w-10 h-5 bg-white/30 rounded" />
                <div className="w-5 h-5 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        );

      case 'effect-crt':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 border border-emerald-500/20 flex flex-col justify-between p-4 font-mono text-[9px] text-emerald-400">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.04] to-transparent animate-[scanline_4s_linear_infinite] pointer-events-none" />
            {/* Horizontal scanline simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
            <div className="flex justify-between border-b border-emerald-500/20 pb-1.5">
              <span>[NEURAL CORE DIRECT_V9]</span>
              <span className="animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE
              </span>
            </div>
            <div className="space-y-1 my-auto">
              <p className="text-emerald-300 font-bold">SYSTEM STATUS: READY</p>
              <p className="opacity-70">&gt; DECRYPTING VAULT SUCCESS</p>
              <p className="opacity-55">&gt; MONITORING CORE FLOW...</p>
            </div>
            <div className="border-t border-emerald-500/20 pt-1.5 flex justify-between opacity-50 text-[8px]">
              <span>SECURE_SHELL_256</span>
              <span>198.162.0.1</span>
            </div>
            <style>{`
              @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
            `}</style>
          </div>
        );

      case 'widget-weather':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-900 border border-border-subtle flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/40 via-neutral-950 to-indigo-950/40" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl animate-[spin_8s_linear_infinite]">
                    ☀️
                  </div>
                  <div className="absolute -bottom-1 -right-2 text-lg animate-bounce">
                    ☁️
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Atmosphere Cloud</div>
                  <div className="text-[10px] text-sky-400 font-mono">Sunny with Mind Storms</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-mono text-neutral-300 animate-pulse">
                CEREBRAL TEMPERATURE: 72°F
              </div>
            </div>
          </div>
        );

      case 'avatar-glow':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-600 blur-md animate-pulse scale-125 opacity-70" />
              <div className="absolute inset-0 rounded-full bg-indigo-500 blur-xl animate-ping scale-110 opacity-30" />
              <div className="absolute inset-0 rounded-full bg-cyan-400 blur-md animate-pulse scale-105 opacity-60" />
              <div className="relative w-20 h-20 rounded-full bg-neutral-900 border-2 border-violet-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(139,92,246,0.6)]">
                👤
              </div>
            </div>
          </div>
        );

      case 'search-glass':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-950 via-slate-900 to-neutral-950 flex flex-col items-center justify-center p-6 gap-2">
            <div className="relative w-full max-w-[240px] p-3 rounded-2xl border border-white/20 bg-white/[0.04] backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] overflow-hidden">
              <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12 animate-[sweep_3s_ease-in-out_infinite] pointer-events-none" />
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-xs">🔍</span>
                <div className="w-28 h-2 bg-white/25 rounded" />
              </div>
            </div>
            <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest animate-pulse mt-2">Prismatic light Sweep</p>
            <style>{`
              @keyframes sweep {
                0% { left: -100%; }
                50% { left: 100%; }
                100% { left: 100%; }
              }
            `}</style>
          </div>
        );

      case 'icon-royal':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-900 border border-amber-500/10 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
            <div className="relative flex flex-col items-center space-y-2">
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center text-4xl animate-bounce">
                  👑
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-400 font-mono tracking-widest uppercase">ROYAL STATUS ACTIVATE</span>
            </div>
          </div>
        );

      case 'rank-insignia':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 animate-[spin_10s_linear_infinite]">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-white font-mono text-[9px]">
                  GOLD
                </div>
              </div>
              <div className="text-lg text-neutral-400">→</div>
              <div className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-indigo-600 animate-pulse">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-white font-mono text-[9px] font-black">
                  NEURAL
                </div>
              </div>
            </div>
            <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Evolving Rank Crest</p>
          </div>
        );

      case 'search-neon':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[220px] p-3 rounded-xl border border-cyan-500/50 bg-neutral-900 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2">
              <span className="text-cyan-400 animate-pulse text-xs">⚡</span>
              <div className="w-24 h-2 bg-cyan-400/30 rounded" />
            </div>
            <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mt-3">Neon energy field</p>
          </div>
        );

      case 'aura-aurora':
      case 'aura-ember':
      case 'aura-ocean':
      case 'aura-mist':
      case 'aura-sunset': {
        const auraBg =
          effectId === 'aura-aurora'
            ? 'radial-gradient(ellipse at 20% 20%, rgba(56,189,248,0.45), transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(167,139,250,0.4), transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(244,114,182,0.3), transparent 50%)'
            : effectId === 'aura-ember'
              ? 'radial-gradient(ellipse at 10% 90%, rgba(255,107,53,0.5), transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(251,191,36,0.35), transparent 45%)'
              : effectId === 'aura-ocean'
                ? 'radial-gradient(ellipse at 15% 40%, rgba(14,165,233,0.45), transparent 50%), radial-gradient(ellipse at 85% 70%, rgba(99,102,241,0.4), transparent 45%)'
                : effectId === 'aura-mist'
                  ? 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(226,232,240,0.55) 100%)'
                  : 'radial-gradient(ellipse at 20% 0%, rgba(251,146,60,0.45), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(244,114,182,0.35), transparent 45%)';
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
            <div
              className="absolute inset-0 animate-pulse"
              style={{ background: auraBg }}
            />
            <div className="relative z-10 px-4 py-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm text-[10px] font-mono text-white/80 uppercase tracking-widest">
              Ambient aura
            </div>
          </div>
        );
      }

      case 'effect-film-grain':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br from-stone-200 via-neutral-100 to-stone-300 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px',
              }}
            />
            <div className="relative z-10 px-4 py-3 rounded-lg bg-white/70 border border-stone-300/60 text-[10px] font-mono uppercase tracking-widest text-stone-700">
              Film grain
            </div>
          </div>
        );

      case 'effect-matrix':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 border border-emerald-500/20 flex items-center justify-center font-mono text-[9px] text-emerald-400/70">
            <div className="absolute inset-0 opacity-40 overflow-hidden leading-relaxed tracking-widest p-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ opacity: 0.3 + (i % 3) * 0.15 }}>
                  01{i % 2}10 アカサタ 0110{i}1 MYMIND
                </div>
              ))}
            </div>
            <span className="relative z-10 text-emerald-300 font-bold tracking-[0.25em] uppercase">Digital rain</span>
          </div>
        );

      case 'effect-particles':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/70 animate-pulse"
                style={{
                  left: `${8 + (i * 6.5) % 84}%`,
                  top: `${12 + (i * 11) % 70}%`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.35 + (i % 4) * 0.15,
                }}
              />
            ))}
            <span className="relative z-10 text-[10px] font-mono uppercase tracking-widest text-white/70">Dust motes</span>
          </div>
        );

      case 'effect-sparkle':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-900 flex flex-col items-center justify-center p-6 gap-3">
            <div className="relative w-full max-w-[220px] p-3 rounded-xl border border-white/20 bg-neutral-800 overflow-hidden">
              <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[sweep_2.5s_ease-in-out_infinite]" />
              <div className="w-28 h-2 bg-white/25 rounded relative z-10" />
            </div>
            <p className="text-[9px] text-white/50 font-mono uppercase tracking-widest">Sparkle trail</p>
            <style>{`
              @keyframes sweep {
                0% { left: -40%; }
                100% { left: 120%; }
              }
            `}</style>
          </div>
        );

      case 'card-halo':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-6">
            <div
              className="w-40 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-border-subtle text-[10px] font-mono uppercase tracking-wider text-foreground/70"
              style={{
                boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 12px 36px -8px rgba(139,92,246,0.45)',
                filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.25))',
              }}
            >
              Halo lift
            </div>
          </div>
        );

      case 'avatar-orbit':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-neutral-900 border-2 border-violet-400/60 flex items-center justify-center text-2xl">
                👤
              </div>
              <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-[orbitA_4s_linear_infinite]" />
              <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-[orbitB_6s_linear_infinite]" />
            </div>
            <style>{`
              @keyframes orbitA {
                from { transform: rotate(0deg) translateX(36px) rotate(0deg); }
                to { transform: rotate(360deg) translateX(36px) rotate(-360deg); }
              }
              @keyframes orbitB {
                from { transform: rotate(180deg) translateX(44px) rotate(-180deg); }
                to { transform: rotate(540deg) translateX(44px) rotate(-540deg); }
              }
            `}</style>
          </div>
        );

      case 'search-pulse':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-950 flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-[220px]">
              <div className="absolute -inset-1 rounded-xl border border-violet-400/50 animate-ping opacity-40" />
              <div className="relative p-3 rounded-xl border border-violet-400/40 bg-neutral-900 flex items-center gap-2">
                <span className="text-violet-300 text-xs">⌕</span>
                <div className="w-24 h-2 bg-violet-400/25 rounded" />
              </div>
            </div>
            <p className="text-[9px] text-violet-300/70 font-mono uppercase tracking-widest mt-4">Search pulse</p>
          </div>
        );

      case 'theme-neko':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden flex items-center justify-center p-6"
            style={{
              background:
                'radial-gradient(ellipse at 15% 0%, rgba(255,182,193,0.55), transparent 50%), radial-gradient(ellipse at 90% 20%, rgba(186,230,215,0.4), transparent 45%), #fff5f8',
            }}
          >
            <div className="w-full max-w-[200px] p-4 rounded-xl bg-[#fffafc] border border-pink-200/70 shadow-sm space-y-2">
              <div className="w-16 h-2.5 rounded bg-pink-300/70" />
              <div className="w-full h-2 rounded bg-pink-100" />
              <div className="w-3/4 h-2 rounded bg-pink-100" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-pink-400 pt-1">Neko café</p>
            </div>
          </div>
        );

      case 'effect-neko':
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-mint-50 flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #fff5f8, #e8fff6)' }}
          >
            <div
              className="text-5xl select-none"
              style={{ animation: 'nekoPreviewBounce 0.55s ease-in-out infinite alternate', display: 'inline-block' }}
            >
              🐱
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-pink-500/80">Dancing neko</p>
            <style>{`
              @keyframes nekoPreviewBounce {
                from { transform: translateY(0) rotate(-6deg); }
                to { transform: translateY(-10px) rotate(6deg); }
              }
            `}</style>
          </div>
        );

      default:
        return (
          <div className="relative w-full h-full min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        );
    }
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
      
      <div className="fixed inset-0 z-[200010] flex items-end md:items-center justify-center md:p-6 pointer-events-none">
        <motion.div
          initial={{ y: '100%', opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
          className="w-full h-full md:max-w-5xl md:h-[90vh] bg-modal-bg shadow-2xl md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 md:px-8 md:py-6 border-b border-border-subtle/50 bg-modal-sidebar backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Store className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-foreground flex items-center gap-2">
                  {activeTab === 'market' ? 'Marketplace' : 'My Inventory'}
                </h2>
                <p className="text-[10px] md:text-xs text-foreground/45 font-mono uppercase tracking-widest">
                  {activeTab === 'market' ? 'Neural Enhancements' : 'Owned Enhancements'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* XP Balance Badge */}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-amber-500 shadow-sm">
                <Crown className="w-3.5 h-3.5 md:w-4 h-4" />
                <span className="text-xs md:text-sm font-black font-mono">{currentXp} XP</span>
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
          <div className="p-4 md:p-10 overflow-y-auto custom-scrollbar flex-1 space-y-6 no-scrollbar bg-foreground/[0.01]">
            {/* Category Filter and Search Panel */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-foreground/[0.02] p-4 rounded-2xl border border-border-subtle/50 mb-4">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Upgrades' },
                  { id: 'effect', label: 'Effects' },
                  { id: 'theme', label: 'Themes' },
                  { id: 'avatar', label: 'Avatar Sync' }
                ].map(tab => {
                  const isTabActive = (activeCategory || 'all') === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        isTabActive 
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                          : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Filter upgrades..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <div className="relative">
                  <Zap className="w-12 h-12 animate-pulse text-indigo-500" />
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse" />
                </div>
                <p className="text-xs font-mono tracking-[0.3em] uppercase mt-6 text-foreground/60">Calibrating Market...</p>
              </div>
            ) : (() => {
              const currentList = activeTab === 'market' ? marketItems : ownedItems;
              const filteredList = currentList.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                  item.description.toLowerCase().includes((searchQuery || '').toLowerCase());
                
                if (!matchesSearch) return false;
                if (!activeCategory || activeCategory === 'all') return true;
                if (activeCategory === 'avatar') {
                  return ['avatar-glow', 'rank-insignia', 'icon-royal', 'avatar-orbit'].includes(item.effectId);
                }
                return item.type === activeCategory;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-24 opacity-40">
                    <p className="text-sm font-mono uppercase tracking-widest">
                      No matching items found in the vault.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 pb-20">
                  {filteredList.map(item => {
                    const isOwned = unlocked.includes(item.effectId);
                    const isEquipped = activeEffects.includes(item.effectId);
                    const canAfford = currentXp >= item.price;

                    return (
                      <motion.div 
                        layout
                        key={item.$id || item.effectId} 
                        onClick={() => setSelectedItem(item)}
                        className={`group p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 relative overflow-hidden flex flex-col h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                          isEquipped 
                            ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow-[0_20px_50px_rgba(99,102,241,0.08)]' 
                            : isOwned
                            ? 'border-border-subtle bg-foreground/[0.01] hover:bg-foreground/[0.03]'
                            : 'border-border-subtle/50 bg-background hover:border-indigo-500/20 hover:shadow-xl transition-shadow'
                        }`}
                      >
                        {/* Decoration */}
                        {isEquipped && (
                          <div className="absolute -top-12 -right-12 w-24 h-24 blur-2xl rounded-full bg-indigo-500/10" />
                        )}

                        <div className="flex-1 space-y-3 md:space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 md:space-y-1">
                              <span className="text-[8px] md:text-[9px] font-bold font-mono text-indigo-500/60 uppercase tracking-[0.2em]">
                                {item.type}
                              </span>
                              <h3 className="text-sm md:text-lg font-black text-text-heading tracking-tight leading-tight line-clamp-1 md:line-clamp-none">
                                {item.name}
                              </h3>
                            </div>
                            {!isOwned && (
                              <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full border text-[9px] md:text-xs font-black font-mono flex items-center gap-1 ${canAfford ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-foreground/5 text-foreground/30 border-foreground/10'}`}>
                                {item.price}
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] md:text-sm text-foreground/50 leading-relaxed min-h-[2rem] md:min-h-[3rem] line-clamp-2 md:line-clamp-3">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 md:mt-6">
                          <div className={`w-full py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 text-center ${
                            isEquipped 
                              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-[0.98]' 
                              : isOwned
                              ? 'bg-foreground/5 text-foreground/70'
                              : canAfford
                              ? 'bg-foreground text-background shadow-lg'
                              : 'bg-foreground/5 text-foreground/20'
                          }`}>
                            {isEquipped ? 'Active' : isOwned ? 'Owned' : canAfford ? 'View Upgrade' : 'Locked'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Sticky Close & Inventory Buttons for All Screens */}
          <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-border-subtle bg-modal-sidebar/95 backdrop-blur-md z-30 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === 'market' ? 'owned' : 'market')}
              className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border cursor-pointer h-12 ${
                activeTab === 'owned'
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500'
                  : 'bg-foreground/5 border-border-subtle text-foreground/70 hover:bg-foreground/10'
              }`}
            >
              <Package className="w-4 h-4" />
              {activeTab === 'market' ? 'My Inventory' : 'Marketplace'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-foreground text-background font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer h-12"
            >
              <X className="w-4 h-4" />
              Close Marketplace
            </button>
          </div>

          {/* Detail View Overlay */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200020] flex items-center justify-center p-4 md:p-6"
              >
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedItem(null)}
                  className="absolute inset-0 bg-background/85 backdrop-blur-md"
                />
                
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  className="w-full max-w-3xl bg-card-bg border border-border-subtle rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden z-10 flex flex-col h-[85vh] md:h-auto md:max-h-[80vh]"
                >
                  {/* Close button - Top Right */}
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-5 right-5 w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 transition-colors z-20"
                    aria-label="Close detail view"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-0 md:flex md:flex-row md:gap-8 custom-scrollbar">
                    {/* Left Column: Custom Interactive Preview Container */}
                    <div className="w-full md:w-[45%] flex flex-col space-y-4">
                      <span className="text-[10px] font-bold font-mono text-foreground/40 uppercase tracking-widest">
                        Neural Core Simulation
                      </span>
                      
                      <div className="relative border border-border-subtle/70 rounded-2xl p-1 bg-neutral-950/40 shadow-inner flex items-center justify-center overflow-hidden aspect-video md:aspect-square">
                        {renderEffectAnimation(selectedItem.effectId)}
                      </div>

                      <div className="rounded-xl bg-foreground/[0.02] border border-border-subtle/50 p-3 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-[10px] md:text-xs text-foreground/50 leading-relaxed">
                          This preview represents a physical rendering of the neural upgrade inside a virtual sandbox. Applying it will activate the styling.
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Descriptions and Neat List of Changes */}
                    <div className="w-full md:w-[55%] flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black font-mono text-indigo-500 uppercase tracking-[0.3em] bg-indigo-500/10 px-2 py-0.5 rounded">
                              {selectedItem.type}
                            </span>
                            <span className="text-[10px] font-bold font-mono text-amber-500 uppercase tracking-widest">
                              Premium Neural Grade
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black text-text-heading tracking-tight leading-none pt-1">
                            {selectedItem.name}
                          </h3>
                        </div>

                        <p className="text-xs md:text-sm text-foreground/65 leading-relaxed">
                          {selectedItem.description}
                        </p>

                        {/* Neat Explanations of what the effect changes */}
                        <div className="space-y-3 pt-2">
                          <div className="text-[10px] font-black font-mono uppercase tracking-[0.15em] text-foreground/40 flex items-center gap-1.5 border-b border-border-subtle/30 pb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>System Modifications</span>
                          </div>
                          
                          <div className="text-[11px] font-bold text-foreground/80 font-mono">
                            Target Element: <span className="text-indigo-400">
                              {EFFECT_CHANGES[selectedItem.effectId]?.impact || 'Global Workspace UI'}
                            </span>
                          </div>

                          <ul className="space-y-2">
                            {(EFFECT_CHANGES[selectedItem.effectId]?.details || [
                              'Integrates custom high-fidelity styling components to your central workspace.',
                              'Activates responsive transitions when triggering related commands.',
                              'Designed to consume zero CPU overhead with native GPU compositions.'
                            ]).map((detail, index) => (
                              <li key={index} className="flex items-start gap-2 text-[11px] md:text-xs text-foreground/50 leading-relaxed">
                                <span className="text-indigo-500 font-mono text-sm leading-none mt-px select-none">▪</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Custom Neon Search Glow Color Customizer */}
                        {unlocked.includes(selectedItem.effectId) && selectedItem.effectId === 'search-neon' && (
                          <div className="space-y-2 pt-3 border-t border-border-subtle/30">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
                              Neon Glow Color Customization
                            </label>
                            <div className="flex items-center gap-2">
                              {['#00ffff', '#f43f5e', '#10b981', '#fbbf24', '#a855f7', '#3b82f6'].map((color) => {
                                const isColorSelected = (userSettings.searchNeonColor || userSettings.themeColor || '#8b5cf6').toLowerCase() === color.toLowerCase();
                                return (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      const newSettings = { ...userSettings, searchNeonColor: color };
                                      if (onUpdateSettings) {
                                        onUpdateSettings(newSettings);
                                      } else {
                                        saveSettings(newSettings);
                                      }
                                    }}
                                    className={`w-7 h-7 rounded-full border shadow-sm transition-all flex-shrink-0 hover:scale-110 ${
                                      isColorSelected ? 'ring-2 ring-indigo-500 ring-offset-2 border-white' : 'border-border-subtle'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                );
                              })}
                              
                              {/* Custom Color Input */}
                              <div className="relative w-7 h-7 rounded-full border border-border-subtle bg-gradient-to-tr from-rose-400 via-violet-400 to-emerald-400 shadow-sm overflow-hidden group hover:scale-110 transition-all">
                                <input
                                  type="color"
                                  value={userSettings.searchNeonColor || userSettings.themeColor || '#8b5cf6'}
                                  onChange={(e) => {
                                    const newSettings = { ...userSettings, searchNeonColor: e.target.value };
                                    if (onUpdateSettings) {
                                      onUpdateSettings(newSettings);
                                    } else {
                                      saveSettings(newSettings);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  title="Custom neon search color"
                                />
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                  <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pricing and Action Row */}
                      <div className="pt-4 border-t border-border-subtle/50 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full flex justify-between sm:flex-col items-center sm:items-start">
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Required Power</span>
                          <span className="text-xl font-black text-amber-500 font-mono flex items-center gap-1">
                            <Crown className="w-5 h-5 text-amber-500" />
                            {selectedItem.price} XP
                          </span>
                        </div>

                        <div className="w-full sm:w-auto flex-1 flex gap-3">
                          {unlocked.includes(selectedItem.effectId) ? (
                            <button
                              onClick={() => {
                                handleEquip(selectedItem);
                                setSelectedItem(null);
                              }}
                              className={`w-full py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeEffects.includes(selectedItem.effectId)
                                  ? 'bg-indigo-500 text-white shadow-lg'
                                  : 'bg-foreground text-background shadow-xl hover:opacity-90'
                              }`}
                            >
                              {activeEffects.includes(selectedItem.effectId) ? 'Unequip Style' : 'Equip Enhancement'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handlePurchase(selectedItem);
                                if (currentXp >= selectedItem.price) setSelectedItem(null);
                              }}
                              disabled={currentXp < selectedItem.price}
                              className={`w-full py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                currentXp >= selectedItem.price
                                  ? 'bg-foreground text-background shadow-xl hover:opacity-90 active:scale-95'
                                  : 'bg-foreground/10 text-foreground/30 cursor-not-allowed border border-border-subtle'
                              }`}
                            >
                              {currentXp >= selectedItem.price ? 'Unlock Upgrade' : 'Insufficient XP'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
