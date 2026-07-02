import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreItem, fetchStoreItems, addStoreItem, isStoreAppwriteConfigured } from '../services/storeService';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, ShieldAlert, Package, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

  useEffect(() => {
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

  const isAuthorized = userEmail?.toLowerCase() === '2093ray.dark@gmail.com' || userEmail?.toLowerCase() === '2003ray.dark@gmail.com';
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-text-heading mb-2">Access Denied</h1>
        <p className="text-foreground/60 mb-8 max-w-md">
          You do not have permission to view the Admin Dashboard. This area is restricted to authorized personnel.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl transition hover:opacity-90"
        >
          Return to Workspace
        </button>
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
