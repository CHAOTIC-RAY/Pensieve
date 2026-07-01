import { Achievement } from '../types';
import { Sparkles, Brain, Palette, Archive, Heart, Bookmark, Compass } from 'lucide-react';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spark',
    title: 'First Spark',
    description: 'Save your first item.',
    rarity: 'Common',
    icon: Sparkles,
    xp: 10,
    image: 'https://images.unsplash.com/photo-1542451542907-6cf80ff362d6?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'wandering_mind',
    title: 'Wandering Mind',
    description: 'Use Serendipity to explore your thoughts.',
    rarity: 'Common',
    icon: Compass,
    xp: 50,
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d1b5?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Favorite at least 5 items.',
    rarity: 'Rare',
    icon: Heart,
    xp: 100,
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'colorful_thinker',
    title: 'Colorful Thinker',
    description: 'Save a color swatch.',
    rarity: 'Rare',
    icon: Palette,
    xp: 100,
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Save 3 articles or links.',
    rarity: 'Rare',
    icon: Bookmark,
    xp: 150,
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'deep_thinker',
    title: 'Deep Thinker',
    description: 'Let the Local AI analyze 5 items.',
    rarity: 'Epic',
    icon: Brain,
    xp: 300,
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: 'Amass a collection of 20 items.',
    rarity: 'Legendary',
    icon: Archive,
    xp: 500,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400&h=400'
  }
];
