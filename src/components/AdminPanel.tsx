import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreItem, fetchStoreItems, addStoreItem, isStoreAppwriteConfigured } from '../services/storeService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, ShieldAlert, Package, Lock, Chrome, LogOut, 
  Sparkles, Code, Copy, Check, Save, Info, RefreshCw, Palette, 
  HelpCircle, Laptop, ShieldCheck, ChevronRight, Eye, Play, PlusCircle, Trash2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';

interface EffectTemplate {
  title: string;
  id: string;
  description: string;
  cssCode: string;
}

const CATEGORIES = [
  { id: 'widget', name: 'Widget Auras', desc: 'Decorate dashboard cards with floating particles, neon borders, and holographic layers.' },
  { id: 'border-effect', name: 'Border Effects', desc: 'Custom active avatar rings, rotating neon lines, and leveling status indicators.' },
  { id: 'searchbar-effect', name: 'SearchBar Effects', desc: 'Refractive crystal backdrops, glowing shadows, and active pulse transitions.' },
  { id: 'theme', name: 'Full App Themes', desc: 'Global theme variable overrides, backdrop filter blends, and custom slate palettes.' },
  { id: 'pfp', name: 'Profile PFPs', desc: 'Premium golden crests, RGB gradient borders, and holographic badge flags.' },
  { id: 'nametag', name: 'Name Tags', desc: 'Chroma glitch lettering, futuristic neon subtitle tags, and epic rank status overlays.' }
];

const TEMPLATES: Record<string, EffectTemplate[]> = {
  widget: [
    {
      title: 'Holographic Neon Floating Card',
      id: 'template-widget-holo',
      description: 'Gives the dashboard widget cards an animated neon glow and hovering motion.',
      cssCode: `/* Customized Floating Widget styling */
.pensieve-widget-custom {
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.15) 0%, rgba(20, 20, 25, 0.85) 100%) !important;
  border: 1px solid rgba(var(--primary-rgb), 0.45) !important;
  box-shadow: 0 8px 32px 0 rgba(var(--primary-rgb), 0.25) !important;
  animation: bounce-widget 4s ease-in-out infinite;
}
@keyframes bounce-widget {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-4px) scale(1.01); }
}`
    },
    {
      title: 'Prismatic Glassmorphic Border',
      id: 'template-widget-prismatic',
      description: 'Applies a sharp, glassmorphic refraction with rainbow-colored thin borders.',
      cssCode: `.pensieve-widget-custom {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(20px) !important;
  border: 1.5px solid transparent !important;
  background-image: linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.01)), linear-gradient(135deg, #ff007f, #00f0ff, #ff007f) !important;
  background-origin: border-box !important;
  background-clip: padding-box, border-box !important;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
}`
    }
  ],
  'border-effect': [
    {
      title: 'Retro-Futuristic Rotating Ring',
      id: 'template-border-rotate',
      description: 'Adds an animated double-bordered rotating avatar border with customized gradient.',
      cssCode: `/* Dual-pulse spinning ring for Avatar border */
[data-active-effects~="your-effect-id"] .avatar-container {
  border: 3px double var(--primary) !important;
  animation: double-pulse-spin 3s ease-in-out infinite alternate !important;
  box-shadow: 0 0 25px var(--primary) !important;
}
@keyframes double-pulse-spin {
  from { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
  to { transform: scale(1.06) rotate(180deg); filter: hue-rotate(60deg); }
}`
    },
    {
      title: 'Cosmic Bio-Luminescence Glow',
      id: 'template-border-pulse',
      description: 'Creates a breathing, bio-luminescent cloud shadow around user avatar containers.',
      cssCode: `[data-active-effects~="your-effect-id"] .avatar-container {
  border-color: #00ffcc !important;
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.6), inset 0 0 8px rgba(0, 255, 204, 0.3) !important;
  animation: cosmic-breathing 2s ease-in-out infinite alternate !important;
}
@keyframes cosmic-breathing {
  0% { box-shadow: 0 0 10px rgba(0, 255, 204, 0.4); }
  100% { box-shadow: 0 0 30px rgba(0, 255, 204, 1); }
}`
    }
  ],
  'searchbar-effect': [
    {
      title: 'Reactive Refractive Crystal Searchbar',
      id: 'template-search-crystal',
      description: 'Transforms the workspace main omnibar into a highly refractive, glassmorphic crystal slab.',
      cssCode: `/* Reactive Refractive Crystal Searchbar */
[data-active-effects~="your-effect-id"] #pensieve-omnibar-box {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(25px) saturate(180%) !important;
  border: 1px solid rgba(var(--primary-rgb), 0.4) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1), 0 0 15px rgba(var(--primary-rgb), 0.1) !important;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
[data-active-effects~="your-effect-id"] #pensieve-omnibar-box:focus-within {
  border-color: #ff007f !important;
  box-shadow: 0 0 35px rgba(255, 0, 127, 0.5) !important;
  transform: scale(1.01);
}`
    },
    {
      title: 'Cyberpunk Matrix Code Scan',
      id: 'template-search-matrix',
      description: 'Applies a sharp terminal-like focus border with a moving tech grid indicator.',
      cssCode: `[data-active-effects~="your-effect-id"] #pensieve-omnibar-box {
  border: 1px solid #39ff14 !important;
  background: #050a02 !important;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.2) !important;
}
[data-active-effects~="your-effect-id"] #pensieve-omnibar-box::after {
  content: "LIVE SYSTEM";
  position: absolute;
  right: 12px;
  top: 14px;
  color: #39ff14;
  font-family: monospace;
  font-size: 8px;
  letter-spacing: 1px;
}`
    }
  ],
  theme: [
    {
      title: 'Immersive Holographic Liquid Dark Theme',
      id: 'template-theme-liquid',
      description: 'Changes primary accents, body layouts, and cards to have a gorgeous, holographic purple glow.',
      cssCode: `/* Immersive Holographic Liquid Dark Theme Override */
[data-active-effects~="your-effect-id"] {
  --primary: #ec4899 !important;
  --primary-rgb: 236, 72, 153 !important;
  background-color: #0b0214 !important;
}
[data-active-effects~="your-effect-id"] .bg-card-bg {
  background: rgba(11, 2, 20, 0.6) !important;
  border-color: rgba(236, 72, 153, 0.2) !important;
  box-shadow: 0 8px 32px rgba(236, 72, 153, 0.08) !important;
}`
    }
  ],
  pfp: [
    {
      title: 'RGB Badge Crest Override',
      id: 'template-pfp-rgb',
      description: 'Configures a rotating, neon-infused emblem behind profile pictures.',
      cssCode: `/* Glowing Halo with dynamic multi-colored gradient ring */
[data-active-effects~="your-effect-id"] .profile-icon-badge {
  background: linear-gradient(45deg, #00ffcc, #0077ff, #ff007f) !important;
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.7) !important;
  animation: rgb-badge 4s linear infinite !important;
}
@keyframes rgb-badge {
  from { filter: hue-rotate(0deg); }
  to { filter: hue-rotate(360deg); }
}`
    }
  ],
  nametag: [
    {
      title: 'Glitch Cyberpunk Tag',
      id: 'template-nametag-glitch',
      description: 'Applies dynamic blue/magenta clipping paths to profile name lettering.',
      cssCode: `[data-active-effects~="your-effect-id"] .user-name-display {
  color: #fff !important;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5) !important;
}`
    }
  ]
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'effect' | 'nametag' | 'theme' | 'other'>('effect');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(10);
  const [effectId, setEffectId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // New states for Interactive Aura Code Editor
  const [selectedEffectId, setSelectedEffectId] = useState<string>('search-neon');
  const [editorCssCode, setEditorCssCode] = useState<string>('');
  const [editorJsCode, setEditorJsCode] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('widget');
  const [isSavedNotify, setIsSavedNotify] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [effectsMap, setEffectsMap] = useState<Record<string, { cssCode: string, jsCode: string }>>({});

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        setUserEmail(result.user.email || null);
      }
    }).catch((err) => {
      console.error("Admin redirect auth error:", err);
      setLoginError(err.message || "Failed to sign in with Google redirect.");
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email || null);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadItems();
    loadCustomCodes();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const storeItems = await fetchStoreItems();
    setItems(storeItems);
    setLoading(false);
  };

  const loadCustomCodes = () => {
    try {
      const stored = localStorage.getItem('pensieve_custom_effects_code');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEffectsMap(parsed);
        if (parsed[selectedEffectId]) {
          setEditorCssCode(parsed[selectedEffectId].cssCode || '');
          setEditorJsCode(parsed[selectedEffectId].jsCode || '');
        }
      }
    } catch (err) {
      console.error('Failed to parse custom effect codes:', err);
    }
  };

  // Switch effect id in workspace
  useEffect(() => {
    if (effectsMap[selectedEffectId]) {
      setEditorCssCode(effectsMap[selectedEffectId].cssCode || '');
      setEditorJsCode(effectsMap[selectedEffectId].jsCode || '');
    } else {
      setEditorCssCode('');
      setEditorJsCode('');
    }
  }, [selectedEffectId, effectsMap]);

  const handleAdminGoogleSignIn = async () => {
    setLoginLoading(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = signInWithPopup(auth, provider);
      // Popup handler is cleaner in general
      const u = (await result).user;
      setUserEmail(u.email || null);
    } catch (err: any) {
      console.error("Admin Google login popup error:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirErr: any) {
          console.error("Admin Google login redirect error:", redirErr);
          setLoginError("Popup blocked.Fallback also failed.");
          setLoginLoading(false);
        }
      } else {
        setLoginError(err.message || "Failed to sign in.");
        setLoginLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    setCheckingAuth(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !effectId) return;

    await addStoreItem({
      name,
      type,
      description,
      price: Number(price),
      effectId,
      imageUrl: imageUrl || undefined
    });

    // Automatically seed an empty effect template for this new effect if not already exists
    try {
      const stored = localStorage.getItem('pensieve_custom_effects_code');
      const currentMap = stored ? JSON.parse(stored) : {};
      if (!currentMap[effectId]) {
        currentMap[effectId] = {
          cssCode: `/* Custom CSS template generated for ${name} */\n[data-active-effects~="${effectId}"] {\n  /* Your custom declarations here */\n}`,
          jsCode: ''
        };
        localStorage.setItem('pensieve_custom_effects_code', JSON.stringify(currentMap));
        setEffectsMap(currentMap);
      }
    } catch (err) {
      console.error(err);
    }

    // Reset form
    setName('');
    setDescription('');
    setEffectId('');
    setPrice(10);
    
    // Reload items
    loadItems();
  };

  // Save CSS code in workspace
  const handleSaveWorkspaceCode = () => {
    try {
      const stored = localStorage.getItem('pensieve_custom_effects_code');
      const currentMap = stored ? JSON.parse(stored) : {};
      currentMap[selectedEffectId] = {
        cssCode: editorCssCode,
        jsCode: editorJsCode
      };
      localStorage.setItem('pensieve_custom_effects_code', JSON.stringify(currentMap));
      setEffectsMap(currentMap);
      
      // Flash save notification
      setIsSavedNotify(true);
      setTimeout(() => setIsSavedNotify(false), 2500);

      // Dispatch event to notify theme application live
      window.dispatchEvent(new Event('app-settings-updated'));
    } catch (err) {
      console.error('Failed to save effect code:', err);
    }
  };

  const loadTemplateToWorkspace = (template: EffectTemplate) => {
    // Replace placeholder ID with current selectedEffectId
    const customizedCode = template.cssCode.replace(/your-effect-id/g, selectedEffectId);
    setEditorCssCode(customizedCode);
  };

  const handleCopyTemplateText = (text: string, index: number) => {
    const customizedCode = text.replace(/your-effect-id/g, selectedEffectId);
    navigator.clipboard.writeText(customizedCode).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const isConfigured = isStoreAppwriteConfigured();

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-neutral-400">
          <Lock className="w-4 h-4 text-primary animate-spin" /> Authenticating Workspace Admin...
        </div>
      </div>
    );
  }

  const allowedEmails = ['200ray.dark@gmail.com', '2003ray.dark@gmail.com', '2093ray.dark@gmail.com'];
  const isAuthorized = userEmail ? allowedEmails.includes(userEmail.toLowerCase()) : false;

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Neon Background Orbitals */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-900/10 blur-[130px] rounded-full" />
        
        <div className="w-full max-w-md relative z-10 space-y-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors group mx-auto font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Workspace</span>
          </button>

          <div className="bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-3xl rounded-[32px] p-8 md:p-10 shadow-2xl shadow-purple-950/20 space-y-8 text-center">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-white font-display tracking-tight">
                Admin Console
              </h1>
              <p className="text-neutral-400 text-xs font-sans max-w-[300px] mx-auto leading-relaxed">
                Connect your workspace administrator credentials to gain deep access to database tables, style registries, and active dynamic effect blocks.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] text-center font-mono">
                {loginError}
              </div>
            )}

            <button
              onClick={handleAdminGoogleSignIn}
              disabled={loginLoading}
              className="w-full py-4 bg-white text-black hover:bg-neutral-100 rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/40 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span className="text-sm">{loginLoading ? "Authorizing Security..." : "Sign in with Google"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Workspace Denied</h1>
        <p className="text-neutral-400 mb-8 max-w-md text-sm">
          Your account ({userEmail}) lacks root permission flags. This secure zone is only accessible to authorized engineers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 font-bold rounded-xl transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out / Switch Identity
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl transition hover:bg-neutral-100"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-neutral-100 p-6 font-sans relative overflow-x-hidden">
      {/* Decorative Radial Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-[10%] w-[350px] h-[350px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-2xl transition shadow-md active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono">ROOT SUITE</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SECURE
                </span>
              </div>
              <h1 className="text-3xl font-black font-display tracking-tight text-white flex items-center gap-2">
                Pensieve Central Command
              </h1>
              <p className="text-xs text-neutral-400 font-mono">Live synchronization, CSS/JS dynamic injection, and core effects engine.</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-red-400 font-semibold rounded-xl transition flex items-center gap-2 self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Session
          </button>
        </div>

        {/* Database Notice */}
        {!isConfigured && (
          <div className="bg-amber-500/5 border border-amber-500/15 text-amber-500 p-5 rounded-[24px] flex items-start gap-4 shadow-lg backdrop-blur-md">
            <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider">Storage Sync Bypass Active (Appwrite Off)</p>
              <p className="opacity-80 leading-relaxed">
                Appwrite database variables are currently empty. Store queries are running in standard offline persistence. Custom-injected effects CSS codes will be loaded and deployed via the browser's persistent LocalStorage system instantly.
              </p>
            </div>
          </div>
        )}

        {/* Form and Store Column Grid */}
        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* Add Item Form (2 Columns) */}
          <div className="lg:col-span-2 bg-[#0c0d14]/90 border border-neutral-800/80 rounded-[30px] p-6 shadow-xl h-fit">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-800/60">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Add Item to Catalog
              </h2>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Database entry</span>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Item Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 focus:bg-neutral-900/90 outline-none transition-colors" 
                  placeholder="e.g. Neon Search Glow" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none cursor-pointer transition-colors"
                  >
                    <option value="effect">Effect (UI)</option>
                    <option value="nametag">Name Tag</option>
                    <option value="theme">Theme</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Price (XP)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(Number(e.target.value))} 
                    required min={0}
                    className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none transition-colors" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Effect ID (CSS Selector Key)</span>
                  <span className="text-[9px] font-mono lowercase text-neutral-500">Unique slug</span>
                </label>
                <input 
                  type="text" 
                  value={effectId} 
                  onChange={e => setEffectId(e.target.value)} 
                  required
                  className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-purple-500/50 outline-none transition-colors" 
                  placeholder="e.g. search-neon" 
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  required
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none resize-none transition-colors" 
                  placeholder="Summarize visual impact of the effect..." 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Cover Image (Optional)</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="w-full bg-neutral-900 border border-neutral-800/80 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none transition-colors" 
                  placeholder="https://..." 
                />
              </div>

              <button 
                type="submit"
                disabled={!isConfigured}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {!isConfigured ? "Appwrite Binding Disabled" : "Add Store Item"}
              </button>
            </form>
          </div>

          {/* Current Store Items (3 Columns) */}
          <div className="lg:col-span-3 bg-[#0c0d14]/90 border border-neutral-800/80 rounded-[30px] p-6 shadow-xl flex flex-col h-[535px]">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-800/60">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Injected Catalog Status
              </h2>
              <button 
                onClick={loadItems}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition"
                title="Force refresh database query"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs font-mono">Querying active catalog collections...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20 opacity-50 text-xs font-mono">No items found in active collections. Add items on the left to initialize.</div>
              ) : (
                items.map(item => (
                  <div 
                    key={item.$id || item.effectId} 
                    onClick={() => setSelectedEffectId(item.effectId)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                      selectedEffectId === item.effectId 
                        ? 'border-purple-500 bg-purple-500/5 shadow-md shadow-purple-500/5' 
                        : 'border-neutral-800/70 bg-neutral-900/30 hover:border-neutral-700/80 hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-white">{item.name}</h3>
                          {selectedEffectId === item.effectId && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 inline-block mt-1">{item.type}</span>
                      </div>
                      <span className="text-[10px] font-black font-mono bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-sm">
                        {item.price} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{item.description}</p>
                    
                    <div className="text-[9px] font-mono text-neutral-500 flex items-center justify-between pt-2.5 mt-3 border-t border-neutral-800/50">
                      <span>ID: <code className="text-neutral-300 font-bold">{item.effectId}</code></span>
                      <span className="text-purple-400 hover:underline flex items-center gap-1 font-sans">
                        <Code className="w-3 h-3" /> Load in Workspace
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Live CSS Injection Workspace - STUNNING NEW MODULE */}
        <div className="border border-neutral-800/80 bg-[#0c0d14]/95 rounded-[36px] overflow-hidden shadow-2xl">
          <div className="bg-[#10111d] p-6 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                  <Code className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    Aura Code Workspace & Injector
                  </h2>
                  <p className="text-xs text-neutral-400">Directly edit the dynamic CSS styles applied to any active effect in real-time.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
                Active ID: <span className="text-purple-400 font-bold">{selectedEffectId}</span>
              </div>
              <button
                onClick={handleSaveWorkspaceCode}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Save className="w-4 h-4" /> Save Effect Code
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12">
            
            {/* Left Col: Code Editor Panel (7 Cols) */}
            <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Live Custom CSS Code</span>
                  <div className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const comments = `/* ${selectedEffectId.toUpperCase()} STYLE BLOCK */\n[data-active-effects~="${selectedEffectId}"] {\n  \n}`;
                    setEditorCssCode(comments);
                  }}
                  className="text-[10px] font-mono text-neutral-500 hover:text-purple-400 transition"
                >
                  [Reset to Blank template]
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950 font-mono text-xs text-purple-300">
                <div className="absolute top-3 left-4 text-[10px] font-mono text-neutral-600 select-none space-y-1">
                  <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div><div>9</div><div>10</div><div>11</div><div>12</div><div>13</div><div>14</div>
                </div>
                <textarea
                  value={editorCssCode}
                  onChange={e => setEditorCssCode(e.target.value)}
                  placeholder={`/* Enter custom CSS classes to inject for effect: ${selectedEffectId} */\n[data-active-effects~="${selectedEffectId}"] {\n  /* e.g. border-color: red !important; */\n}`}
                  rows={13}
                  className="w-full bg-transparent pl-12 pr-4 py-3 outline-none resize-y text-xs text-neutral-200 leading-relaxed font-mono focus:text-white"
                  style={{ minHeight: '280px' }}
                />
              </div>

              {/* Status banner */}
              <AnimatePresence>
                {isSavedNotify && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 animate-bounce" />
                    <span>Styles injected successfully! Equipped variants will render with this code immediately.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 bg-neutral-900/50 border border-neutral-800/70 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  <strong>Selector Guideline:</strong> Use attribute selectors like <code className="text-purple-300 bg-neutral-950 px-1 rounded font-mono font-bold">[data-active-effects~="{selectedEffectId}"]</code> to target items equipped with this effect. This will apply styles cleanly to your dashboard without crashing or layout collisions.
                </p>
              </div>
            </div>

            {/* Right Col: Category Selector & Ready-to-use templates (5 Cols) */}
            <div className="lg:col-span-5 p-6 bg-[#0b0c13] flex flex-col h-[525px]">
              <div className="mb-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-purple-400" />
                  Category Aura Generator Templates
                </h3>
                <p className="text-[11px] text-neutral-500">Pick a category to browse templates, then click to load or copy template structure.</p>
              </div>

              {/* Category selector capsules */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-[10px] font-bold text-center uppercase tracking-wide transition-all ${
                      activeCategory === cat.id
                        ? 'bg-purple-600/10 text-purple-400 border-purple-500/30'
                        : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {cat.id.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Current category detail */}
              <div className="mb-4 bg-neutral-900/40 border border-neutral-800/50 p-3 rounded-xl">
                <div className="text-[10px] font-black uppercase text-purple-400">
                  {CATEGORIES.find(c => c.id === activeCategory)?.name}
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal mt-1">
                  {CATEGORIES.find(c => c.id === activeCategory)?.desc}
                </p>
              </div>

              {/* Templates Scroller */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                {TEMPLATES[activeCategory]?.map((tpl, idx) => (
                  <div key={tpl.id} className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800/80 space-y-3 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-white">{tpl.title}</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">{tpl.description}</p>
                      </div>
                    </div>

                    <pre className="p-3 bg-[#0c0d12] border border-neutral-900 rounded-lg text-[9px] text-neutral-400 overflow-x-auto max-h-[100px] font-mono whitespace-pre custom-scrollbar">
                      {tpl.cssCode.replace(/your-effect-id/g, selectedEffectId)}
                    </pre>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => loadTemplateToWorkspace(tpl)}
                        className="flex-1 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-[10px] text-purple-400 font-bold uppercase tracking-wider rounded-lg transition border border-purple-500/10 active:scale-95"
                      >
                        Load Into Editor
                      </button>
                      <button
                        onClick={() => handleCopyTemplateText(tpl.cssCode, idx)}
                        className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition text-[10px] flex items-center gap-1 border border-neutral-800"
                        title="Copy template code"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
