import { useState, useEffect, useCallback } from 'react';
import { MindItem, Achievement } from '../types';
import { loadSettings, saveSettings } from '../services/themeStudio';
import { ACHIEVEMENTS } from '../lib/achievements';

const STORAGE_KEY = 'pensieve_unlocked_achievements';

export function useAchievements(items: MindItem[]) {
  const [unlockedIds, setUnlockedIds] = useState<Record<string, string>>({});
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // Load unlocked from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUnlockedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load achievements", e);
    }
  }, []);

  const unlock = useCallback((id: string) => {
    setUnlockedIds(prev => {
      if (prev[id]) return prev; // Already unlocked

      const now = new Date().toISOString();
      const updated = { ...prev, [id]: now };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        // Grant XP
        const settings = loadSettings();
        if (!settings.xp) settings.xp = 0;
        settings.xp += (achievement.xp || 10);
        saveSettings(settings);

        setToastQueue(q => [...q, { ...achievement, unlockedAt: now }]);
      }
      return updated;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue(q => q.slice(1));
  }, []);

  // Listen for global custom events to trigger specific interactive achievements
  useEffect(() => {
    const handlePlayground = () => {
      unlock('mind_meld');
    };
    const handleTheme = () => {
      unlock('transmuter');
    };

    window.addEventListener('pensieve_trigger_playground', handlePlayground);
    window.addEventListener('pensieve_trigger_theme', handleTheme);
    return () => {
      window.removeEventListener('pensieve_trigger_playground', handlePlayground);
      window.removeEventListener('pensieve_trigger_theme', handleTheme);
    };
  }, [unlock]);

  // Evaluators
  useEffect(() => {
    if (!items || items.length === 0) return;

    // First Spark: Save 1 item
    if (items.length >= 1 && !unlockedIds['first_spark']) {
      unlock('first_spark');
    }

    // Hoarder: Save 20 items
    if (items.length >= 20 && !unlockedIds['hoarder']) {
      unlock('hoarder');
    }

    // Curator: Favorite 5 items
    const favoritesCount = items.filter(i => i.isFavorite).length;
    if (favoritesCount >= 5 && !unlockedIds['curator']) {
      unlock('curator');
    }

    // Colorful Thinker: Have at least one color swatch
    const hasColor = items.some(i => i.type === 'color');
    if (hasColor && !unlockedIds['colorful_thinker']) {
      unlock('colorful_thinker');
    }

    // Knowledge Seeker: Have 3 articles or links
    const linksCount = items.filter(i => i.type === 'link' || i.type === 'article').length;
    if (linksCount >= 3 && !unlockedIds['knowledge_seeker']) {
      unlock('knowledge_seeker');
    }

    // Deep Thinker: 5 items with AI summaries
    const aiCount = items.filter(i => i.aiSummary && i.aiSummary.length > 0).length;
    if (aiCount >= 5 && !unlockedIds['deep_thinker']) {
      unlock('deep_thinker');
    }

    // Chronomancer / Time Weaver: Log memories across 3 distinct calendar days
    const distinctDays = new Set(items.map(i => {
      try {
        return i.createdAt.substring(0, 10);
      } catch {
        return null;
      }
    }).filter(Boolean));
    if (distinctDays.size >= 3 && !unlockedIds['chronomancer']) {
      unlock('chronomancer');
    }

    // NEW PROGRAMMATIC EVALUATORS FOR CREATIVE CARDS:
    
    // Grand Archivist (generated_9_0): Have at least 50 total items
    if (items.length >= 50 && !unlockedIds['generated_9_0']) {
      unlock('generated_9_0');
    }

    // Mindfulness Scribe (generated_2_0): Log an item containing the word "zen" or "peace"
    const hasZen = items.some(i => {
      const contentLower = (i.content || '').toLowerCase();
      const titleLower = (i.title || '').toLowerCase();
      return contentLower.includes('zen') || contentLower.includes('peace') || titleLower.includes('zen') || titleLower.includes('peace');
    });
    if (hasZen && !unlockedIds['generated_2_0']) {
      unlock('generated_2_0');
    }

    // Emerald Seeker (generated_4_4): Save green items
    const greenItems = items.filter(i => i.dominantColor === 'green').length;
    if (greenItems >= 3 && !unlockedIds['generated_4_4']) {
      unlock('generated_4_4');
    }

    // Folio Guardian (generated_5_0): Notes styled with Serif typography
    const hasSerif = items.some(i => i.noteStyle?.fontFamily === 'serif');
    if (hasSerif && !unlockedIds['generated_5_0']) {
      unlock('generated_5_0');
    }

    // Melody Weaver (generated_6_0): Voice memory recorded
    const hasVoice = items.some(i => i.type === 'voice' || (i.audioUrl && i.audioUrl.length > 0));
    if (hasVoice && !unlockedIds['generated_6_0']) {
      unlock('generated_6_0');
    }

    // Kinetoscope Keeper (generated_7_0): Movie/video/film notes logged
    const hasFilms = items.some(i => i.type === 'film' || i.type === 'video');
    if (hasFilms && !unlockedIds['generated_7_0']) {
      unlock('generated_7_0');
    }
  }, [items, unlockedIds, unlock]);

  const triggerSerendipity = useCallback(() => {
    if (!unlockedIds['wandering_mind']) {
      unlock('wandering_mind');
    }
  }, [unlockedIds, unlock]);

  const triggerPlaygroundConversation = useCallback(() => {
    if (!unlockedIds['mind_meld']) {
      unlock('mind_meld');
    }
  }, [unlockedIds, unlock]);

  const triggerThemeChange = useCallback(() => {
    if (!unlockedIds['transmuter']) {
      unlock('transmuter');
    }
  }, [unlockedIds, unlock]);

  // Combine definitions with unlock status
  const allAchievements: Achievement[] = ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlockedAt: unlockedIds[ach.id]
  }));

  return {
    achievements: allAchievements,
    activeToast: toastQueue.length > 0 ? toastQueue[0] : null,
    dismissToast,
    triggerSerendipity,
    triggerPlaygroundConversation,
    triggerThemeChange
  };
}
