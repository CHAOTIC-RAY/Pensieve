export type UserSettings = {
  xp?: number;
  unlockedEffects?: string[];
  activeEffect?: string | null;
  activeEffects?: string[];
  
  // Customization Overrides (from Store or Settings)
  avatarBorderColor?: string;
  avatarBorderSize?: number;
  avatarBorderStyle?: 'solid' | 'dashed' | 'double' | 'glow';
  avatarIcon?: string;
  
  searchBarGlow?: boolean;
  searchBarGlass?: boolean;
  searchNeonColor?: string;
  
  pinnedWidgets?: string[]; // IDs of widgets to show (e.g. 'weather', 'clock', 'xp-mini')

  // Level System
  level?: number;
  levelProgress?: number; // 0 to 100

  // Theme
  themeMode: 'light' | 'dark';           // Light/dark mode
  themeColor: string;                    // Hex accent color, e.g. '#f43f5e'
  activePreset?: string;                  // Name of last applied preset
  uiStyle?: string;                       // Visual style key (see presets)

  // Typography
  fontCombo: string;                      // Font combo id (see font combos)
  font?: string;                          // Legacy single font override

  // Layout & Effects
  borderRadius: number;                   // Global corner radius in px (0–48)
  blurStrength: number;                   // Backdrop blur in px (0–100)
  cardStyle: 'comfortable' | 'compact';   // Card density style
  backgroundImage?: string;               // Base64 or URL for custom wallpaper

  // Accessibility
  reduceMotion: boolean;                  // Disable animations
  hideImages: boolean;                    // Hide all thumbnails/covers globally
  immersiveMode?: boolean;                // Request fullscreen
  autoNightMode?: boolean;               // Automatically detect and set night mode (6 PM - 6 AM)

  // Navigation
  mobileTabs?: string[];                  // Configurable mobile bottom tab categories
};

export const SETTINGS_KEY = 'app_user_settings';

export const FONT_COMBOS = [
  { 
    id: 'modern', 
    name: 'Modern Sans',
    displayFont: '"Plus Jakarta Sans", sans-serif', 
    bodyFont: '"DM Sans", sans-serif', 
    description: 'Clean & Punchy', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap' 
  },
  { 
    id: 'playful', 
    name: 'Playful Script',
    displayFont: '"Dancing Script", cursive', 
    bodyFont: '"Poppins", sans-serif', 
    description: 'Sweet & Script', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap' 
  },
  { 
    id: 'premium', 
    name: 'Premium Classic',
    displayFont: '"Playfair Display", serif', 
    bodyFont: '"Inter", sans-serif', 
    description: 'Elegant & Refined', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap' 
  },
  { 
    id: 'editorial', 
    name: 'Editorial Magazine',
    displayFont: '"Newsreader", serif', 
    bodyFont: '"Inter", sans-serif', 
    description: 'Classic & Readable', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap' 
  },
  { 
    id: 'tech', 
    name: 'Tech Monospace',
    displayFont: '"Space Grotesk", sans-serif', 
    bodyFont: '"JetBrains Mono", monospace', 
    description: 'Code & Geometric', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..800;1,400..800&family=Space+Grotesk:wght@300..700&display=swap' 
  },
  { 
    id: 'minimal', 
    name: 'Minimalist Simple',
    displayFont: '"Outfit", sans-serif', 
    bodyFont: '"Inter", sans-serif', 
    description: 'Geometric & Simple', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@100..900&display=swap' 
  },
  { 
    id: 'friendly', 
    name: 'Friendly Round',
    displayFont: '"Quicksand", sans-serif', 
    bodyFont: '"Nunito", sans-serif', 
    description: 'Soft & Approachable', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Quicksand:wght@300..700&display=swap' 
  },
  { 
    id: 'mono', 
    name: 'Retro Terminal',
    displayFont: '"Space Mono", monospace', 
    bodyFont: '"Space Mono", monospace', 
    description: 'Typewriter', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap' 
  },
  { 
    id: 'trendy', 
    name: 'Trendy Creative',
    displayFont: '"Syne", sans-serif', 
    bodyFont: '"Inter", sans-serif', 
    description: 'Bold & Creative', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@400..800&display=swap' 
  },
  { 
    id: 'balanced', 
    name: 'Balanced Zen',
    displayFont: '"Fira Sans", sans-serif', 
    bodyFont: '"Inter", sans-serif', 
    description: 'Harmonious & Active', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap' 
  },
  { 
    id: 'nothing-v1', 
    name: 'Nothing Dot Matrix',
    displayFont: '"Space Mono", monospace', 
    bodyFont: '"Space Mono", monospace', 
    description: 'Retro Dot Matrix', 
    source: 'google', 
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap' 
  }
];

export const THEME_PRESETS = [
  { name: 'Editorial', color: '#8b5cf6', fontCombo: 'editorial', uiStyle: 'editorial',    borderRadius: 16, blurStrength: 24, themeMode: 'light' as const },
  { name: 'Rose',      color: '#f43f5e', fontCombo: 'modern',    uiStyle: 'modern',       borderRadius: 24, blurStrength: 16, themeMode: 'dark' as const },
  { name: 'Emerald',   color: '#10b981', fontCombo: 'minimal',   uiStyle: 'minimal',      borderRadius: 12, blurStrength: 8,  themeMode: 'dark' as const },
  { name: 'Neumorph',  color: '#e0e0e0', fontCombo: 'minimal',   uiStyle: 'neumorphism',  borderRadius: 32, blurStrength: 0,  themeMode: 'light' as const },
  { name: 'Ocean',     color: '#0ea5e9', fontCombo: 'trendy',    uiStyle: 'glass',        borderRadius: 32, blurStrength: 32, themeMode: 'dark' as const },
  { name: 'Cyber',     color: '#00ff00', fontCombo: 'trendy',    uiStyle: 'brutalist',    borderRadius: 0,  blurStrength: 0,  themeMode: 'dark' as const },
  { name: 'Zen',       color: '#8b5cf6', fontCombo: 'balanced',  uiStyle: 'minimal',      borderRadius: 16, blurStrength: 4,  themeMode: 'dark' as const },
  { name: 'Frost',     color: '#ffffff', fontCombo: 'trendy',    uiStyle: 'liquid-glass', borderRadius: 40, blurStrength: 40, themeMode: 'light' as const },
  { name: 'Bento',     color: '#1a1a1a', fontCombo: 'premium',   uiStyle: 'editorial',    borderRadius: 8,  blurStrength: 4,  themeMode: 'light' as const },
  { name: 'Ink',       color: '#ea3323', fontCombo: 'nothing-v1',uiStyle: 'nothing',      borderRadius: 24, blurStrength: 0,  themeMode: 'dark' as const },
  { name: 'Axiom',     color: '#ff7b00', fontCombo: 'modern',    uiStyle: 'modern',       borderRadius: 24, blurStrength: 20, themeMode: 'dark' as const },
  { name: 'OpenClaw',  color: '#00d2ff', fontCombo: 'minimal',   uiStyle: 'glass',        borderRadius: 36, blurStrength: 60, themeMode: 'dark' as const },
  { name: 'Hypesquad', color: '#ff007f', fontCombo: 'trendy',    uiStyle: 'brutalist',    borderRadius: 16, blurStrength: 10, themeMode: 'dark' as const },
  { name: 'SmartMeeting', color: '#4f46e5', fontCombo: 'balanced', uiStyle: 'editorial',  borderRadius: 12, blurStrength: 16, themeMode: 'light' as const },
];

export const PRESET_COLORS = [
  '#9ca3af', '#6b7280', '#4b5563', '#38bdf8', '#818cf8',
  '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#ffffff'
];

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'light',
  themeColor: '#8b5cf6', // 2 shades of purple background vibe defaults to 8b5cf6
  activePreset: 'Editorial', // The custom requested default preset
  uiStyle: 'editorial',
  fontCombo: 'editorial',
  borderRadius: 16,
  blurStrength: 24,
  cardStyle: 'comfortable',
  backgroundImage: '',
  reduceMotion: false,
  hideImages: false,
  immersiveMode: false,
  autoNightMode: false,
  mobileTabs: ['favorites', 'note', 'link'],
  xp: 100, // starting XP
  unlockedEffects: ['rank-insignia'],
  activeEffect: 'rank-insignia',
  activeEffects: ['rank-insignia'],
};

// Lazy font loader

export function loadGoogleFont(comboId: string) {
  const combo = FONT_COMBOS.find(c => c.id === comboId);
  if (combo && combo.source === 'google' && combo.googleFontsUrl) {
    const linkId = `gf-${combo.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = combo.googleFontsUrl;
      document.head.appendChild(link);
    }
  }
}

export function getFontBodyValue(comboId: string): string {
  const combo = FONT_COMBOS.find(c => c.id === comboId);
  return combo ? combo.bodyFont : '"Inter", sans-serif';
}

export function getFontDisplayValue(comboId: string): string {
  const combo = FONT_COMBOS.find(c => c.id === comboId);
  return combo ? combo.displayFont : '"Space Grotesk", sans-serif';
}

function hexToRgb(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '139, 92, 246'; // default #8b5cf6 RGB
}

export function applyTheme(settings: UserSettings) {
  const root = document.documentElement;
  
  // Handle auto night mode
  let appliedThemeMode = settings.themeMode;
  if (settings.autoNightMode) {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
      appliedThemeMode = 'dark';
    } else {
      appliedThemeMode = 'light';
    }
  }
  
  // Accent & Dimensions
  root.style.setProperty('--primary', settings.themeColor);
  root.style.setProperty('--primary-rgb', hexToRgb(settings.themeColor));
  
  const neonColor = settings.searchNeonColor || settings.themeColor || '#8b5cf6';
  root.style.setProperty('--search-neon-color', neonColor);
  root.style.setProperty('--search-neon-color-rgb', hexToRgb(neonColor));

  root.style.setProperty('--radius-base', settings.borderRadius + 'px');
  root.style.setProperty('--blur-strength', settings.blurStrength + 'px');
  
  // Fonts Loading
  loadGoogleFont(settings.fontCombo);
  root.style.setProperty('--font-body', getFontBodyValue(settings.fontCombo));
  root.style.setProperty('--font-display', getFontDisplayValue(settings.fontCombo));
  
  // Data attributes
  root.setAttribute('data-theme', appliedThemeMode);
  root.setAttribute('data-ui-style', settings.uiStyle || 'modern');
  root.setAttribute('data-hide-images', settings.hideImages ? 'true' : 'false');
  
  // Custom Overrides
  const levelInfo = calculateLevel(settings.xp || 0);
  root.setAttribute('data-user-level', levelInfo.level.toString());
  root.setAttribute('data-user-tier', levelInfo.tier.toLowerCase());
  
  if (settings.avatarBorderColor) root.style.setProperty('--avatar-border', settings.avatarBorderColor);
  if (settings.avatarBorderSize) root.style.setProperty('--avatar-border-width', settings.avatarBorderSize + 'px');
  root.setAttribute('data-avatar-style', settings.avatarBorderStyle || 'solid');
  
  root.setAttribute('data-search-glow', settings.searchBarGlow ? 'true' : 'false');
  root.setAttribute('data-search-glass', settings.searchBarGlass ? 'true' : 'false');

  // Handle Active Effects from Store
  const activeEffects = settings.activeEffects || (settings.activeEffect ? settings.activeEffect.split(' ').filter(Boolean) : []);
  root.setAttribute('data-active-effects', activeEffects.join(' ') || 'none');
  root.setAttribute('data-active-effect', activeEffects[0] || 'none');
  
  // Custom Dynamic CSS Injection from Admin Panel Workspace
  try {
    let customStyleEl = document.getElementById('pensieve-custom-aura-styles');
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'pensieve-custom-aura-styles';
      document.head.appendChild(customStyleEl);
    }
    
    const storedCodesJson = localStorage.getItem('pensieve_custom_effects_code');
    if (storedCodesJson) {
      const storedCodes = JSON.parse(storedCodesJson);
      let cssToInject = '';
      activeEffects.forEach(effectId => {
        if (storedCodes[effectId] && storedCodes[effectId].cssCode) {
          cssToInject += `\n/* Custom Dynamic Style for equipped effect: ${effectId} */\n${storedCodes[effectId].cssCode}\n`;
        }
      });
      customStyleEl.textContent = cssToInject;
    } else {
      customStyleEl.textContent = '';
    }
  } catch (err) {
    console.error('Error applying custom dynamic aura CSS:', err);
  }
  
  // Special Handling for CRT
  if (activeEffects.includes('effect-crt')) {
    document.body.classList.add('crt-active');
  } else {
    document.body.classList.remove('crt-active');
  }

  // Special Handling for Glass UI (Store Version)
  if (activeEffects.includes('theme-glass')) {
    root.setAttribute('data-ui-style', 'glass');
    root.style.setProperty('--blur-strength', '40px');
  }
  
  // Background Image
  if (settings.backgroundImage) {
    root.style.setProperty('--bg-image', `url(${settings.backgroundImage})`);
    root.classList.add('has-bg-image');
  } else {
    root.style.removeProperty('--bg-image');
    root.classList.remove('has-bg-image');
  }
  
  // Motion reduction
  if (settings.reduceMotion) {
    root.classList.add('motion-reduce');
  } else {
    root.classList.remove('motion-reduce');
  }
  
  // Immersive full-screen (Only trigger if value is explicitly true and not already in fullscreen)
  if (settings.immersiveMode) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else if (document.fullscreenElement) {
    // Only exit if we are currently in fullscreen
    document.exitFullscreen().catch(() => {});
  }
}

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Calculates user level based on XP.
 * Formula: Each level requires 500 XP.
 */
export function calculateLevel(xp: number = 0) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXp = xp % 500;
  const progress = (currentLevelXp / 500) * 100;
  
  // Tier name
  let tier = 'Bronze';
  if (level >= 50) tier = 'Neural';
  else if (level >= 25) tier = 'Platinum';
  else if (level >= 15) tier = 'Gold';
  else if (level >= 5) tier = 'Silver';

  return { level, progress, tier };
}

export function saveSettings(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Apply instantly
    applyTheme(settings);
    // Notify other parts of the app
    window.dispatchEvent(new Event('app-settings-updated'));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getEffectCategory(effectId: string): string {
  if (effectId === 'theme-glass') return 'theme';
  if (effectId === 'effect-crt') return 'screen-overlay';
  if (effectId === 'widget-weather') return 'widget';
  if (effectId === 'avatar-glow' || effectId === 'rank-insignia') return 'avatar-border';
  if (effectId === 'search-glass' || effectId === 'search-neon') return 'search-bar';
  if (effectId === 'icon-royal') return 'profile-icon';
  return 'other';
}
