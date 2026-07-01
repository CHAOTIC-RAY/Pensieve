/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, Palette, Brain, Filter, Check, Star, RefreshCw, Pin,
  Tv, Music, Twitter, Utensils, FileText, ChevronDown, Settings2, Aperture, Camera,
  BookOpen, ExternalLink, LayoutGrid, List, Columns, ArrowUpDown, SlidersHorizontal, Quote, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from './lib/firebase';
import { MindItem, MindItemType } from './types';
import LandingPage from './components/LandingPage';
import Logo from './components/Logo';
import Omnibar from './components/Omnibar';
import { useSearch } from './hooks/useSearch';
import MasonryGrid from './components/MasonryGrid';
import DetailPanel from './components/DetailPanel';
import SerendipityView from './components/SerendipityView';
import MindCard from './components/MindCard';
import { 
  isLocalAiEnabled, 
  getSelectedLocalModelId, 
  getSelectedVisionModelId,
  setLocalAiEnabled as setLocalAiEnabledUtil, 
  setSelectedLocalModelId as setSelectedLocalModelIdUtil,
  setSelectedVisionModelId as setSelectedVisionModelIdUtil,
  hasWebGpu,
  organizeAndTagItemLocally,
  getAiStrategy,
  setAiStrategy,
  AiStrategy
} from './services/localAiBackendLitert';
import { subscribeToBootstrap, bootstrapLocalAiOnLaunch } from './services/localAiBootstrap';
import { fetchModelManifest, ModelManifestEntry } from './services/litertModelResolver';
import { 
  UserSettings, loadSettings, saveSettings, applyTheme as applyStudioTheme 
} from './services/themeStudio';

import SettingsModal from './components/SettingsModal';
import { useAchievements } from './hooks/useAchievements';
import AchievementsModal from './components/AchievementsModal';
import AchievementToast from './components/AchievementToast';

const COLOR_FILTERS = [
  { name: 'red', class: 'bg-rose-500 border-rose-600' },
  { name: 'orange', class: 'bg-orange-500 border-orange-600' },
  { name: 'yellow', class: 'bg-amber-400 border-amber-500' },
  { name: 'green', class: 'bg-emerald-500 border-emerald-600' },
  { name: 'blue', class: 'bg-blue-500 border-blue-600' },
  { name: 'purple', class: 'bg-purple-500 border-purple-600' },
  { name: 'pink', class: 'bg-pink-400 border-pink-500' },
  { name: 'black', class: 'bg-neutral-900 border-black' },
  { name: 'white', class: 'bg-white border-neutral-300' },
  { name: 'grey', class: 'bg-neutral-400 border-neutral-500' }
];

function matchesTimeFilter(createdAtStr: string, query: string): boolean {
  const queryLower = query.toLowerCase().trim();
  const createdAt = new Date(createdAtStr);
  const now = new Date();
  
  // Start of today
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  // Start of yesterday
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  // Start of 7 days ago
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Start of 14 days ago
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  if (queryLower === 'today') {
    return createdAt >= todayStart;
  }
  if (queryLower === 'yesterday') {
    return createdAt >= yesterdayStart && createdAt < todayStart;
  }
  if (queryLower === 'this week' || queryLower === 'recent') {
    return createdAt >= sevenDaysAgo;
  }
  if (queryLower === 'last week') {
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  }
  if (queryLower === 'this month') {
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }
  if (queryLower === 'last month') {
    let targetMonth = now.getMonth() - 1;
    let targetYear = now.getFullYear();
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
    return createdAt.getMonth() === targetMonth && createdAt.getFullYear() === targetYear;
  }
  
  // Check for calendar month names
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthIdx = months.findIndex(m => queryLower.includes(m) || queryLower.includes(m.substring(0, 3)));
  if (monthIdx !== -1) {
    return createdAt.getMonth() === monthIdx;
  }
  
  return false;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [items, setItems] = useState<MindItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all'); // 'all', 'favorites', MindItemType
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [vibeFilter, setVibeFilter] = useState<{ type: 'color' | 'tag'; value: string; label: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<MindItem | null>(null);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Layout & Sorting (Rearranging) States
  const [viewType, setViewType] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'type'>('newest');

  // Local AI (LiteRT / WebGPU) States
  const [aiStrategy, setAiStrategyState] = useState<AiStrategy>(getAiStrategy());

  // Achievements
  const { achievements, activeToast, dismissToast, triggerSerendipity } = useAchievements(items);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [localAiEnabled, setLocalAiEnabledState] = useState(isLocalAiEnabled());
  const [localModelId, setLocalModelIdState] = useState(getSelectedLocalModelId());
  const [localVisionModelId, setLocalVisionModelIdState] = useState(getSelectedVisionModelId());
  const [bootstrapState, setBootstrapState] = useState({ phase: 'idle', progress: 0, message: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"intelligence" | "sync" | "db" | "ui" | "profile">("ui");
  const [availableModels, setAvailableModels] = useState<ModelManifestEntry[]>([]);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // User Profile States
  const [profileName, setProfileName] = useState(() => localStorage.getItem('mymind_profile_name') || 'Ray Dark');
  const [profileGradient, setProfileGradient] = useState(() => localStorage.getItem('mymind_profile_avatar_gradient') || 'from-orange-200 to-rose-200');

  // Persistent Theme Studio settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const settings = loadSettings();
    applyStudioTheme(settings);
    return settings;
  });

  const handleUpdateSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    saveSettings(settings);
  };

  useEffect(() => {
    const settings = loadSettings();
    applyStudioTheme(settings);

    const handleSettingsUpdated = () => {
      const newSettings = loadSettings();
      // Only update if settings have changed externally
      setUserSettings(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newSettings)) return prev;
        return newSettings;
      });
      setProfileName(localStorage.getItem('mymind_profile_name') || 'Ray Dark');
      setProfileGradient(localStorage.getItem('mymind_profile_avatar_gradient') || 'from-orange-200 to-rose-200');
    };
    window.addEventListener('app-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('app-settings-updated', handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Local AI Bootstrap & manifest loading
  useEffect(() => {
    fetchModelManifest().then(models => {
      setAvailableModels(models);
    });

    const unsubscribe = subscribeToBootstrap((state) => {
      setBootstrapState(state);
    });

    if (isLocalAiEnabled()) {
      bootstrapLocalAiOnLaunch();
    }

    return () => unsubscribe();
  }, []);

  // Real-time Firestore snapshot listener
  useEffect(() => {
    setIsSyncing(true);
    const q = query(collection(db, 'mind-items'), orderBy('createdAt', 'desc'));
    
    // Load local items initially
    const localItems = JSON.parse(localStorage.getItem('mymind_local_items') || '[]');
    if (localItems.length > 0) {
      setItems(localItems);
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsList: MindItem[] = [];
      snapshot.forEach((doc) => {
        docsList.push({ id: doc.id, ...doc.data() } as MindItem);
      });
      
      // Merge with local items that haven't been synced (simple approach: prefer Firestore, but keep local items if they don't exist in Firestore)
      const firestoreIds = new Set(docsList.map(i => i.id));
      const localOnly = localItems.filter((item: MindItem) => !firestoreIds.has(item.id));
      const mergedList = [...localOnly, ...docsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setItems(mergedList);
      localStorage.setItem('mymind_local_items', JSON.stringify(mergedList));
      setIsSyncing(false);

      // Keep the open detail panel updated if the selected item changes
      if (selectedItem) {
        const updated = mergedList.find(i => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setIsSyncing(false);
      // Fallback for permissions error: disable syncing UI
      if (String(error).includes('Missing or insufficient permissions')) {
         console.warn("Firestore rules not deployed yet or missing permissions. Local fallback active.");
      }
    });

    return () => unsubscribe();
  }, [selectedItem]);

  const { results: searchedItems } = useSearch(items, searchQuery);

  // Filter items based on search, selected categories, and vibes
  const filteredItems = searchedItems.filter(item => {
    // 1. Category Filter
    if (activeCategory === 'favorites' && !item.isFavorite) return false;
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && item.type !== activeCategory) return false;

    // 2. Color Filter
    if (activeColorFilter && item.dominantColor !== activeColorFilter) return false;

    // 3. Vibe Filter
    if (vibeFilter) {
      if (vibeFilter.type === 'color' && item.dominantColor !== vibeFilter.value) return false;
      if (vibeFilter.type === 'tag' && !item.tags?.includes(vibeFilter.value)) return false;
    }

    return true;
  });

  // Sort items based on the active sort option
  const sortedItems = searchQuery.trim() 
    ? filteredItems // If searching, keep Fuse.js ranking
    : [...filteredItems].sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'alphabetical') {
          const titleA = a.title || a.content || '';
          const titleB = b.title || b.content || '';
          return titleA.localeCompare(titleB);
        }
        if (sortBy === 'type') {
          return a.type.localeCompare(b.type);
        }
        return 0;
      });

  // Helper to safely update an item with Firestore / LocalStorage fallback
  const safeUpdateItem = async (itemId: string, updates: Partial<MindItem>) => {
    try {
      await updateDoc(doc(db, 'mind-items', itemId), updates);
    } catch (e) {
      console.warn("Firestore update failed, syncing to local storage fallback:", e);
    }
    
    setItems(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, ...updates } : item);
      localStorage.setItem('mymind_local_items', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle Item Creation with Multi-Stage Background AI parsing
  const handleItemCreated = async (newItem: Omit<MindItem, 'id' | 'createdAt'>): Promise<string> => {
    // Stage 1: Fast client-side write with "analyzing" state
    const docData = {
      ...newItem,
      createdAt: new Date().toISOString(),
      analyzing: true,
      tags: newItem.tags || []
    };

    let createdId = Date.now().toString(); // temporary local ID fallback
    let saveFailed = false;
    try {
      const docRef = await addDoc(collection(db, 'mind-items'), docData);
      createdId = docRef.id;
    } catch (error) {
      console.error("Firestore addDoc error:", error);
      saveFailed = true;
    }

    const fallbackItem = { ...docData, id: createdId } as MindItem;
    // Always put it in local state immediately so it renders without delay
    setItems(prev => {
      const updated = [fallbackItem, ...prev];
      localStorage.setItem('mymind_local_items', JSON.stringify(updated));
      return updated;
    });

    // Stage 2: Background processing on server
    // We run this asynchronously so the card is saved instantly in UI with a thinking skeleton!
    (async () => {
      try {
        let processedItem = { ...docData, id: createdId };

        // 2A. If it's a URL (link or article), scrape metadata first on the server
        if ((newItem.type === 'link' || newItem.type === 'article') && newItem.url) {
          const scrapeResponse = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: newItem.url })
          });
          
          if (scrapeResponse.ok) {
            const scraped = await scrapeResponse.json();
            if (scraped.success) {
              processedItem.title = scraped.title || processedItem.title;
              processedItem.content = scraped.description || '';
              processedItem.imageUrl = scraped.imageUrl || '';
              processedItem.siteName = scraped.siteName || '';
              processedItem.favicon = scraped.favicon || '';
              processedItem.bodyText = scraped.bodyText || ''; // Sent to Gemini
              
              // Partially update local Firestore and state for immediate visual meta-filling
              await safeUpdateItem(createdId, {
                title: processedItem.title,
                content: processedItem.content,
                imageUrl: processedItem.imageUrl,
                siteName: processedItem.siteName,
                favicon: processedItem.favicon
              });
            }
          }
        }

        // 2B. Perform local WebGPU AI or Cloud Gemini analysis & Tagging
        if (isLocalAiEnabled()) {
          console.log('[Pensieve Local AI] Initiating on-device WebGPU model for metadata categorization & tagging...');
          try {
            const aiResult = await organizeAndTagItemLocally(processedItem);
            if (aiResult && aiResult.success) {
              const finalDoc = {
                title: aiResult.title || processedItem.title,
                content: aiResult.content || processedItem.content,
                type: aiResult.category || processedItem.type, // Dynamic item category updates
                tags: Array.from(new Set([...(docData.tags), ...(aiResult.tags || [])])),
                aiTags: aiResult.tags || [],
                manualTags: docData.manualTags || [],
                aiSummary: aiResult.aiSummary || 'Organized and tagged locally on your device.',
                dominantColor: aiResult.dominantColor || 'grey',
                analyzing: false
              } as any;

              if (aiResult.author) finalDoc.author = aiResult.author;
              if (aiResult.readingTime) finalDoc.readingTime = aiResult.readingTime;
              if (aiResult.siteName) finalDoc.siteName = aiResult.siteName;

              await safeUpdateItem(createdId, finalDoc);
              return; // Bypasses cloud analysis entirely
            }
          } catch (localErr) {
            console.warn('[Pensieve Local AI] Local model failed to classify. Falling back to Gemini API...', localErr);
          }
        }

        const analyzeResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: processedItem })
        });

        if (analyzeResponse.ok) {
          const aiResult = await analyzeResponse.json();
          if (aiResult.success) {
            // Merge AI outcomes and clear analyzing state
            const finalDoc = {
              title: aiResult.title || processedItem.title,
              content: aiResult.content || processedItem.content,
              type: aiResult.category || processedItem.type, // dynamic article reclassification!
              tags: Array.from(new Set([...(docData.tags), ...(aiResult.tags || [])])),
              aiTags: aiResult.tags || [],
              manualTags: docData.manualTags || [],
              aiSummary: aiResult.aiSummary || '',
              dominantColor: aiResult.dominantColor || 'grey',
              analyzing: false
            } as any;

            if (aiResult.author) finalDoc.author = aiResult.author;
            if (aiResult.readingTime) finalDoc.readingTime = aiResult.readingTime;
            if (aiResult.siteName) finalDoc.siteName = aiResult.siteName;

            await safeUpdateItem(createdId, finalDoc);
          } else {
            throw new Error("AI analysis failed on server");
          }
        } else {
          throw new Error("Analysis request failed");
        }
      } catch (error) {
        console.error("Background indexing failed:", error);
        // Fallback: clear loading state safely
        await safeUpdateItem(createdId, { 
          analyzing: false,
          aiSummary: 'Saved locally (offline indexing)'
        });
      }
    })();

    return createdId;
  };

  // Toggle favorite / pin
  const handleToggleFavorite = async (item: MindItem) => {
    const newIsFavorite = !item.isFavorite;
    try {
      await updateDoc(doc(db, 'mind-items', item.id), {
        isFavorite: newIsFavorite
      });
    } catch (e) {
      console.error(e);
      // Local fallback
      setItems(prev => {
        const updated = prev.map(i => i.id === item.id ? { ...i, isFavorite: newIsFavorite } : i);
        localStorage.setItem('mymind_local_items', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Toggle Top of Mind focus pin
  const handleToggleTopMind = async (item: MindItem) => {
    const newIsTopMind = !item.isTopMind;
    try {
      await updateDoc(doc(db, 'mind-items', item.id), {
        isTopMind: newIsTopMind
      });
    } catch (e) {
      console.error(e);
      // Local fallback
      setItems(prev => {
        const updated = prev.map(i => i.id === item.id ? { ...i, isTopMind: newIsTopMind } : i);
        localStorage.setItem('mymind_local_items', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Delete item
  const handleDeleteItem = async (item: MindItem) => {
    try {
      await deleteDoc(doc(db, 'mind-items', item.id));
    } catch (e) {
      console.error(e);
      // Local fallback
      setItems(prev => {
        const updated = prev.filter(i => i.id !== item.id);
        localStorage.setItem('mymind_local_items', JSON.stringify(updated));
        return updated;
      });
    }
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
  };

  // Update item (used for inline edits in inspector or checklist toggles)
  const handleUpdateItem = async (updatedItem: MindItem) => {
    try {
      const { id, ...data } = updatedItem;
      await updateDoc(doc(db, 'mind-items', id), data as any);
    } catch (e) {
      console.error(e);
      // Local fallback
      setItems(prev => {
        const updated = prev.map(i => i.id === updatedItem.id ? { ...i, ...updatedItem } : i);
        localStorage.setItem('mymind_local_items', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Interactive Checklist toggling helper
  const handleUpdateChecklist = async (item: MindItem, updatedContent: string) => {
    try {
      await updateDoc(doc(db, 'mind-items', item.id), {
        content: updatedContent
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Logo className="w-12 h-12" />
      </div>
    );
  }

  return user ? (
    <div id="mymind-workspace" className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background transition-colors duration-300 relative">
        {/* Editorial Ambient Spot Blurs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 dark:opacity-10">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#c084fc] blur-[130px]" />
          <div className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full bg-[#818cf8] blur-[150px]" />
        </div>

      {/* Compact Mobile-Only Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card-bg/50 backdrop-blur-md border-b border-border-subtle/40 shrink-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span className="text-sm font-semibold tracking-tight font-display text-foreground">Pensieve</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Simple avatar profile */}
          <div 
            onClick={() => {
              setSettingsTab('profile');
              setIsSettingsOpen(true);
            }}
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${profileGradient} border border-white/20 dark:border-white/5 ring-2 ring-black/[0.03] dark:ring-white/[0.03] shadow-sm cursor-pointer flex items-center justify-center text-[10px] font-bold text-neutral-800`}
            title={profileName}
          >
            {profileName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        localAiEnabled={localAiEnabled}
        setLocalAiEnabledState={setLocalAiEnabledState}
        localModelId={localModelId}
        setLocalModelIdState={setLocalModelIdState}
        localVisionModelId={localVisionModelId}
        setLocalVisionModelIdState={setLocalVisionModelIdState}
        bootstrapState={bootstrapState}
        availableModels={availableModels}
        sidebarPosition={sidebarPosition}
        setSidebarPosition={setSidebarPosition}
        userSettings={userSettings}
        onUpdateSettings={handleUpdateSettings}
        items={items}
        aiStrategy={aiStrategy}
        setAiStrategyState={setAiStrategyState}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
      />
      
      <AchievementToast 
        achievement={activeToast} 
        onDismiss={dismissToast} 
      />

      {/* Workspace Container */}
      <div className={`flex-1 flex w-full relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Floating Logo - Top Left */}
        <div className="hidden md:flex flex-col items-center fixed top-6 left-6 z-40 select-none pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center pointer-events-auto cursor-pointer"
                 onClick={() => { setActiveCategory('all'); setActiveColorFilter(null); setIsSettingsOpen(false); }}>
              <Logo className="w-full h-full" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-foreground/45 font-display uppercase [writing-mode:vertical-lr] rotate-180 py-1 select-none">
              Pensieve
            </span>
          </div>
        </div>

        {/* Floating Navigation - Bottom Left */}
        <div className="hidden md:flex flex-col items-center gap-3 fixed bottom-6 left-6 z-40 select-none">
          {[
            { id: 'all', label: 'All Saved', icon: Aperture },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'note', label: 'Notes', icon: BookOpen },
            { id: 'link', label: 'Bookmarks', icon: ExternalLink }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && !isSettingsOpen;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveColorFilter(null);
                  setIsSettingsOpen(false);
                }}
                title={cat.label}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
                  isActive 
                    ? 'bg-primary/20 border-primary/30 text-primary' 
                    : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current text-primary' : ''}`} />
              </button>
            );
          })}
          
          <div className="w-6 h-[1px] bg-border-subtle my-1" />

          {/* Achievements Button */}
          <button
            onClick={() => setIsAchievementsOpen(true)}
            title="Milestones"
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
              isAchievementsOpen 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-amber-500/10 hover:text-amber-500'
            }`}
          >
            <Trophy className={`w-5 h-5 ${isAchievementsOpen ? 'fill-current text-amber-500' : ''}`} />
          </button>
          
          {/* Settings / Preferences Button */}
          <button
            onClick={() => {
              setSettingsTab('ui');
              setIsSettingsOpen(!isSettingsOpen);
            }}
            title="Preferences"
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
              isSettingsOpen 
                ? 'bg-primary/20 border-primary/30 text-primary' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Status & Profile - Top Right */}
        <div className="hidden md:flex flex-row items-center gap-4 fixed top-6 right-6 z-40 select-none">
          {/* Local AI Status Indicator */}
          <button 
            id="local-ai-toggle-btn"
            onClick={() => {
              setSettingsTab('intelligence');
              setIsSettingsOpen(true);
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
              localAiEnabled 
                ? bootstrapState.phase === 'ready'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  : bootstrapState.phase === 'downloading'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 animate-pulse'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/20'
                : 'bg-foreground/[0.02] border-foreground/10 text-foreground/60 hover:bg-foreground/10 hover:text-foreground'
            }`}
            title={
              localAiEnabled 
                ? bootstrapState.phase === 'ready'
                  ? 'Local AI: Active'
                  : bootstrapState.phase === 'downloading'
                    ? `Warming... ${Math.round(bootstrapState.progress * 100)}%`
                    : 'Local AI: Loading'
                : 'Local AI: Off (Configure in settings)'
            }
          >
            <Brain className={`w-5 h-5 ${bootstrapState.phase === 'downloading' ? 'animate-bounce' : ''}`} />
          </button>

          {/* User Profile avatar */}
          <div className="group relative flex items-center justify-center">
            <div 
              onClick={() => {
                setSettingsTab('profile');
                setIsSettingsOpen(true);
              }}
              className={`w-11 h-11 rounded-full bg-gradient-to-tr ${profileGradient} border border-white/20 dark:border-white/5 ring-4 ring-black/[0.03] dark:ring-white/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center text-xs font-bold text-neutral-800`}
            >
               {profileName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </div>
            <div className="absolute top-14 right-0 hidden group-hover:flex flex-col bg-card-bg/95 backdrop-blur-md border border-border-subtle p-3 rounded-2xl shadow-premium z-50 pointer-events-none min-w-[200px]">
              <span className="text-sm font-semibold text-foreground truncate">{profileName}</span>
              <span className="text-[10px] font-mono text-foreground/50 mt-1">Personal Account</span>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <main className={`flex-1 flex flex-col items-center w-full pt-4 md:pt-8 pb-20 md:pb-8 h-[calc(100vh-52px)] md:h-screen overflow-y-auto overflow-x-hidden relative transition-all duration-300 ${
          sidebarPosition === 'left' ? 'md:pl-24 md:pr-8' : 'md:pr-24 md:pl-8'
        }`}>
          
          {/* Centered Editorial Greeting & Focus Title */}
          <div className="text-center mt-2 md:mt-24 mb-2 md:mb-6 px-4 max-w-xl mx-auto space-y-0.5 md:space-y-1.5 select-none pointer-events-none shrink-0">
            <h1 className="text-lg md:text-5xl font-bold tracking-tight text-foreground font-display transition-colors duration-300 leading-tight">
              What are you remembering today?
            </h1>
            <p className="text-[10px] md:text-base text-foreground/45 font-sans transition-colors duration-300">
              Search your private workspace or type to save instantly
            </p>
          </div>

          {/* Floating omnibar and search panel */}
          <Omnibar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onItemCreated={handleItemCreated}
            onTriggerSerendipity={() => {
              triggerSerendipity();
              setIsSerendipityOpen(true);
            }}
            localAiEnabled={localAiEnabled}
          />

        {/* Filter, Organise, and View Toolbar */}
        <div className="w-full max-w-4xl px-6 md:px-4 mt-2 md:mt-6 space-y-2 md:space-y-4">
          
          {/* Category / Content Type Filter Tags */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] md:text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold">
              Filter by Type:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full px-1 py-1.5 md:py-2.5">
              {[
                { id: 'all', label: 'All', icon: Aperture, count: items.length },
                { id: 'favorites', label: 'Favorites', icon: Heart, count: items.filter(i => i.isFavorite).length },
                { id: 'note', label: 'Notes', icon: BookOpen, count: items.filter(i => i.type === 'note').length },
                { id: 'link', label: 'Bookmarks', icon: ExternalLink, count: items.filter(i => i.type === 'link').length },
                { id: 'image', label: 'Images', icon: Camera, count: items.filter(i => i.type === 'image').length },
                { id: 'quote', label: 'Quotes', icon: Quote, count: items.filter(i => i.type === 'quote').length },
                { id: 'video', label: 'Videos', icon: Tv, count: items.filter(i => i.type === 'video').length },
                { id: 'music', label: 'Music', icon: Music, count: items.filter(i => i.type === 'music').length },
                { id: 'tweet', label: 'Tweets', icon: Twitter, count: items.filter(i => i.type === 'tweet').length },
                { id: 'article', label: 'Articles', icon: FileText, count: items.filter(i => i.type === 'article').length },
                { id: 'recipe', label: 'Recipes', icon: Utensils, count: items.filter(i => i.type === 'recipe').length },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                
                // Keep 'all' and 'favorites' always visible. Hide others if they have 0 count to avoid clutter.
                if (cat.count === 0 && cat.id !== 'all' && cat.id !== 'favorites') return null;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveColorFilter(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border shrink-0 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm scale-105 font-semibold'
                        : 'bg-card-bg border-border-subtle text-foreground/75 hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-current' : ''}`} />
                    <span>{cat.label}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-foreground/5 text-foreground/50'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color filter rail */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full px-1 py-2">
            <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter by Color:
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {COLOR_FILTERS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => {
                    if (activeColorFilter === col.name) {
                      setActiveColorFilter(null);
                    } else {
                      setActiveColorFilter(col.name);
                    }
                  }}
                  title={`Filter for items matching ${col.name}`}
                  className={`w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition flex items-center justify-center relative ${col.class} ${
                    activeColorFilter === col.name ? 'scale-115 ring-2 ring-primary/40 border-primary' : 'border-border-subtle opacity-80 hover:opacity-100'
                  }`}
                >
                  {activeColorFilter === col.name && (
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${col.name === 'white' || col.name === 'yellow' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
              {activeColorFilter && (
                <button
                  onClick={() => setActiveColorFilter(null)}
                  className="text-[10px] font-sans font-bold text-primary hover:underline ml-2 uppercase tracking-tight"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Organize & View Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle/50">
            {/* Sort/Rearrange dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" /> Organize:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card-bg border border-border-subtle hover:border-foreground/20 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none cursor-pointer transition"
              >
                <option value="newest">Rearrange: Newest First</option>
                <option value="oldest">Rearrange: Oldest First</option>
                <option value="alphabetical">Rearrange: Alphabetical (A-Z)</option>
                <option value="type">Rearrange: Group by Type</option>
              </select>
            </div>

            {/* View Type selection */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Layout:
              </span>
              <div className="flex bg-card-bg/50 border border-border-subtle p-0.5 rounded-xl gap-0.5 shadow-sm">
                <button
                  onClick={() => setViewType('grid')}
                  title="Masonry Grid View"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewType === 'grid'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewType('list')}
                  title="Elegant List View"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewType === 'list'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewType('kanban')}
                  title="Kanban Board View"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewType === 'kanban'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Same Vibe Active Banner */}
        {vibeFilter && (
          <div className="w-full max-w-4xl px-6 md:px-4 mt-6">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4.5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-600/10" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-800 font-display">Active Moodboard Vibe: "{vibeFilter.label}"</span>
                  <span className="text-[10px] text-neutral-500 font-sans">Displaying items sharing this visual aesthetic or concept tag.</span>
                </div>
              </div>
              <button
                onClick={() => setVibeFilter(null)}
                className="text-xs font-sans font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 hover:border-indigo-300 px-3 py-1 rounded-xl transition"
              >
                Clear Vibe
              </button>
            </div>
          </div>
        )}

        {/* Top of Mind Pinned Showcase Section */}
        {items.some(i => i.isTopMind) && (
          <div className="w-full max-w-4xl px-6 md:px-4 mt-6">
            <div className="bg-amber-50/45 border border-amber-200/50 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-800 font-display uppercase tracking-tight">Top of Mind</span>
                    <span className="text-[10px] text-neutral-400 font-mono">Your current focus, core ideas & projects</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-100/50 px-2.5 py-0.5 rounded-full">
                  {items.filter(i => i.isTopMind).length} item{items.filter(i => i.isTopMind).length === 1 ? '' : 's'} pinned
                </span>
              </div>
              
              {/* Horizontal scroll container of small cards */}
              <div className="flex gap-3 overflow-x-auto pb-1.5 no-scrollbar snap-x scroll-smooth">
                {items.filter(i => i.isTopMind).map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex-shrink-0 w-64 bg-white border border-neutral-100/80 rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 relative group/topmind snap-start"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTopMind(item);
                      }}
                      title="Remove focus pin"
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover/topmind:opacity-100 transition p-1 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100"
                    >
                      <Pin className="w-3 h-3 fill-amber-500 text-amber-500 animate-pulse" />
                    </button>
                    
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">{item.type}</span>
                        {item.dominantColor && (
                          <div className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ backgroundColor: item.colorHex || (item.colorPalette && item.colorPalette[0]) || '#9e9e9e' }} />
                        )}
                      </div>
                      <h4 className="font-display font-semibold text-xs text-neutral-800 truncate leading-none">
                        {item.title}
                      </h4>
                      {item.content && (
                        <p className="text-[11px] text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Render Workspace Stream based on Active ViewType */}
        {viewType === 'grid' && (
          <MasonryGrid 
            items={sortedItems}
            onItemClick={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            onDeleteItem={handleDeleteItem}
            onUpdateChecklist={handleUpdateChecklist}
            onToggleTopMind={handleToggleTopMind}
          />
        )}

        {/* Elegant List View Stream */}
        {viewType === 'list' && (
          <div className="w-full max-w-2xl mx-auto px-6 md:px-8 mt-6 md:mt-12 pb-32 md:pb-24 space-y-6">
            {sortedItems.length === 0 ? (
              <div id="mymind-empty-state" className="w-full text-center py-20 bg-card-bg/40 border border-border-subtle rounded-3xl text-neutral-400 font-mono text-xs">
                No items match your active filters.
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {sortedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                  >
                    <MindCard
                      item={item}
                      onClick={() => setSelectedItem(item)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(item);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      onToggleTopMind={(e) => {
                        e.stopPropagation();
                        handleToggleTopMind(item);
                      }}
                      onUpdateChecklist={handleUpdateChecklist}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Kanban Board View */}
        {viewType === 'kanban' && (
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 mt-6 md:mt-12 pb-32 md:pb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'top-mind',
                  title: '📌 Top of Mind',
                  description: 'Core focus & current projects',
                  items: sortedItems.filter(i => i.isTopMind),
                  bg: 'bg-amber-500/5 border-amber-500/20 text-amber-700'
                },
                {
                  id: 'favorites',
                  title: '💖 Favorites',
                  description: 'Saved gems & inspiration',
                  items: sortedItems.filter(i => i.isFavorite && !i.isTopMind),
                  bg: 'bg-rose-500/5 border-rose-500/20 text-rose-700'
                },
                {
                  id: 'inflow',
                  title: '📥 General Queue',
                  description: 'Everything else floating in your mind',
                  items: sortedItems.filter(i => !i.isTopMind && !i.isFavorite),
                  bg: 'bg-neutral-500/5 border-neutral-500/10 text-neutral-600'
                }
              ].map((column) => (
                <div 
                  key={column.id} 
                  className="flex flex-col bg-card-bg/40 border border-border-subtle rounded-3xl p-4.5 min-h-[400px]"
                >
                  {/* Column Header */}
                  <div className={`p-4 rounded-2xl border ${column.bg} mb-4 flex flex-col gap-1 shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm uppercase tracking-tight">{column.title}</h3>
                      <span className="text-[10px] font-mono font-bold bg-white/50 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                        {column.items.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/60 leading-tight">{column.description}</p>
                  </div>

                  {/* Column Items Area */}
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] no-scrollbar pr-0.5">
                    {column.items.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-border-subtle rounded-2xl text-[10px] text-neutral-400 font-mono">
                        No items in this stack
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {column.items.map((item) => (
                          <motion.div
                            key={item.id}
                            layoutId={`kanban-card-${item.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className="relative group/kanbancard"
                          >
                            <MindCard
                              item={item}
                              onClick={() => setSelectedItem(item)}
                              onToggleFavorite={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(item);
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item);
                              }}
                              onToggleTopMind={(e) => {
                                e.stopPropagation();
                                handleToggleTopMind(item);
                              }}
                              onUpdateChecklist={handleUpdateChecklist}
                            />
                            
                            {/* Fast Organize Actions Overlay */}
                            <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover/kanbancard:opacity-100 transition duration-150 flex items-center gap-1.5 z-10 bg-card-bg/95 border border-border-subtle py-1 px-2 rounded-full shadow-md">
                              <span className="text-[8px] font-mono uppercase text-foreground/45 px-1">Move:</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTopMind(item);
                                }}
                                className={`p-1 rounded-md text-[9px] hover:bg-foreground/5 font-medium flex items-center gap-0.5 ${item.isTopMind ? 'text-amber-500 font-bold' : 'text-foreground/60'}`}
                              >
                                {item.isTopMind ? 'Unpin' : 'Pin'}
                              </button>
                              <div className="w-[1px] h-3 bg-border-subtle" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(item);
                                }}
                                className={`p-1 rounded-md text-[9px] hover:bg-foreground/5 font-medium flex items-center gap-0.5 ${item.isFavorite ? 'text-rose-500 font-bold' : 'text-foreground/60'}`}
                              >
                                {item.isFavorite ? 'Unfav' : 'Fav'}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Circular Glass icons) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[110] flex items-center justify-between transition-all duration-300">
        {[
          { id: 'all', label: 'All', icon: Aperture },
          { id: 'favorites', label: 'Favs', icon: Heart },
          { id: 'note', label: 'Notes', icon: BookOpen },
          { id: 'link', label: 'Links', icon: ExternalLink },
          { id: 'settings', label: 'More', icon: Settings2 }
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === 'settings' ? isSettingsOpen : (activeCategory === cat.id && !isSettingsOpen);

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.id === 'settings') {
                  setIsSettingsOpen(true);
                } else {
                  setActiveCategory(cat.id);
                  setActiveColorFilter(null);
                  setIsSettingsOpen(false);
                }
              }}
              className="flex flex-col items-center justify-center gap-0.5 transition-all duration-300 relative group"
              style={{ color: isActive ? 'var(--primary)' : undefined }}
            >
              <div className={`relative z-10 p-4 rounded-full transition-all duration-500 bg-background/80 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${isActive ? '-translate-y-2 scale-110 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]' : 'group-active:scale-90'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : 'text-foreground/70'}`} />
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavActiveIndicator"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Inspector Drawer sliding panel */}
      <AnimatePresence>
        {selectedItem && (
          <DetailPanel 
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onSetVibeFilter={(type, val, label) => setVibeFilter({ type, value: val, label })}
          />
        )}
      </AnimatePresence>

      {/* Serendipity Portal popup modal */}
      <SerendipityView 
        isOpen={isSerendipityOpen}
        onClose={() => setIsSerendipityOpen(false)}
        items={items}
        onInspectItem={setSelectedItem}
        onToggleFavorite={handleToggleFavorite}
      />
      </div>
    ) : (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    );
}
