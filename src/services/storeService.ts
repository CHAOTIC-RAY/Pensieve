import { Client, Databases, ID } from 'appwrite';

// @ts-ignore
const endpoint = import.meta.env.VITE_STORE_APPWRITE_ENDPOINT;
// @ts-ignore
const projectId = import.meta.env.VITE_STORE_APPWRITE_PROJECT_ID;
// @ts-ignore
const databaseId = import.meta.env.VITE_STORE_APPWRITE_DATABASE_ID;
// @ts-ignore
const collectionId = import.meta.env.VITE_STORE_APPWRITE_COLLECTION_ID;

export interface StoreItem {
  $id?: string;
  name: string;
  type: 'effect' | 'nametag' | 'theme' | 'other';
  description: string;
  price: number;
  effectId: string; // The ID of the effect applied (e.g. "search-neon")
  imageUrl?: string;
}

// Fallback mock items
const MOCK_ITEMS: StoreItem[] = [
  {
    $id: 'item-glass-ui',
    name: 'Frosted Glass UI',
    type: 'theme',
    description: 'A premium semi-transparent frosted glass aesthetic for all workspace cards.',
    price: 300,
    effectId: 'theme-glass'
  },
  {
    $id: 'item-crt-effect',
    name: 'CRT Retro Scanlines',
    type: 'effect',
    description: 'Adds an immersive vintage CRT monitor scanline overlay to your entire neural vault.',
    price: 500,
    effectId: 'effect-crt'
  },
  {
    $id: 'item-widget-weather',
    name: 'Neural Weather Widget',
    type: 'other',
    description: 'Unlock a dynamic weather status in your omnibar based on your neural focus.',
    price: 800,
    effectId: 'widget-weather'
  },
  {
    $id: 'item-border-neon',
    name: 'Neon Avatar Pulse',
    type: 'effect',
    description: 'Surround your identity with a breathing neon glow. Fully customizable color.',
    price: 250,
    effectId: 'avatar-glow'
  },
  {
    $id: 'item-search-glass',
    name: 'Crystal Search',
    type: 'effect',
    description: 'Transform your search bar into a refractive crystal slab.',
    price: 350,
    effectId: 'search-glass'
  },
  {
    $id: 'item-icon-royal',
    name: 'Royal Crest Icon',
    type: 'other',
    description: 'Replace your default avatar with a premium golden neural crest.',
    price: 450,
    effectId: 'icon-royal'
  },
  {
    $id: 'item-rank-insignia',
    name: 'Neural Rank Insignia',
    type: 'effect',
    description: 'A dynamic, evolving avatar border that grows stronger as you gain XP. Bronze, Silver, Gold, Platinum, and Neural tiers.',
    price: 0,
    effectId: 'rank-insignia'
  },
  {
    $id: '1',
    name: 'Neon Search Glow',
    type: 'effect',
    description: 'Adds a vibrant neon glow to your search bar when active.',
    price: 50,
    effectId: 'search-neon'
  },
  {
    $id: 'item-aura-aurora',
    name: 'Aurora Aura',
    type: 'effect',
    description: 'Soft northern-lights wash across your vault — teal, violet, and rose drifting slowly.',
    price: 400,
    effectId: 'aura-aurora'
  },
  {
    $id: 'item-aura-ember',
    name: 'Ember Glow',
    type: 'effect',
    description: 'Warm amber and coral edge lighting — like candlelight around your mind.',
    price: 350,
    effectId: 'aura-ember'
  },
  {
    $id: 'item-aura-ocean',
    name: 'Ocean Depths',
    type: 'effect',
    description: 'Cool indigo–cyan ambient aura for a calm, deep-focus atmosphere.',
    price: 350,
    effectId: 'aura-ocean'
  },
  {
    $id: 'item-aura-mist',
    name: 'Morning Mist',
    type: 'effect',
    description: 'Gentle vignette fog that softens the edges of your workspace.',
    price: 280,
    effectId: 'aura-mist'
  },
  {
    $id: 'item-aura-sunset',
    name: 'Sunset Bloom',
    type: 'effect',
    description: 'Peach and rose gradient bloom for a warm, editorial evening mood.',
    price: 380,
    effectId: 'aura-sunset'
  },
  {
    $id: 'item-film-grain',
    name: 'Film Grain',
    type: 'effect',
    description: 'Subtle cinematic grain overlay — tactile, analog, quietly premium.',
    price: 220,
    effectId: 'effect-film-grain'
  },
  {
    $id: 'item-matrix-rain',
    name: 'Digital Rain',
    type: 'effect',
    description: 'Whisper-quiet matrix glyphs falling behind your vault (very subtle).',
    price: 550,
    effectId: 'effect-matrix'
  },
  {
    $id: 'item-particles',
    name: 'Dust Motes',
    type: 'effect',
    description: 'Floating light particles that drift slowly through the workspace air.',
    price: 320,
    effectId: 'effect-particles'
  },
  {
    $id: 'item-card-halo',
    name: 'Card Halo',
    type: 'effect',
    description: 'Soft colored halo blooms behind mind cards when you hover.',
    price: 300,
    effectId: 'card-halo'
  },
  {
    $id: 'item-avatar-orbit',
    name: 'Orbital Ring',
    type: 'effect',
    description: 'Tiny accent dots orbit your profile avatar like a micro solar system.',
    price: 420,
    effectId: 'avatar-orbit'
  },
  {
    $id: 'item-search-pulse',
    name: 'Search Pulse',
    type: 'effect',
    description: 'A soft breathing ring around the omnibar — calm focus cue while searching.',
    price: 180,
    effectId: 'search-pulse'
  },
  {
    $id: 'item-sparkle-cursor',
    name: 'Sparkle Trail',
    type: 'effect',
    description: 'Adds a subtle sparkle shimmer to interactive surfaces and the omnibar edge.',
    price: 260,
    effectId: 'effect-sparkle'
  },
  {
    $id: 'item-theme-neko',
    name: 'Neko Café Theme',
    type: 'theme',
    description: 'Pastel sakura workspace — soft blush surfaces, mint accents, and cozy cat-café vibes.',
    price: 420,
    effectId: 'theme-neko'
  },
  {
    $id: 'item-effect-neko',
    name: 'Dancing Neko',
    type: 'effect',
    description: 'A tiny dancing cat buddy that bounces in the corner while you capture thoughts.',
    price: 380,
    effectId: 'effect-neko'
  }
];

export function isStoreAppwriteConfigured() {
  return !!(endpoint && projectId && databaseId && collectionId);
}

export async function fetchStoreItems(): Promise<StoreItem[]> {
  if (!isStoreAppwriteConfigured()) {
    console.log('[StoreService] Appwrite not configured. Using mock items.');
    return MOCK_ITEMS;
  }
  
  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
      
    const databases = new Databases(client);
    const response = await databases.listDocuments(databaseId, collectionId);
    
    // Map to expected interface
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: (doc as any).name,
      type: (doc as any).type,
      description: (doc as any).description,
      price: (doc as any).price,
      effectId: (doc as any).effectId,
      imageUrl: (doc as any).imageUrl
    }));
  } catch (err) {
    console.error('[StoreService] Error fetching items:', err);
    return MOCK_ITEMS;
  }
}

export async function addStoreItem(item: Omit<StoreItem, '$id'>): Promise<StoreItem | null> {
  if (!isStoreAppwriteConfigured()) {
    console.warn('[StoreService] Cannot add item, Appwrite not configured.');
    return null;
  }

  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
      
    const databases = new Databases(client);
    
    const response = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      item
    );
    
    return {
      $id: response.$id,
      name: (response as any).name,
      type: (response as any).type,
      description: (response as any).description,
      price: (response as any).price,
      effectId: (response as any).effectId,
      imageUrl: (response as any).imageUrl
    };
  } catch (err) {
    console.error('[StoreService] Error adding item:', err);
    return null;
  }
}
