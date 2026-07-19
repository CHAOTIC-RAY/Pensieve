/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sparkles, Heart, Palette, Brain, ListFilter as Filter, Check, Star, RefreshCw, Pin, Tv, Music, Twitter, Utensils, FileText, ChevronDown, Settings2, Aperture, Camera, BookOpen, ExternalLink, LayoutGrid, List, Columns2 as Columns, ArrowUpDown, SlidersHorizontal, Quote, Trophy, Film, Disc, ShoppingBag, Store, X, Database, Plug, Clock, Calendar, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as chrono from 'chrono-node';
import { auth } from './lib/firebase';
import { DbStrategy, getDbStrategy, getEffectiveDbStrategy, loadDbItems, saveDbItems, processItemMediaForUpload, deleteItemMedia, isStorageBucketConfigured, isAppwriteConfigured, drainSyncOutbox, describeStrategy, SyncStatus } from './services/dbStrategyService';
import { MindItem, MindItemType } from './types';
import { ensureLocalMigration } from './lib/localDb';
import {
  SmartSpace,
  loadSmartSpaces,
  createSmartSpace,
  deleteSmartSpace,
} from './lib/smartSpaces';
import { syncLinkedItemIds } from './lib/wikiLinks';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Logo from './components/Logo';
import Omnibar from './components/Omnibar';
import { useSearch } from './hooks/useSearch';
import MasonryGrid from './components/MasonryGrid';
import DetailPanel from './components/DetailPanel';
import ReaderMode from './components/ReaderMode';
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
  UserSettings, loadSettings, saveSettings, applyTheme as applyStudioTheme, calculateLevel
} from './services/themeStudio';

import SettingsModal from './components/SettingsModal';
import StoreModal from './components/StoreModal';
import PluginModal from './components/PluginModal';
import AdminPanel from './components/AdminPanel';
import { useAchievements } from './hooks/useAchievements';
import AchievementsModal from './components/AchievementsModal';
import AchievementToast from './components/AchievementToast';
import PinnedWidgets from './components/PinnedWidgets';

const GalaxyBackground = () => {
  return (
    <div className="galaxy-background">
      <div className="water-shimmer" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="galaxy-star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            '--duration': `${Math.random() * 6 + 4}s`,
            animationDelay: `${Math.random() * 5}s`
          } as any}
        />
      ))}
    </div>
  );
};

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
    const handleStore = () => setIsStoreOpen(true);
    const handlePlugin = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPluginModalName(customEvent.detail?.plugin || '');
      setIsPluginModalOpen(true);
    };
    window.addEventListener('pensieve_trigger_store', handleStore);
    window.addEventListener('pensieve_trigger_plugin', handlePlugin);
    return () => {
      window.removeEventListener('pensieve_trigger_store', handleStore);
      window.removeEventListener('pensieve_trigger_plugin', handlePlugin);
    };
  }, []);
  
  useEffect(() => {
    // Check if there is an active local guest session
    const localGuestActive = localStorage.getItem('pensieve_local_guest_active') === 'true';
    if (localGuestActive) {
      const guestObj = {
        uid: 'guest-user',
        email: 'guest@pensieve.local',
        displayName: 'Guest Scholar',
        isAnonymous: true,
        emailVerified: true
      } as any as User;
      setUser(guestObj);
      setAuthLoading(false);
      return;
    }

    // Robust safety fallback: if Firebase Auth gets stuck due to iframe/cross-site cookie restrictions,
    // clear the loading state after 4 seconds so the user can still use the app or log in.
    const authTimeout = setTimeout(() => {
      setAuthLoading((currentLoading) => {
        if (currentLoading) {
          console.warn("[Pensieve Auth] Firebase Auth initialization timed out. Falling back to local/guest mode.");
          const guestObj = {
            uid: 'guest-user',
            email: 'guest@pensieve.local',
            displayName: 'Guest Scholar',
            isAnonymous: true,
            emailVerified: true
          } as any as User;
          setUser(guestObj);
          localStorage.setItem('pensieve_local_guest_active', 'true');
          return false;
        }
        return currentLoading;
      });
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(authTimeout);
      if (u) {
        setUser(u);
        localStorage.removeItem('pensieve_local_guest_active');
      } else if (localStorage.getItem('pensieve_local_guest_active') === 'true') {
        // Keep the guest user if they explicitly selected/fallback to it
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const [items, setItems] = useState<MindItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all'); // 'all', 'favorites', MindItemType
  const [typingTimer, setTypingTimer] = useState<any>(null);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveColorFilter(null);
    setActiveSpaceId(null);
    setIsSettingsOpen(false);

    if (typingTimer) {
      clearInterval(typingTimer);
    }

    const categorySearchQueries: Record<string, string> = {
      all: '',
      favorites: 'favorite',
      'read-later': 'read later',
      note: 'notes',
      color: 'colors',
      link: 'bookmarks',
      image: 'images',
      quote: 'quotes',
      video: 'videos',
      music: 'music',
      tweet: 'tweets',
      article: 'articles',
      recipe: 'recipes',
      film: 'films',
      album: 'albums',
      product: 'products',
    };

    const targetQuery = categorySearchQueries[catId] ?? '';
    
    if (targetQuery === '') {
      setSearchQuery('');
      return;
    }

    let current = '';
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < targetQuery.length) {
        current += targetQuery[idx];
        setSearchQuery(current);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    setTypingTimer(interval);
  };

  useEffect(() => {
    return () => {
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [typingTimer]);
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [vibeFilter, setVibeFilter] = useState<{ type: 'color' | 'tag'; value: string; label: string } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find(i => i.id === selectedItemId) || null;
  const setSelectedItem = (item: MindItem | null) => {
    setSelectedItemId(item ? item.id : null);
  };
  const [readerItemId, setReaderItemId] = useState<string | null>(null);
  const readerItem = items.find(i => i.id === readerItemId) || null;
  const setReaderItem = (item: MindItem | null) => {
    setReaderItemId(item ? item.id : null);
  };
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [storageError, setStorageError] = useState<{ message: string, type: string } | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [pluginModalName, setPluginModalName] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState<'filters' | 'organize' | 'layout' | null>(null);

  // Layout & Sorting (Rearranging) States
  const [viewType, setViewType] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'type'>('newest');
  const [smartSpaces, setSmartSpaces] = useState<SmartSpace[]>(() => loadSmartSpaces());
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);

  // Local AI (LiteRT / WebGPU) States
  const [aiStrategy, setAiStrategyState] = useState<AiStrategy>(getAiStrategy());
  const [dbStrategy, setDbStrategyState] = useState<DbStrategy>(getDbStrategy());
  const [appwriteToastDismissed, setAppwriteToastDismissed] = useState(() => {
    return localStorage.getItem('pensieve_appwrite_toast_dismissed') === 'true';
  });

  // Achievements
  const { achievements, activeToast, dismissToast, triggerSerendipity } = useAchievements(items);
  const totalXp = achievements.reduce((acc, ach) => acc + (ach.unlockedAt ? (ach.xp || 10) : 0), 0);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [localAiEnabled, setLocalAiEnabledState] = useState(isLocalAiEnabled());
  const [localModelId, setLocalModelIdState] = useState(getSelectedLocalModelId());
  const [localVisionModelId, setLocalVisionModelIdState] = useState(getSelectedVisionModelId());
  const [bootstrapState, setBootstrapState] = useState({ phase: 'idle', progress: 0, message: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"intelligence" | "db" | "ui" | "profile" | "mobile-link" | "plugins">("ui");
  const [availableModels, setAvailableModels] = useState<ModelManifestEntry[]>([]);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    !navigator.onLine ? 'offline' : getEffectiveDbStrategy() === 'local' ? 'local' : 'syncing'
  );
  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState(!!(window as any).pwaWaitingWorker);

  // User Profile States
  const [profileName, setProfileName] = useState(() => localStorage.getItem('pensieve_profile_name') || 'Ray Dark');
  const [profileGradient, setProfileGradient] = useState(() => localStorage.getItem('pensieve_profile_avatar_gradient') || 'from-orange-200 to-rose-200');

  // Persistent Theme Studio settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    return loadSettings();
  });

  const handleUpdateSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    saveSettings(settings);
  };

  // Dynamically apply appropriate theme based on user login state
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        applyStudioTheme(userSettings);
      } else {
        // Calm MyMind canvas for the Landing Page
        applyStudioTheme({
          themeMode: 'light',
          themeColor: '#FF6B35',
          activePreset: 'MyMind',
          uiStyle: 'minimal',
          fontCombo: 'minimal',
          borderRadius: 14,
          blurStrength: 8,
          cardStyle: 'comfortable',
          backgroundImage: '',
          reduceMotion: false,
          hideImages: false,
          immersiveMode: false,
          autoNightMode: false
        });
      }
    } else {
      // Apply the user's customized theme during initial application loading
      applyStudioTheme(userSettings);
    }
  }, [user, authLoading, userSettings]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      const newSettings = loadSettings();
      // Only update if settings have changed externally
      setUserSettings(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newSettings)) return prev;
        return newSettings;
      });
      setProfileName(localStorage.getItem('pensieve_profile_name') || 'Ray Dark');
      setProfileGradient(localStorage.getItem('pensieve_profile_avatar_gradient') || 'from-orange-200 to-rose-200');
      setDbStrategyState(getDbStrategy());
      setAiStrategyState(getAiStrategy());
      setAppwriteToastDismissed(localStorage.getItem('pensieve_appwrite_toast_dismissed') === 'true');
    };
    window.addEventListener('app-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('app-settings-updated', handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus(getEffectiveDbStrategy() === 'local' ? 'local' : 'syncing');
      drainSyncOutbox().then((n) => {
        if (n > 0 || getEffectiveDbStrategy() !== 'local') {
          setSyncStatus(getEffectiveDbStrategy() === 'local' ? 'local' : 'synced');
        }
      });
    };
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('offline');
    };
    const handleSyncStatus = (e: any) => {
      if (e?.detail?.status) setSyncStatus(e.detail.status);
    };

    const handlePwaUpdate = () => setPwaUpdateAvailable(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pensieve_sync_status', handleSyncStatus);
    window.addEventListener('pwa-update-available', handlePwaUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pensieve_sync_status', handleSyncStatus);
      window.removeEventListener('pwa-update-available', handlePwaUpdate);
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

  // Local-first load + optional cloud merge
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await ensureLocalMigration();

      if (!user) {
        const localOnly = await loadDbItems('', 'local');
        if (!cancelled) {
          setItems(localOnly);
          setIsSyncing(false);
          setSyncStatus(isOffline ? 'offline' : 'local');
        }
        return;
      }

      setIsSyncing(true);
      const effective = getEffectiveDbStrategy();
      setSyncStatus(isOffline || effective === 'local' ? (isOffline ? 'offline' : 'local') : 'syncing');
      console.log(`[Pensieve Sync] Loading items (requested=${dbStrategy}, effective=${effective}) for user: ${user.uid}`);

      try {
        const list = await loadDbItems(user.uid, dbStrategy);
        if (cancelled) return;
        setItems(list);

        // If cloud is configured and we have local data, ensure push of merged vault
        if (effective !== 'local' && navigator.onLine && list.length > 0) {
          await saveDbItems(user.uid, list, dbStrategy);
          await drainSyncOutbox();
        }

        if (!cancelled) {
          setSyncStatus(
            !navigator.onLine ? 'offline' : effective === 'local' ? 'local' : 'synced'
          );
        }
      } catch (err) {
        console.error(`[Pensieve Sync] Sync failed for strategy ${dbStrategy}:`, err);
        const fallback = await loadDbItems('', 'local');
        if (!cancelled) {
          setItems(fallback);
          setSyncStatus(!navigator.onLine ? 'offline' : 'error');
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dbStrategy]);

  const { results: searchedItems } = useSearch(items, searchQuery);

  // Filter items based on search, selected categories, and vibes
  const filteredItems = searchedItems.filter(item => {
    // 1. Category Filter
    if (activeCategory === 'favorites' && !item.isFavorite) return false;
    if (activeCategory === 'read-later' && !(item.readLater && (item.type === 'article' || item.type === 'link'))) return false;
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && activeCategory !== 'read-later' && item.type !== activeCategory) return false;

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

  // Persist vault to IndexedDB (+ optional cloud / outbox)
  const persistItems = (updated: MindItem[]) => {
    const stamped = updated.map((item) => ({
      ...item,
      updatedAt: new Date().toISOString(),
    }));
    const uid = user?.uid || 'guest-user';
    void saveDbItems(uid, stamped, dbStrategy);
    return stamped;
  };

  // Helper to safely update an item with local-first persistence
  const safeUpdateItem = async (itemId: string, updates: Partial<MindItem>) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
      return persistItems(updated);
    });
  };

  // Handle Item Creation with Multi-Stage Background AI parsing (including Puter AI alternative)
  const handleItemCreated = async (newItem: Omit<MindItem, 'id' | 'createdAt'>): Promise<string> => {
    // Stage 1: Fast client-side write with "analyzing" state
    const docData = {
      ...newItem,
      createdAt: new Date().toISOString(),
      analyzing: true,
      tags: newItem.tags || []
    };

    const createdId = Date.now().toString() + Math.random().toString(36).substring(2, 9); // unique ID
    let fallbackItem = { ...docData, id: createdId } as MindItem;

    // Upload media to storage bucket if configured and item has base64 media
    if (dbStrategy === 'appwrite' && isStorageBucketConfigured()) {
      const processedMediaItem = await processItemMediaForUpload(fallbackItem);
      if (processedMediaItem.imageFileId || processedMediaItem.audioFileId) {
        fallbackItem = processedMediaItem;
      }
    }

    // Put it in local state and IndexedDB instantly
    const createdItem = {
      ...fallbackItem,
      updatedAt: new Date().toISOString(),
      analyzing: true,
    } as MindItem;
    setItems(prev => persistItems([createdItem, ...prev]));

    // Stage 2: Background processing on client or server
    (async () => {
      try {
        let processedItem = { ...createdItem };
        const offline = !navigator.onLine;

        // 2A. Scrape link/article metadata (requires network)
        if (!offline && (newItem.type === 'link' || newItem.type === 'article') && newItem.url) {
          try {
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
                processedItem.bodyText = scraped.bodyText || '';

                await safeUpdateItem(createdId, {
                  title: processedItem.title,
                  content: processedItem.content,
                  imageUrl: processedItem.imageUrl,
                  siteName: processedItem.siteName,
                  favicon: processedItem.favicon
                });
              }
            }
          } catch (scrapeErr) {
            console.warn("Scraping fallback failed:", scrapeErr);
          }
        }

        // 2B. Local WebGPU AI analysis (works offline when model is ready)
        if (aiStrategy === 'local' && isLocalAiEnabled()) {
          console.log('[Pensieve Local AI] Initiating on-device WebGPU model...');
          try {
            const aiResult = await organizeAndTagItemLocally(processedItem);
            if (aiResult && aiResult.success) {
              const finalDoc = {
                title: aiResult.title || processedItem.title,
                content: aiResult.content || processedItem.content,
                type: aiResult.category || processedItem.type,
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
              return;
            }
          } catch (localErr) {
            console.warn('[Pensieve Local AI] Local model failed. Falling back...', localErr);
          }
        }

        // 2C. Server-side Gemini API fallback (skip when offline)
        if (!offline) {
          try {
            const analyzeResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ item: processedItem })
            });

            if (analyzeResponse.ok) {
              const aiResult = await analyzeResponse.json();
              if (aiResult.success) {
                const finalDoc = {
                  title: aiResult.title || processedItem.title,
                  content: aiResult.content || processedItem.content,
                  type: aiResult.category || processedItem.type,
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
                return;
              }
            }
          } catch (serverErr) {
            console.warn('[Pensieve] Server AI analysis failed.', serverErr);
          }
        }

        // Final fallback: Ensure item is saved even if all AI analysis fails
        await safeUpdateItem(createdId, {
          analyzing: false,
          aiSummary: offline
            ? 'Saved locally (offline indexing)'
            : 'Not analyzed (AI unavailable).'
        });
      } catch (error) {
        console.error("Background indexing failed:", error);
        await safeUpdateItem(createdId, {
          analyzing: false,
          aiSummary: 'Saved locally (offline indexing)'
        });
      }
    })();

    return createdId;
  };

  useEffect(() => {
    const handleError = (e: any) => {
      if (e.detail) setStorageError(e.detail);
    };
    window.addEventListener('pensieve_storage_error', handleError);
    return () => window.removeEventListener('pensieve_storage_error', handleError);
  }, []);

  const handleToggleFavorite = async (item: MindItem) => {
    const newIsFavorite = !item.isFavorite;
    setItems(prev =>
      persistItems(
        prev.map((i) =>
          i.id === item.id ? { ...i, isFavorite: newIsFavorite } : i
        )
      )
    );
  };

  // Toggle Top of Mind focus pin
  const handleToggleTopMind = async (item: MindItem) => {
    const newIsTopMind = !item.isTopMind;
    setItems(prev =>
      persistItems(
        prev.map((i) =>
          i.id === item.id ? { ...i, isTopMind: newIsTopMind } : i
        )
      )
    );
  };

  // Delete item
  const handleDeleteItem = async (item: MindItem) => {
    // Delete associated media from storage bucket if configured
    if (dbStrategy === 'appwrite' && isStorageBucketConfigured()) {
      await deleteItemMedia(item);
    }

    setItems(prev => persistItems(prev.filter((i) => i.id !== item.id)));
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
  };

  // Update item (used for inline edits in inspector or checklist toggles)
  const handleUpdateItem = async (updatedItem: MindItem) => {
    setItems(prev => {
      const withLinks = {
        ...updatedItem,
        linkedItemIds: syncLinkedItemIds(updatedItem, prev),
      };
      return persistItems(
        prev.map((i) => (i.id === withLinks.id ? { ...i, ...withLinks } : i))
      );
    });
  };

  const applySmartSpace = (space: SmartSpace | null) => {
    if (!space) {
      setActiveSpaceId(null);
      return;
    }
    setActiveSpaceId(space.id);
    setSearchQuery(space.query || '');
    setActiveCategory(space.category || 'all');
    setActiveColorFilter(space.colorFilter);
    setVibeFilter(null);
  };

  const handleSaveSmartSpace = () => {
    const defaultName =
      searchQuery.trim() ||
      (activeCategory !== 'all' ? activeCategory : '') ||
      (activeColorFilter ? `${activeColorFilter} colors` : '') ||
      'New Space';
    const name = window.prompt('Name this Smart Space', defaultName);
    if (!name) return;
    const space = createSmartSpace({
      name,
      query: searchQuery,
      category: activeCategory,
      colorFilter: activeColorFilter,
    });
    setSmartSpaces(loadSmartSpaces());
    setActiveSpaceId(space.id);
  };

  // Interactive Checklist toggling helper
  const handleUpdateChecklist = async (item: MindItem, updatedContent: string) => {
    setItems(prev =>
      persistItems(
        prev.map((i) =>
          i.id === item.id ? { ...i, content: updatedContent } : i
        )
      )
    );
  };

  if (location.pathname === '/admin') {
    return <AdminPanel />;
  }

  if (authLoading) {
    return (
      <div className={`min-h-screen bg-background text-foreground flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden ${userSettings.activeEffect || ''}`}>
        {/* Subtle decorative spot blurs matching theme for premium loader vibe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-15">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        
        {/* Subtle paper texture overlay */}
        <div className="paper-texture opacity-50" />

        <div className="flex flex-col items-center gap-5 z-10 animate-fade-in">
          <Logo className="w-14 h-14" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-foreground/40 uppercase font-display">pensieve</span>
            {/* Minimalist animated progress loader */}
            <div className="h-[2px] w-16 bg-foreground/10 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-primary w-1/2 rounded-full animate-[pulse_1.5s_infinite_ease-in-out]" 
                style={{ 
                  background: 'var(--primary)', 
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMyMindLook =
    userSettings.activePreset === 'MyMind' ||
    (userSettings.uiStyle === 'minimal' && userSettings.themeMode === 'light');

  return user ? (
    <div id="pensieve-workspace" className={`min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background transition-colors duration-300 relative ${userSettings.activeEffect || ''}`}>
        {!isMyMindLook && <GalaxyBackground />}
        {/* Ambient blurs — muted for MyMind calm canvas */}
        {!isMyMindLook && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40 dark:opacity-25">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-neutral-800/10 dark:bg-neutral-900/35 blur-[130px]" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[140px]" />
          <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] rounded-full bg-white/20 dark:bg-white/5 blur-[120px]" />
        </div>
        )}

        {/* Paper Texture Overlay — skip for clean MyMind canvas */}
        {!isMyMindLook && <div className="paper-texture" />}

        {pwaUpdateAvailable && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[130000] flex items-center gap-3 px-4 py-2.5 rounded-full bg-sky-600 text-white shadow-lg border border-sky-400/30">
            <span className="text-xs font-semibold tracking-wide">App update ready</span>
            <button
              type="button"
              onClick={() => {
                const waiting = (window as any).pwaWaitingWorker as ServiceWorker | undefined;
                if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
                else window.location.reload();
              }}
              className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => setPwaUpdateAvailable(false)}
              className="text-[10px] font-mono uppercase tracking-wider text-white/70 hover:text-white"
            >
              Later
            </button>
          </div>
        )}

      {/* Compact Mobile-Only Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card-bg/50 backdrop-blur-md border-b border-border-subtle/40 shrink-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span className="text-sm font-semibold tracking-tight font-display text-foreground">pensieve</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Store Button (Mobile) */}
          <button
            onClick={() => setIsStoreOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm active:scale-95 transition-transform"
          >
            <Store className="w-3.5 h-3.5" />
            Store
          </button>
          
          {/* Simple avatar profile */}
          <div 
            onClick={() => {
              setSettingsTab('profile');
              setIsSettingsOpen(true);
            }}
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${profileGradient} border-white/20 dark:border-white/5 shadow-sm cursor-pointer flex items-center justify-center text-[10px] font-bold text-neutral-800 avatar-container`}
            title={profileName}
          >
            {userSettings.avatarIcon ? (
              <span className="text-[10px]">
                {userSettings.avatarIcon === 'icon-royal' ? '👑' : '?'}
              </span>
            ) : (
              profileName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
            )}
            
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-foreground text-background flex items-center justify-center text-[7px] font-black border border-background shadow-sm">
              {calculateLevel(userSettings.xp || 0).level}
            </div>
          </div>
        </div>
      </header>

      <PinnedWidgets settings={userSettings} />

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
        dbStrategy={dbStrategy}
        setDbStrategyState={setDbStrategyState}
        onItemCreated={handleItemCreated}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
      />
      
      <AnimatePresence>
        {isStoreOpen && (
          <StoreModal 
            isOpen={isStoreOpen}
            onClose={() => setIsStoreOpen(false)}
            userSettings={userSettings}
          />
        )}
        {isPluginModalOpen && (
          <PluginModal
            isOpen={isPluginModalOpen}
            onClose={() => {
              setIsPluginModalOpen(false);
              setPluginModalName('');
            }}
            onItemCreated={handleItemCreated}
          />
        )}
      </AnimatePresence>
      
      <AchievementToast 
        achievement={activeToast} 
        onDismiss={dismissToast} 
      />

      {/* Workspace Container */}
      <div className={`flex-1 flex w-full relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Floating Logo - Top Left */}
        <div className="hidden md:flex flex-col items-center fixed top-6 left-6 z-40 select-none pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center p-2 pointer-events-auto cursor-pointer"
                 onClick={() => handleCategoryChange('all')}>
              <Logo className="w-full h-full" glow={false} />
            </div>
            <div className="flex flex-col items-center text-[9px] font-bold text-foreground/45 font-mono my-4 uppercase gap-1.5 select-none">
              {Array.from("PENSIEVE").map((char, i) => (
                <span key={i} className="leading-none font-display">{char}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Navigation - Bottom Left */}
        <div className="hidden md:flex flex-col items-center gap-3 fixed bottom-6 left-6 z-40 select-none">
          {[
            { id: 'all', label: 'All Saved', icon: Aperture },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'read-later', label: 'Read Later', icon: Clock },
            { id: 'note', label: 'Notes', icon: BookOpen },
            { id: 'link', label: 'Bookmarks', icon: ExternalLink }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && !isSettingsOpen;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
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

          {/* Settings / Preferences Button */}
          <button
            onClick={() => {
              setSettingsTab('ui');
              setIsSettingsOpen(!isSettingsOpen);
            }}
            title="Preferences"
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
              isSettingsOpen && settingsTab !== 'plugins'
                ? 'bg-primary/20 border-primary/30 text-primary' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Status & Profile - Top Right */}
        <div className="hidden md:flex flex-row items-center gap-3.5 fixed top-6 right-6 z-40 select-none">
          {/* Sync / offline status chip */}
          <button
            type="button"
            onClick={() => {
              setSettingsTab('db');
              setIsSettingsOpen(true);
            }}
            title={describeStrategy(getEffectiveDbStrategy()).title}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider backdrop-blur-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              syncStatus === 'offline'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-600'
                : syncStatus === 'error'
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-600'
                : syncStatus === 'syncing' || isSyncing
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-600'
                : syncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600'
                : 'bg-foreground/5 border-foreground/10 text-foreground/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'offline'
                  ? 'bg-amber-500'
                  : syncStatus === 'error'
                  ? 'bg-rose-500'
                  : syncStatus === 'syncing' || isSyncing
                  ? 'bg-sky-500 animate-pulse'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : 'bg-foreground/40'
              }`}
            />
            {syncStatus === 'offline'
              ? 'Offline'
              : syncStatus === 'error'
              ? 'Sync error'
              : syncStatus === 'syncing' || isSyncing
              ? 'Syncing'
              : syncStatus === 'synced'
              ? 'Synced'
              : 'Local'}
          </button>

          {/* Store Button */}
          <button
            onClick={() => setIsStoreOpen(true)}
            title="Marketplace"
            className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] bg-amber-500/10 border-amber-500/20 text-amber-500 hover:scale-105 active:scale-95"
          >
            <Store className="w-5 h-5" />
          </button>

          {/* Achievements Button */}
          <button
            onClick={() => setIsAchievementsOpen(true)}
            title={`Milestones (${totalXp} XP)`}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 ${
              isAchievementsOpen 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-amber-500/10 hover:text-amber-500'
            }`}
          >
            <Trophy className={`w-5 h-5 ${isAchievementsOpen ? 'fill-current text-amber-500' : ''}`} />
            {totalXp > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full border border-yellow-300 shadow-md">
                {totalXp}
              </span>
            )}
          </button>

          {/* User Profile avatar */}
          <div className="group relative flex items-center justify-center">
            <div 
              onClick={() => {
                setSettingsTab('profile');
                setIsSettingsOpen(true);
              }}
              className={`w-11 h-11 rounded-full bg-gradient-to-tr ${profileGradient} border-white/20 dark:border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center text-xs font-bold text-neutral-800 avatar-container`}
            >
               {userSettings.avatarIcon ? (
                <span className="text-xl">
                  {userSettings.avatarIcon === 'icon-royal' ? '👑' : '?'}
                </span>
              ) : (
                profileName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
              )}
              
              {/* Level Badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black border-2 border-background shadow-md">
                {calculateLevel(userSettings.xp || 0).level}
              </div>
            </div>
            <div className="absolute top-14 right-0 hidden group-hover:flex flex-col bg-card-bg/95 backdrop-blur-md border border-border-subtle p-3 rounded-2xl shadow-premium z-50 pointer-events-none min-w-[200px]">
              <span className="text-sm font-semibold text-foreground truncate user-name-display" data-name={profileName}>{profileName}</span>
              <span className="text-[10px] font-mono text-foreground/50 mt-1">Personal Account</span>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <main className={`flex-1 flex flex-col items-center w-full pt-4 md:pt-8 pb-20 md:pb-8 h-[calc(100vh-52px)] md:h-screen overflow-y-auto overflow-x-hidden relative transition-all duration-300 ${
          sidebarPosition === 'left' ? 'md:pl-24 md:pr-8' : 'md:pr-24 md:pl-8'
        }`}>
          
          {/* Centered Editorial Greeting & Focus Title */}
          <div className="text-center mt-2 md:mt-10 mb-4 md:mb-6 px-4 max-w-xl mx-auto space-y-0.5 md:space-y-1.5 select-none pointer-events-none shrink-0">
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight text-foreground font-display transition-colors duration-300 leading-tight">
              What are you remembering today?
            </h1>
            <p className="text-xs md:text-base text-foreground/45 font-sans transition-colors duration-300">
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

        {/* Mobile Toolbar Toggles */}
        <div className="md:hidden w-full max-w-4xl px-6 mt-4 mb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setIsMobileToolbarOpen(isMobileToolbarOpen === 'filters' ? null : 'filters')}
            className={`flex items-center gap-2 px-3 py-1.5 bg-card-bg border rounded-xl text-[9px] font-mono uppercase tracking-widest transition-all duration-300 shrink-0 ${
              isMobileToolbarOpen === 'filters' ? 'border-primary text-primary shadow-sm' : 'border-border-subtle text-foreground/50'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
          <button 
            onClick={() => setIsMobileToolbarOpen(isMobileToolbarOpen === 'organize' ? null : 'organize')}
            className={`flex items-center gap-2 px-3 py-1.5 bg-card-bg border rounded-xl text-[9px] font-mono uppercase tracking-widest transition-all duration-300 shrink-0 ${
              isMobileToolbarOpen === 'organize' ? 'border-primary text-primary shadow-sm' : 'border-border-subtle text-foreground/50'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            Organize
          </button>
          <button 
            onClick={() => setIsMobileToolbarOpen(isMobileToolbarOpen === 'layout' ? null : 'layout')}
            className={`flex items-center gap-2 px-3 py-1.5 bg-card-bg border rounded-xl text-[9px] font-mono uppercase tracking-widest transition-all duration-300 shrink-0 ${
              isMobileToolbarOpen === 'layout' ? 'border-primary text-primary shadow-sm' : 'border-border-subtle text-foreground/50'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            Layout
          </button>
        </div>

        {/* Collapsible Sections */}
        <div className="w-full max-w-4xl px-6 md:px-4 mt-2 md:mt-6">
          
          {/* Category / Content Type Filter Tags */}
          <div className={`transition-all duration-500 origin-top overflow-hidden md:overflow-visible ${
            isMobileToolbarOpen === 'filters' ? 'max-h-[400px] opacity-100 py-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
          }`}>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] md:text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold">
                Filter by Type:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full px-1 py-1.5 md:py-2.5">
                {[
                  { id: 'all', label: 'All', icon: Aperture, count: items.length },
                  { id: 'favorites', label: 'Favorites', icon: Heart, count: items.filter(i => i.isFavorite).length },
                  { id: 'read-later', label: 'Read Later', icon: Clock, count: items.filter(i => i.readLater && (i.type === 'article' || i.type === 'link')).length },
                  { id: 'note', label: 'Notes', icon: BookOpen, count: items.filter(i => i.type === 'note').length },
                  { id: 'color', label: 'Colors', icon: Palette, count: items.filter(i => i.type === 'color').length },
                  { id: 'link', label: 'Bookmarks', icon: ExternalLink, count: items.filter(i => i.type === 'link').length },
                  { id: 'image', label: 'Images', icon: Camera, count: items.filter(i => i.type === 'image').length },
                  { id: 'quote', label: 'Quotes', icon: Quote, count: items.filter(i => i.type === 'quote').length },
                  { id: 'video', label: 'Videos', icon: Tv, count: items.filter(i => i.type === 'video').length },
                  { id: 'music', label: 'Music', icon: Music, count: items.filter(i => i.type === 'music').length },
                  { id: 'tweet', label: 'Tweets', icon: Twitter, count: items.filter(i => i.type === 'tweet').length },
                  { id: 'article', label: 'Articles', icon: FileText, count: items.filter(i => i.type === 'article').length },
                  { id: 'recipe', label: 'Recipes', icon: Utensils, count: items.filter(i => i.type === 'recipe').length },
                  { id: 'film', label: 'Films', icon: Film, count: items.filter(i => i.type === 'film').length },
                  { id: 'album', label: 'Albums', icon: Disc, count: items.filter(i => i.type === 'album').length },
                  { id: 'product', label: 'Products', icon: ShoppingBag, count: items.filter(i => i.type === 'product').length },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  if (cat.count === 0 && cat.id !== 'all' && cat.id !== 'favorites' && cat.id !== 'read-later') return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
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

            {/* Color & Date filter rail */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 overflow-x-auto no-scrollbar w-full px-1 py-2 mt-2">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Color:
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {COLOR_FILTERS.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => {
                        setActiveSpaceId(null);
                        if (activeColorFilter === col.name) {
                          setActiveColorFilter(null);
                        } else {
                          setActiveColorFilter(col.name);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition flex items-center justify-center relative ${col.class} ${
                        activeColorFilter === col.name ? 'scale-115 ring-2 ring-primary/40 border-primary' : 'border-border-subtle opacity-80 hover:opacity-100'
                      }`}
                    >
                      {activeColorFilter === col.name && (
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${col.name === 'white' || col.name === 'yellow' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Spaces — saved searches (mymind-style) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full px-1 py-2 mt-1">
              <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5 shrink-0">
                <Layers className="w-3.5 h-3.5" /> Spaces:
              </span>
              <button
                type="button"
                onClick={handleSaveSmartSpace}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-dashed border-primary/40 text-primary hover:bg-primary/5 cursor-pointer shrink-0"
                title="Save current search & filters as a Smart Space"
              >
                <Plus className="w-3 h-3" />
                Save Space
              </button>
              {smartSpaces.map((space) => (
                <div key={space.id} className="relative group/space shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      applySmartSpace(activeSpaceId === space.id ? null : space)
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition cursor-pointer ${
                      activeSpaceId === space.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card-bg border-border-subtle text-foreground/70 hover:border-foreground/25'
                    }`}
                  >
                    <Layers className="w-3 h-3 opacity-70" />
                    {space.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSmartSpaces(deleteSmartSpace(space.id));
                      if (activeSpaceId === space.id) setActiveSpaceId(null);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground text-background text-[9px] opacity-0 group-hover/space:opacity-100 flex items-center justify-center cursor-pointer"
                    title="Delete space"
                  >
                    ×
                  </button>
                </div>
              ))}
              {smartSpaces.length === 0 && (
                <span className="text-[10px] text-foreground/35 font-sans shrink-0">
                  Save a search to auto-collect matching cards
                </span>
              )}
            </div>
          </div>

          <div className={`transition-all duration-500 origin-top overflow-hidden md:overflow-visible ${
            isMobileToolbarOpen === 'organize' || isMobileToolbarOpen === 'layout' ? 'max-h-[400px] opacity-100 py-2 border-t border-border-subtle/50 mt-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:border-t-0 md:mt-0'
          }`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Sort/Rearrange dropdown */}
              <div className={`flex items-center gap-2 shrink-0 transition-all duration-500 ${isMobileToolbarOpen === 'layout' && 'hidden md:flex'}`}>
                <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Organize:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-card-bg border border-border-subtle hover:border-foreground/20 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none cursor-pointer transition"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="type">By Type</option>
                </select>
              </div>

              {/* View Type selection */}
              <div className={`flex items-center gap-2 self-end sm:self-auto shrink-0 transition-all duration-500 ${isMobileToolbarOpen === 'organize' && 'hidden md:flex'}`}>
                <span className="text-[10px] font-mono uppercase text-foreground/45 tracking-wider font-bold flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> Layout:
                </span>
                <div className="flex bg-card-bg/50 border border-border-subtle p-0.5 rounded-xl gap-0.5 shadow-sm">
                  <button
                    onClick={() => setViewType('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      viewType === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewType('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      viewType === 'list' ? 'bg-primary text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewType('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      viewType === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Kanban</span>
                  </button>
                </div>
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
            onOpenReader={setReaderItem}
            onComposeNote={() => {
              window.dispatchEvent(new CustomEvent('pensieve_compose_note'));
            }}
          />
        )}

        {/* Elegant List View Stream */}
        {viewType === 'list' && (
          <div className="w-full max-w-2xl mx-auto px-6 md:px-8 mt-6 md:mt-12 pb-32 md:pb-24 space-y-6">
            {sortedItems.length === 0 ? (
              <div id="pensieve-empty-state" className="w-full text-center py-20 bg-card-bg/40 border border-border-subtle rounded-3xl text-neutral-400 font-mono text-xs">
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
                      onUpdateItem={handleUpdateItem}
                      onOpenReader={setReaderItem}
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
                              onUpdateItem={handleUpdateItem}
                              onOpenReader={setReaderItem}
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
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[110] flex items-center justify-between transition-all duration-300">
        {[
          { id: 'all', label: 'All', icon: Aperture },
          ...(userSettings.mobileTabs || ['favorites', 'note', 'link']).map(tabId => {
            const mappings: Record<string, any> = {
              favorites: { label: 'Favs', icon: Heart },
              'read-later': { label: 'Later', icon: Clock },
              note: { label: 'Notes', icon: BookOpen },
              link: { label: 'Links', icon: ExternalLink },
              image: { label: 'Images', icon: Camera },
              quote: { label: 'Quotes', icon: Quote },
              video: { label: 'Videos', icon: Tv },
              music: { label: 'Music', icon: Music },
              tweet: { label: 'Tweets', icon: Twitter },
              article: { label: 'Articles', icon: FileText },
              recipe: { label: 'Recipes', icon: Utensils },
              film: { label: 'Films', icon: Film },
              album: { label: 'Albums', icon: Disc },
              product: { label: 'Products', icon: ShoppingBag }
            };
            return { id: tabId, ...mappings[tabId] };
          }),
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
              <div className={`relative z-10 p-3 rounded-full transition-all duration-500 bg-background/90 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${isActive ? '-translate-y-2 scale-110 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]' : 'group-active:scale-90'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current text-primary' : 'text-foreground/70'}`} />
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Inspector Drawer sliding panel */}
      <AnimatePresence mode="wait">
        {selectedItem && (
          <DetailPanel 
            key={selectedItem.id}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onSetVibeFilter={(type, val, label) => setVibeFilter({ type, value: val, label })}
            onOpenReader={setReaderItem}
            allItems={items}
            onNavigateToItem={(target) => setSelectedItem(target)}
          />
        )}
      </AnimatePresence>

      {/* Distraction-Free Webpage Reader Overlay */}
      <AnimatePresence>
        {readerItem && (
          <ReaderMode 
            item={readerItem} 
            onClose={() => setReaderItem(null)} 
            onUpdateItem={handleUpdateItem} 
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

      {/* Storage Quota Error Toast */}
      <AnimatePresence>
        {storageError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-4 md:bottom-6 md:left-6 max-w-sm bg-red-500 text-white p-4 rounded-2xl shadow-xl flex gap-3 items-start z-[200]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">Browser Storage Full</h4>
              <p className="text-[10px] opacity-90 leading-normal">
                {storageError.message}
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setSettingsTab("db");
                    setIsSettingsOpen(true);
                    setStorageError(null);
                  }}
                  className="text-[10px] font-bold underline decoration-white/30 cursor-pointer"
                >
                  Open Storage Settings
                </button>
                <button
                  onClick={() => setStorageError(null)}
                  className="text-[10px] opacity-70 hover:opacity-100 font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional cloud recommendation — hide when already on local-first */}
      <AnimatePresence>
        {!appwriteToastDismissed && !isAppwriteConfigured() && getEffectiveDbStrategy() !== 'local' && dbStrategy !== 'local' && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 md:bottom-6 md:right-6 max-w-sm bg-card-bg/95 border border-border-subtle/80 backdrop-blur-md p-4 rounded-2xl shadow-xl flex gap-3 items-start z-[120]"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-semibold text-text-heading">Personal Cloud Storage</h4>
              <p className="text-[10px] text-foreground/60 leading-normal">
                Set up your private Appwrite database and storage to sync your thoughts and image uploads seamlessly across devices.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setSettingsTab("db");
                    setIsSettingsOpen(true);
                  }}
                  className="text-[10px] text-pink-400 hover:text-pink-300 font-bold cursor-pointer transition-colors"
                >
                  Configure Now
                </button>
                <button
                  onClick={() => {
                    setAppwriteToastDismissed(true);
                    localStorage.setItem('pensieve_appwrite_toast_dismissed', 'true');
                  }}
                  className="text-[10px] text-foreground/45 hover:text-foreground/75 font-semibold cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setAppwriteToastDismissed(true);
                localStorage.setItem('pensieve_appwrite_toast_dismissed', 'true');
              }}
              className="text-foreground/35 hover:text-foreground/60 cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    ) : (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    );
}
