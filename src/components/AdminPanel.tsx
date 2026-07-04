import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreItem, fetchStoreItems, addStoreItem, isStoreAppwriteConfigured } from '../services/storeService';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, ShieldAlert, Package, Lock, Chrome, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';

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
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const storeItems = await fetchStoreItems();
    setItems(storeItems);
    setLoading(false);
  };

  const handleAdminGoogleSignIn = async () => {
    setLoginLoading(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result) {
        setUserEmail(result.user.email || null);
      }
    } catch (err: any) {
      console.error("Admin Google login popup error:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirErr: any) {
          console.error("Admin Google login redirect error:", redirErr);
          setLoginError("Popup was blocked/closed, and fallback redirect also failed. Please allow popups or try another browser.");
          setLoginLoading(false);
        }
      } else {
        setLoginError(err.message || "Failed to sign in with Google.");
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

    // Reset form
    setName('');
    setDescription('');
    setEffectId('');
    setPrice(10);
    
    // Reload items
    loadItems();
  };

  const isConfigured = isStoreAppwriteConfigured();

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground/50">
          <Lock className="w-4 h-4" /> Authenticating Admin...
        </div>
      </div>
    );
  }

  const allowedEmails = ['200ray.dark@gmail.com', '2003ray.dark@gmail.com', '2093ray.dark@gmail.com'];
  const isAuthorized = userEmail ? allowedEmails.includes(userEmail.toLowerCase()) : false;

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Gradient Background Elements */}
        <div className="absolute inset-0 bg-white" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-100/50 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[150px] rounded-full animate-[pulse_8s_infinite_alternate]" />
        
        <div className="w-full max-w-md relative z-10 space-y-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest">Back to Workspace</span>
          </button>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-3xl border border-black/[0.05] rounded-[32px] p-8 md:p-10 shadow-2xl shadow-purple-200/50 space-y-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-neutral-900 font-display tracking-tight">
                Admin Portal
              </h1>
              <p className="text-neutral-500 text-sm font-sans max-w-[280px] mx-auto leading-relaxed">
                Please sign in with Google to access the administrator dashboard. Only authorized administrators are allowed.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-[11px] text-center font-mono">
                {loginError}
              </div>
            )}

            <button
              onClick={handleAdminGoogleSignIn}
              disabled={loginLoading}
              className="w-full py-4 bg-[#0c0d12] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span className="text-sm">{loginLoading ? "Signing in..." : "Sign in with Google"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-text-heading mb-2">Access Denied</h1>
        <p className="text-foreground/60 mb-8 max-w-md">
          Your account ({userEmail}) does not have permission to view the Admin Dashboard. This area is restricted to authorized personnel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 bg-foreground text-background font-bold rounded-xl transition hover:opacity-90 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out / Switch Account
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-foreground/5 text-foreground font-bold rounded-xl transition hover:bg-foreground/10"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-foreground/5 rounded-xl transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-text-heading">Admin Dashboard</h1>
              <p className="text-sm text-foreground/60">Manage Pensieve Store & Effects</p>
            </div>
          </div>
        </div>

        {!isConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Appwrite Not Configured</p>
              <p className="opacity-80">Store operations will use local mock data. Please configure your Appwrite Store variables in .env</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Add Item Form */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Store Item
            </h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none" 
                  placeholder="e.g. Neon Search Glow" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1">Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none"
                  >
                    <option value="effect">Effect (UI)</option>
                    <option value="nametag">Name Tag</option>
                    <option value="theme">Theme</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1">Price (XP)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(Number(e.target.value))} 
                    required min={0}
                    className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1">Effect ID (CSS Var / System Key)</label>
                <input 
                  type="text" 
                  value={effectId} 
                  onChange={e => setEffectId(e.target.value)} 
                  required
                  className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm font-mono focus:border-primary/50 outline-none" 
                  placeholder="e.g. search-neon" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  required
                  rows={3}
                  className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none resize-none" 
                  placeholder="Short description of the effect..." 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1">Image URL (Optional)</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="w-full bg-input-bg border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none" 
                  placeholder="https://..." 
                />
              </div>

              <button 
                type="submit"
                disabled={!isConfigured}
                className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item to Database
              </button>
            </form>
          </div>

          {/* Current Store Items */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Current Store Items
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 opacity-50 text-sm">Loading database...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-10 opacity-50 text-sm">No items in store.</div>
              ) : (
                items.map(item => (
                  <div key={item.$id} className="p-4 border border-border-subtle rounded-xl bg-foreground/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-text-heading">{item.name}</h3>
                        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">{item.type}</span>
                      </div>
                      <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {item.price} XP
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70">{item.description}</p>
                    <div className="text-[10px] font-mono opacity-50 flex items-center gap-2 pt-2 border-t border-border-subtle/30">
                      ID: {item.effectId}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
