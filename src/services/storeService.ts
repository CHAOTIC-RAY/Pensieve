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
    $id: '1',
    name: 'Neon Search Glow',
    type: 'effect',
    description: 'Adds a vibrant neon glow to your search bar when active.',
    price: 50,
    effectId: 'search-neon'
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
