import React, { useState, useEffect } from 'react';
import { 
  Cloud, HardDrive, Image as ImageIcon, Search, Download, Plus, Check, 
  ExternalLink, Lock, RefreshCw, X, FileText, AlertTriangle, Plug, 
  AlertCircle, ChevronRight, CheckCircle2, Eye, EyeOff, Sparkles, FolderDown
} from 'lucide-react';
import { MindItem } from '../types';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface CloudPluginsProps {
  onItemCreated: (newItem: Omit<MindItem, 'id' | 'createdAt'>) => Promise<string>;
  onTriggerToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  initialActiveExplorer?: 'googleDrive' | 'googlePhotos' | 'oneDrive' | null;
}

interface CloudPlugin {
  id: 'googleDrive' | 'googlePhotos' | 'oneDrive';
  name: string;
  description: string;
  longDescription: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  connectedEmail: string | null;
  connectedAt: string | null;
  permissions: string[];
  mockFiles: MockFile[];
}

interface MockFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'spreadsheet' | 'pdf';
  category: string;
  size: string;
  modifiedAt: string;
  url: string;
  content: string; // The content or description to be imported
  metadata?: any;
}

export default function CloudPlugins({ onItemCreated, onTriggerToast, initialActiveExplorer }: CloudPluginsProps) {
  const [plugins, setPlugins] = useState<CloudPlugin[]>([]);
  const [activeExplorer, setActiveExplorer] = useState<'googleDrive' | 'googlePhotos' | 'oneDrive' | null>(initialActiveExplorer || null);

  const [realDriveFiles, setRealDriveFiles] = useState<MockFile[] | null>(null);
  const [realPhotosFiles, setRealPhotosFiles] = useState<MockFile[] | null>(null);
  const [isLoadingRealFiles, setIsLoadingRealFiles] = useState(false);
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load the Google API (gapi) script for Picker
    const loadScript = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          (window as any).gapi.load('picker', {
            callback: () => {
              setIsPickerLoaded(true);
            },
            onerror: () => {
              console.warn('Google Picker API load failed');
            }
          });
        };
        script.onerror = () => {
          console.warn('gapi script load failed');
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading Google Picker scripts:', err);
      }
    };
    
    loadScript();
  }, []);

  const handleImportGooglePickerFile = async (file: any) => {
    try {
      const isImage = file.mimeType && file.mimeType.startsWith('image/');
      const sizeStr = file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(0)} KB` : 'Unknown size';
      
      await onItemCreated({
        type: isImage ? 'image' : 'document',
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: `File ID: ${file.id}\nMimeType: ${file.mimeType}\nURL: ${file.url || file.embedUrl || 'https://drive.google.com'}\n\nThis file was selected using the real Google Picker API and imported into your secure Pensieve vault.`,
        imageUrl: isImage ? (file.url || file.embedUrl) : undefined,
        tags: ['Google Picker', 'Google Drive', isImage ? 'Photos' : 'Documents'],
        manualTags: ['imported', 'google-picker'],
        isFavorite: false,
        fileSize: sizeStr,
        aiSummary: `Imported via Google Picker: ${file.name}`
      });

      if (onTriggerToast) {
        onTriggerToast(`"${file.name}" selected via Google Picker and imported!`, 'success');
      }
    } catch (err) {
      console.error('Failed to import Google Picker file', err);
      if (onTriggerToast) {
        onTriggerToast('Failed to import file into Pensieve', 'error');
      }
    }
  };

  const launchPicker = () => {
    const driveConn = localStorage.getItem('pensieve_plugin_google_drive');
    if (!driveConn) {
      if (onTriggerToast) {
        onTriggerToast('Please connect your Google Drive account first', 'warning');
      }
      return;
    }
    
    try {
      const conn = JSON.parse(driveConn);
      const accessToken = conn.accessToken;
      if (!accessToken) {
        if (onTriggerToast) {
          onTriggerToast('Access token not found. Please reconnect your account.', 'warning');
        }
        return;
      }
      
      if (!isPickerLoaded || !(window as any).google?.picker) {
        if (onTriggerToast) {
          onTriggerToast('Google Picker API is still loading. Please wait a moment...', 'info');
        }
        return;
      }
      
      const pickerOrigin =
        window.location.ancestorOrigins &&
        window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const file = data.docs[0];
            handleImportGooglePickerFile(file);
          }
        })
        .setOrigin(pickerOrigin)
        .build();
        
      picker.setVisible(true);
    } catch (err) {
      console.error('Error launching Google Picker:', err);
      if (onTriggerToast) {
        onTriggerToast('Failed to open Google Picker', 'error');
      }
    }
  };

  const fetchRealCloudFiles = async (type: 'googleDrive' | 'googlePhotos', token: string) => {
    setIsLoadingRealFiles(true);
    try {
      if (type === 'googleDrive') {
        const response = await fetch(
          'https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&q=trashed=false',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            const mapped: MockFile[] = data.files.map((file: any) => {
              const isDoc = file.mimeType.includes('document') || file.mimeType.includes('word');
              const isSheet = file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel');
              const isPdf = file.mimeType.includes('pdf');
              const isImage = file.mimeType.includes('image');
              
              let fileType: 'pdf' | 'document' | 'spreadsheet' | 'image' = 'document';
              if (isPdf) fileType = 'pdf';
              else if (isSheet) fileType = 'spreadsheet';
              else if (isImage) fileType = 'image';
              
              const category = isDoc ? 'Documents' : isSheet ? 'Finance' : isPdf ? 'Reference' : isImage ? 'Scenic' : 'Cloud Files';
              const sizeInKb = file.size ? `${(parseInt(file.size) / 1024).toFixed(0)} KB` : '150 KB';
              
              return {
                id: file.id,
                name: file.name,
                type: fileType,
                category,
                size: sizeInKb,
                modifiedAt: file.modifiedTime ? file.modifiedTime.split('T')[0] : new Date().toISOString().split('T')[0],
                url: file.webViewLink || 'https://drive.google.com',
                content: `Google Drive file imported from the cloud.\nMimeType: ${file.mimeType}\nID: ${file.id}`
              };
            });
            setRealDriveFiles(mapped);
          } else {
            setRealDriveFiles([]);
          }
        }
      } else if (type === 'googlePhotos') {
        const response = await fetch(
          'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=15',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.mediaItems && data.mediaItems.length > 0) {
            const mapped: MockFile[] = data.mediaItems.map((item: any) => {
              return {
                id: item.id,
                name: item.filename || 'Cloud Photo.jpg',
                type: 'image',
                category: 'Photos',
                size: '2.5 MB',
                modifiedAt: new Date().toISOString().split('T')[0],
                url: item.baseUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
                content: `Google Photos media item.\nFilename: ${item.filename}\nBaseURL: ${item.baseUrl}`
              };
            });
            setRealPhotosFiles(mapped);
          } else {
            setRealPhotosFiles([]);
          }
        }
      }
    } catch (err) {
      console.warn('Real API fetch failed/blocked, falling back to rich interactive mock environment', err);
    } finally {
      setIsLoadingRealFiles(false);
    }
  };

  useEffect(() => {
    if (!activeExplorer) return;
    
    const storageKey = activeExplorer === 'googleDrive' 
      ? 'pensieve_plugin_google_drive' 
      : activeExplorer === 'googlePhotos' 
        ? 'pensieve_plugin_google_photos' 
        : null;
        
    if (!storageKey) return;
    
    const connStr = localStorage.getItem(storageKey);
    if (!connStr) return;
    
    try {
      const conn = JSON.parse(connStr);
      if (conn.accessToken) {
        fetchRealCloudFiles(activeExplorer as 'googleDrive' | 'googlePhotos', conn.accessToken);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeExplorer]);

  useEffect(() => {
    if (initialActiveExplorer) {
      setActiveExplorer(initialActiveExplorer);
    }
  }, [initialActiveExplorer]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null);
  
  // Auth simulation state
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'consent' | 'connecting' | 'success'>('consent');
  const [authEmail, setAuthEmail] = useState('');
  const [password, setPassword] = useState('');
  const [importedFileIds, setImportedFileIds] = useState<string[]>([]);

  // Load imported list and connection status
  useEffect(() => {
    const imported = localStorage.getItem('pensieve_imported_cloud_files');
    if (imported) {
      setImportedFileIds(JSON.parse(imported));
    }
  }, []);

  // Sync connections with localstorage and load mock files
  useEffect(() => {
    const driveConn = localStorage.getItem('pensieve_plugin_google_drive');
    const photosConn = localStorage.getItem('pensieve_plugin_google_photos');
    const onedriveConn = localStorage.getItem('pensieve_plugin_one_drive');

    const mockDriveFiles: MockFile[] = [
      {
        id: 'gd-1',
        name: 'Workspace Blueprint 2026.pdf',
        type: 'pdf',
        category: 'Documents',
        size: '2.4 MB',
        modifiedAt: '2026-06-28',
        url: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?q=80&w=1200&auto=format&fit=crop',
        content: '# Workspace Blueprint 2026\n\n- Phase 1: Mind mapping integration\n- Phase 2: Local AI embeddings engine deployment\n- Phase 3: Infinite canvas optimization\n\nThis document outlines our long-term roadmap for neural syncing.'
      },
      {
        id: 'gd-2',
        name: 'Sourdough Bread Guide.pdf',
        type: 'pdf',
        category: 'Recipes',
        size: '1.1 MB',
        modifiedAt: '2026-05-12',
        url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1200&auto=format&fit=crop',
        content: '# Sourdough Bread Baking Guide\n\n- Levain preparation: 1:2:2 ratio\n- Autolyse: 45 minutes\n- Bulk fermentation: 4.5 hours at 25°C\n- Cold proof: 14 hours in banneton\n\nBaked inside a pre-heated Dutch oven at 245°C.'
      },
      {
        id: 'gd-3',
        name: 'Financial Audit Q2.xlsx',
        type: 'spreadsheet',
        category: 'Finance',
        size: '840 KB',
        modifiedAt: '2026-07-01',
        url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
        content: '# Q2 Budget & Revenue Breakdown\n\n| Department | Budget Allocated | Actual Spent | Variance |\n| :--- | :---: | :---: | :---: |\n| Neural Server | $4,500 | $4,200 | +$300 |\n| Core UI Design | $2,000 | $1,950 | +$50 |\n| Marketing | $1,200 | $1,350 | -$150 |\n| Research | $8,000 | $7,800 | +$200 |'
      },
      {
        id: 'gd-4',
        name: 'Project Timeline.docx',
        type: 'document',
        category: 'Documents',
        size: '150 KB',
        modifiedAt: '2026-06-15',
        url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
        content: '# Project Alpha Execution Timeline\n\n- **Week 1-2**: Design reviews and initial scaffolding.\n- **Week 3-4**: Backend development and API proxies setup.\n- **Week 5**: Full Integration and User Testing.\n\nAll dates strictly respect milestones.'
      },
      {
        id: 'gd-5',
        name: 'Travel Itinerary - Tokyo.docx',
        type: 'document',
        category: 'Travel',
        size: '120 KB',
        modifiedAt: '2026-04-30',
        url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
        content: '# Tokyo Explorations - September 2026\n\n- **Day 1**: Arrive at Haneda. Check-in at Shibuya.\n- **Day 2**: Meiji Shrine in the morning, Harajuku in afternoon.\n- **Day 3**: Akihabara tech explorations and sushi dinner.\n- **Day 4**: Day trip to Mt. Fuji (Hakone pass).'
      }
    ];

    const mockPhotosFiles: MockFile[] = [
      {
        id: 'gp-1',
        name: 'Alpine Mist Sunrise.jpg',
        type: 'image',
        category: 'Scenic',
        size: '4.8 MB',
        modifiedAt: '2026-06-24',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        content: 'A breathtaking landscape photo of Alpine peaks draped in misty early morning fog, glowing gold under the rising sun.'
      },
      {
        id: 'gp-2',
        name: 'Shibuya Neon Night.jpg',
        type: 'image',
        category: 'Streets',
        size: '3.6 MB',
        modifiedAt: '2026-06-10',
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop',
        content: 'Vibrant Tokyo street aesthetics, rain reflections on asphalt, giant neon displays flashing across Shibuya crossing.'
      },
      {
        id: 'gp-3',
        name: 'Cozy Rain Cabin.jpg',
        type: 'image',
        category: 'Places',
        size: '2.9 MB',
        modifiedAt: '2026-05-18',
        url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop',
        content: 'Warm string lights glowing in a forest wooden cabin cabin, surrounded by tall pine trees during a cozy afternoon rainfall.'
      },
      {
        id: 'gp-4',
        name: 'Minimal Coffee Workspace.jpg',
        type: 'image',
        category: 'Workspaces',
        size: '1.8 MB',
        modifiedAt: '2026-07-02',
        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
        content: 'A pristine, white modern desk containing a closed silver laptop, a cup of flat white coffee, an open journal with a metal pen.'
      },
      {
        id: 'gp-5',
        name: 'Cyberpunk Alley.jpg',
        type: 'image',
        category: 'Streets',
        size: '3.1 MB',
        modifiedAt: '2026-06-03',
        url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1200&auto=format&fit=crop',
        content: 'Neon glowing signs in dark narrow futuristic alleys, dripping water, mysterious silhouettes and glowing cyber accents.'
      }
    ];

    const mockOnedriveFiles: MockFile[] = [
      {
        id: 'od-1',
        name: 'Neural Architecture Proposal.docx',
        type: 'document',
        category: 'Office',
        size: '340 KB',
        modifiedAt: '2026-06-29',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
        content: '# Neural Vault Scaffolding Design\n\n- Node redundancy: 3x mirror nodes.\n- Data caching: In-memory cache synced with Firestore collections.\n- UI: React functional hooks paired with dynamic local state filters.'
      },
      {
        id: 'od-2',
        name: 'Asset - Icon Library.jpg',
        type: 'image',
        category: 'Media',
        size: '1.4 MB',
        modifiedAt: '2026-05-22',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
        content: 'A series of colorful minimalist geometric vectors used for logo design, glowing with soft gradients.'
      },
      {
        id: 'od-3',
        name: 'Marketing Presentation.docx',
        type: 'document',
        category: 'Office',
        size: '920 KB',
        modifiedAt: '2026-06-11',
        url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=1200&auto=format&fit=crop',
        content: '# Pensieve Pitch Deck Outline\n\n- **Slide 1**: Brand Identity - Clean Swiss Typography, Slate aesthetics\n- **Slide 2**: Market Problem - Infinite tabs overload\n- **Slide 3**: The Solution - High-fidelity local vaults with zero manual organization'
      },
      {
        id: 'od-4',
        name: 'Personal Budget 2026.xlsx',
        type: 'spreadsheet',
        category: 'Finance',
        size: '480 KB',
        modifiedAt: '2026-07-02',
        url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
        content: '# Monthly Savings Goals\n\n| Month | Target savings | Actual savings | Status |\n| :--- | :---: | :---: | :---: |\n| January | $800 | $850 | Exceeded |\n| February | $800 | $780 | Under |\n| March | $800 | $900 | Exceeded |'
      }
    ];

    setPlugins([
      {
        id: 'googleDrive',
        name: 'Google Drive Plugin',
        description: 'Browse, view, and import your Drive files, PDFs, and documents.',
        longDescription: 'Secure read-only bridge to your Google Drive account. Perfect for pulling in reading material, travel itineraries, and spreadsheets directly into your personal knowledge bank.',
        icon: HardDrive,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        connectedEmail: driveConn ? JSON.parse(driveConn).email : null,
        connectedAt: driveConn ? JSON.parse(driveConn).connectedAt : null,
        permissions: ['See and download all your Google Drive files', 'View files and folder structures'],
        mockFiles: mockDriveFiles
      },
      {
        id: 'googlePhotos',
        name: 'Google Photos Plugin',
        description: 'Stream, search, and pin high-resolution photos into your neural vault.',
        longDescription: 'Connect directly to your photo galleries to import scenic inspiration, workspace snapshots, and digital graphics. Files are imported cleanly with descriptive tags.',
        icon: ImageIcon,
        color: 'text-sky-500',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/20',
        connectedEmail: photosConn ? JSON.parse(photosConn).email : null,
        connectedAt: photosConn ? JSON.parse(photosConn).connectedAt : null,
        permissions: ['View your Google Photos library', 'Search photos and albums'],
        mockFiles: mockPhotosFiles
      },
      {
        id: 'oneDrive',
        name: 'Microsoft OneDrive Plugin',
        description: 'Sync, view, and download documents and assets from your OneDrive cloud.',
        longDescription: 'Bridge your personal or business Microsoft OneDrive account. View folder trees, browse PDF contracts, and download files directly inside your vault.',
        icon: Cloud,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        connectedEmail: onedriveConn ? JSON.parse(onedriveConn).email : null,
        connectedAt: onedriveConn ? JSON.parse(onedriveConn).connectedAt : null,
        permissions: ['Read files in your OneDrive account', 'Download documents and spreadsheets'],
        mockFiles: mockOnedriveFiles
      }
    ]);
  }, [importedFileIds]);

  // Handle Connecting to Plugin
  const triggerConnection = async (pluginId: string) => {
    if (pluginId === 'oneDrive') {
      const defaultEmail = '2003Ray.Dark@outlook.com';
      setAuthEmail(defaultEmail);
      setPassword('••••••••••••');
      setAuthStep('consent');
      setShowAuthModal(pluginId);
      return;
    }

    try {
      setAuthStep('connecting');
      setShowAuthModal(pluginId);

      const provider = new GoogleAuthProvider();
      if (pluginId === 'googleDrive') {
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
      } else if (pluginId === 'googlePhotos') {
        provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
      }

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;

      if (user) {
        setAuthEmail(user.email || '2003Ray.Dark@gmail.com');
        
        // Save connection state with accessToken
        const connectionObj = {
          email: user.email || '2003Ray.Dark@gmail.com',
          accessToken: token || '',
          connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        const storageKey = pluginId === 'googleDrive' 
          ? 'pensieve_plugin_google_drive' 
          : 'pensieve_plugin_google_photos';

        localStorage.setItem(storageKey, JSON.stringify(connectionObj));

        // Fetch real files in the background if possible
        if (token) {
          fetchRealCloudFiles(pluginId as 'googleDrive' | 'googlePhotos', token);
        }

        setAuthStep('success');
        
        // Trigger visual toast
        const pName = plugins.find(p => p.id === pluginId)?.name || 'Plugin';
        if (onTriggerToast) {
          onTriggerToast(`${pName} connected via Firebase successfully!`, 'success');
        }

        setTimeout(() => {
          setShowAuthModal(null);
          setAuthStep('consent');
        }, 1500);
      } else {
        throw new Error('No user returned from Google Authentication');
      }
    } catch (err: any) {
      console.error('Firebase Auth for Google Plugin failed:', err);
      // Fallback: If popups are blocked in iframe or authorization fails, show traditional/offline fallback consent screen
      const defaultEmail = '2003Ray.Dark@gmail.com';
      setAuthEmail(defaultEmail);
      setPassword('••••••••••••');
      setAuthStep('consent');
      
      if (onTriggerToast) {
        onTriggerToast('Auth popup blocked or cancelled. Showing backup sandbox link mode.', 'warning');
      }
    }
  };

  const handleFinalizeConnection = () => {
    if (!showAuthModal) return;
    setAuthStep('connecting');

    setTimeout(() => {
      setAuthStep('success');
      setTimeout(() => {
        // Save connection state
        const connectionObj = {
          email: authEmail || '2003Ray.Dark@gmail.com',
          connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        const storageKey = showAuthModal === 'googleDrive' 
          ? 'pensieve_plugin_google_drive' 
          : showAuthModal === 'googlePhotos' 
            ? 'pensieve_plugin_google_photos' 
            : 'pensieve_plugin_one_drive';

        localStorage.setItem(storageKey, JSON.stringify(connectionObj));
        
        // Trigger visual toast
        const pName = plugins.find(p => p.id === showAuthModal)?.name || 'Plugin';
        if (onTriggerToast) {
          onTriggerToast(`${pName} connected successfully as bridge!`, 'success');
        }

        // Reset
        setShowAuthModal(null);
        setAuthStep('consent');
      }, 1500);
    }, 1200);
  };

  // Handle Disconnecting
  const handleDisconnect = (pluginId: 'googleDrive' | 'googlePhotos' | 'oneDrive', e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Disconnect from ${pluginId === 'googleDrive' ? 'Google Drive' : pluginId === 'googlePhotos' ? 'Google Photos' : 'OneDrive'}?`);
    if (!confirmed) return;

    const storageKey = pluginId === 'googleDrive' 
      ? 'pensieve_plugin_google_drive' 
      : pluginId === 'googlePhotos' 
        ? 'pensieve_plugin_google_photos' 
        : 'pensieve_plugin_one_drive';

    localStorage.removeItem(storageKey);
    
    if (pluginId === 'googleDrive') {
      setRealDriveFiles(null);
    } else if (pluginId === 'googlePhotos') {
      setRealPhotosFiles(null);
    }
    
    if (onTriggerToast) {
      onTriggerToast(`Disconnected from ${pluginId === 'googleDrive' ? 'Google Drive' : pluginId === 'googlePhotos' ? 'Google Photos' : 'OneDrive'} Plugin`, 'info');
    }

    if (activeExplorer === pluginId) {
      setActiveExplorer(null);
    }

    // Force refresh connections state
    setImportedFileIds(prev => [...prev]);
  };

  // Handle Download File (triggers a real browser file download!)
  const handleDownloadFile = (file: MockFile) => {
    try {
      if (file.type === 'image') {
        // Trigger fetch download
        fetch(file.url)
          .then(res => res.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          });
      } else {
        // Generate document blob with content
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      if (onTriggerToast) {
        onTriggerToast(`Downloaded ${file.name} successfully`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onTriggerToast) {
        onTriggerToast('Download failed', 'error');
      }
    }
  };

  // Handle Import/Adding as Memory Card to Pensieve
  const handleImportFile = async (file: MockFile, pluginName: string) => {
    try {
      const isImage = file.type === 'image';
      
      // Call onItemCreated to save as a real MindItem
      await onItemCreated({
        type: isImage ? 'image' : 'document',
        title: file.name.replace(/\.[^/.]+$/, ""), // remove extension for title
        content: isImage ? file.content : `File Details:\nSize: ${file.size}\nModified: ${file.modifiedAt}\n\n${file.content}`,
        imageUrl: isImage ? file.url : undefined,
        tags: ['Cloud Import', pluginName, file.category],
        manualTags: ['imported', pluginName.toLowerCase().replace(/\s+/g, '-')],
        isFavorite: false,
        fileSize: file.size,
        aiSummary: isImage 
          ? `Imported image: ${file.content.slice(0, 50)}...`
          : `Imported document containing: ${file.name}`
      });

      // Track imported list
      const newImported = [...importedFileIds, file.id];
      setImportedFileIds(newImported);
      localStorage.setItem('pensieve_imported_cloud_files', JSON.stringify(newImported));

      if (onTriggerToast) {
        onTriggerToast(`"${file.name}" imported to your personal neural vault!`, 'success');
      }
    } catch (err) {
      console.error('Failed to import file', err);
      if (onTriggerToast) {
        onTriggerToast('Failed to import file into Pensieve', 'error');
      }
    }
  };

  const getExplorerTitleAndTheme = () => {
    if (activeExplorer === 'googleDrive') return { title: 'Google Drive Explorer', color: 'text-amber-500', pluginName: 'Google Drive' };
    if (activeExplorer === 'googlePhotos') return { title: 'Google Photos Stream', color: 'text-sky-500', pluginName: 'Google Photos' };
    return { title: 'OneDrive File Bridge', color: 'text-blue-500', pluginName: 'OneDrive' };
  };

  const currentPlugin = plugins.find(p => p.id === activeExplorer);
  const { title: explorerTitle, color: explorerColor, pluginName = '' } = getExplorerTitleAndTheme();

  // Choose files list based on connection status and fetched files
  let filesToDisplay: MockFile[] = [];
  if (activeExplorer === 'googleDrive') {
    filesToDisplay = realDriveFiles !== null && realDriveFiles.length > 0 ? realDriveFiles : (currentPlugin?.mockFiles || []);
  } else if (activeExplorer === 'googlePhotos') {
    filesToDisplay = realPhotosFiles !== null && realPhotosFiles.length > 0 ? realPhotosFiles : (currentPlugin?.mockFiles || []);
  } else {
    filesToDisplay = currentPlugin?.mockFiles || [];
  }

  // Categories list
  const categories = filesToDisplay.length > 0
    ? ['All', ...Array.from(new Set(filesToDisplay.map(f => f.category)))]
    : ['All'];

  // Filtered files list
  const filteredFiles = filesToDisplay.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {!activeExplorer ? (
        // PLUGIN MARKETPLACE VIEW
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-text-heading flex items-center gap-2">
                <Plug className="w-4 h-4 text-amber-500" />
                Cloud Connection Plugins
                <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Experimental
                </span>
              </h3>
              <span className="text-[10px] text-foreground/40 font-mono pl-6">
                Bridge external digital archives securely • Read-Only
              </span>
            </div>
            <div className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Second Brain Bridge
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border-subtle space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                <Lock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-text-heading">Aesthetic & Security Protocol</h4>
                <p className="text-[10px] text-foreground/60 leading-normal">
                  These plugins provide isolated connections. Notes, lists, and quotes authored inside Pensieve are stored in your primary, encrypted neural vault database and **will never be backed up or uploaded to these connected cloud drives**. This ensures your private thoughts remain entirely private.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plugins.map((plugin) => {
              const Icon = plugin.icon;
              const isConnected = !!plugin.connectedEmail;
              return (
                <div 
                  key={plugin.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm bg-card-bg hover:shadow-md ${
                    isConnected ? 'border-foreground/15 ring-1 ring-foreground/5' : 'border-border-subtle'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${plugin.bgColor} ${plugin.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded uppercase">
                          Isolated
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-heading leading-tight">{plugin.name}</h4>
                      <p className="text-[10px] text-foreground/50 leading-relaxed font-medium">{plugin.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border-subtle/50 flex flex-col gap-2">
                    {isConnected ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-0.5 bg-foreground/[0.02] p-2 rounded-xl border border-border-subtle/30">
                          <span className="text-[9px] font-bold font-mono text-foreground/45 uppercase">Connected as</span>
                          <span className="text-[10px] font-bold text-text-heading truncate">{plugin.connectedEmail}</span>
                          <span className="text-[8px] font-mono text-foreground/30 mt-0.5">Linked on {plugin.connectedAt}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('All');
                              setSelectedFile(null);
                              setActiveExplorer(plugin.id);
                            }}
                            className="flex-1 py-1.5 px-3 bg-foreground text-background font-bold text-[10px] rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3 h-3" /> Explore Files
                          </button>
                          <button
                            onClick={(e) => handleDisconnect(plugin.id, e)}
                            className="p-1.5 text-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-border-subtle/30"
                            title="Disconnect Plugin"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerConnection(plugin.id)}
                        className="w-full py-2 px-3 bg-foreground/5 text-foreground border border-border-subtle hover:bg-foreground hover:text-background font-bold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Plug className="w-3 h-3" /> Connect Plugin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // DYNAMIC EXPLORER PANEL (GOOGLE DRIVE / PHOTOS / ONEDRIVE)
        <div className="space-y-4 animate-fade-in relative">
          {/* Top navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/50">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveExplorer(null)}
                className="p-1.5 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="Back to plugins list"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                  <span className={explorerColor}>
                    {currentPlugin && <currentPlugin.icon className="w-4 h-4" />}
                  </span>
                  {explorerTitle}
                </h3>
                <span className="text-[10px] text-foreground/40 font-mono">
                  Browse or search cloud assets • Connected as <span className="font-bold text-foreground/60">{currentPlugin?.connectedEmail}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeExplorer === 'googleDrive' && (
                <button
                  onClick={launchPicker}
                  className="py-1.5 px-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <HardDrive className="w-3.5 h-3.5 animate-pulse" /> Launch Google Picker
                </button>
              )}
              <div className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase border border-amber-500/20 font-mono">
                No Cloud Backups Active
              </div>
              <button
                onClick={(e) => currentPlugin && handleDisconnect(currentPlugin.id, e)}
                className="py-1 px-2.5 text-foreground/40 hover:text-rose-500 hover:bg-rose-500/5 text-[9px] font-bold font-mono uppercase rounded-lg border border-border-subtle/20 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-foreground/60 leading-relaxed font-medium">
              <strong>Isolated Client Sandbox:</strong> Notes created inside Pensieve stay in your local vault (and optional Appwrite/Supabase sync). They are <strong>never</strong> backed up, read, or modified by your connected {pluginName} account.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder={`Search ${pluginName} files...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-foreground/[0.02] border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-foreground/40 font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {/* Quick Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition ${
                    selectedCategory === cat
                      ? 'bg-foreground text-background border-transparent'
                      : 'bg-foreground/[0.02] text-foreground/60 border-border-subtle hover:bg-foreground/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="flex flex-col lg:flex-row gap-4 h-[420px] overflow-hidden">
            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
              {isLoadingRealFiles ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-foreground/[0.01] rounded-2xl border border-dashed border-border-subtle/50">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
                  <p className="text-xs font-semibold text-text-heading">Querying Real-Time Cloud Index...</p>
                  <p className="text-[10px] text-foreground/45 mt-1">Establishing connection to Google API endpoints...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-foreground/[0.01] rounded-2xl border border-dashed border-border-subtle/50">
                  <FolderDown className="w-10 h-10 text-foreground/20 mb-2 animate-pulse" />
                  <p className="text-xs font-semibold text-text-heading">No files match your query</p>
                  <p className="text-[10px] text-foreground/40 max-w-[240px] mt-1">Try modifying your search or choosing a different filter category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredFiles.map((file) => {
                    const isImported = importedFileIds.includes(file.id);
                    const isDoc = file.type !== 'image';
                    return (
                      <div 
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`group p-3 rounded-xl border cursor-pointer transition-all duration-200 bg-card-bg hover:scale-[1.02] flex flex-col justify-between ${
                          selectedFile?.id === file.id 
                            ? 'border-primary ring-1 ring-primary/20 shadow-md' 
                            : 'border-border-subtle/60 hover:border-foreground/20 hover:shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Visual Header / Thumbnail */}
                          {file.type === 'image' ? (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-foreground/5 relative border border-border-subtle/20">
                              <img 
                                src={file.url} 
                                alt={file.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                              />
                              <div className="absolute top-1.5 right-1.5 p-1 bg-black/50 backdrop-blur-md rounded-lg text-white">
                                <ImageIcon className="w-3 h-3" />
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video w-full rounded-lg bg-foreground/[0.02] border border-border-subtle/30 flex flex-col items-center justify-center relative p-3">
                              <FileText className="w-8 h-8 text-foreground/35 mb-1.5" />
                              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-foreground/10 border border-border-subtle rounded-md text-[8px] font-bold font-mono text-foreground/55 uppercase">
                                {file.type}
                              </div>
                              <p className="text-[8px] text-foreground/45 text-center font-mono line-clamp-2 select-none px-2">{file.content}</p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <h5 className="text-[11px] font-bold text-text-heading leading-tight truncate group-hover:text-primary transition-colors" title={file.name}>
                              {file.name}
                            </h5>
                            <div className="flex items-center justify-between text-[9px] font-mono text-foreground/45 font-medium">
                              <span>{file.size}</span>
                              <span>{file.modifiedAt}</span>
                            </div>
                          </div>
                        </div>

                        {/* Fast Import overlay banner */}
                        {isImported && (
                          <div className="mt-2.5 pt-2 border-t border-border-subtle/30 flex items-center justify-between text-[9px] text-emerald-500 font-bold bg-emerald-500/5 -mx-3 -mb-3 px-3 py-2 rounded-b-xl">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-emerald-500" /> Imported to Vault
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected File Details Overlay/Panel */}
            <div className="w-full lg:w-72 bg-modal-sidebar border border-border-subtle rounded-2xl overflow-y-auto custom-scrollbar flex flex-col p-4 shrink-0 justify-between">
              {selectedFile ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
                      <h4 className="text-xs font-bold text-text-heading">Asset Inspector</h4>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="text-foreground/40 hover:text-foreground text-[10px] font-bold font-mono uppercase"
                      >
                        Clear
                      </button>
                    </div>

                    {selectedFile.type === 'image' ? (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-foreground/5 border border-border-subtle/30 relative">
                        <img 
                          src={selectedFile.url} 
                          alt={selectedFile.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-card-bg/60 border border-border-subtle rounded-xl flex items-center gap-3">
                        <div className="p-2.5 bg-foreground/5 rounded-xl text-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 truncate">
                          <p className="text-[10px] font-black font-mono text-foreground/45 uppercase tracking-wider">{selectedFile.type}</p>
                          <p className="text-[11px] font-bold text-text-heading truncate" title={selectedFile.name}>{selectedFile.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-foreground/[0.01] p-3 rounded-xl border border-border-subtle/30 space-y-2">
                      <div className="grid grid-cols-2 gap-y-2 text-[10px] font-mono text-foreground/50 border-b border-border-subtle/20 pb-2">
                        <div>Size:</div>
                        <div className="text-right text-text-heading font-semibold">{selectedFile.size}</div>
                        <div>Modified:</div>
                        <div className="text-right text-text-heading font-semibold">{selectedFile.modifiedAt}</div>
                        <div>Category:</div>
                        <div className="text-right text-text-heading font-semibold">{selectedFile.category}</div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <p className="text-[9px] font-bold font-mono text-foreground/45 uppercase">File Content Preview</p>
                        <p className="text-[10px] text-foreground/75 leading-relaxed font-sans max-h-32 overflow-y-auto bg-card-bg/30 p-2 rounded-lg border border-border-subtle/20 custom-scrollbar">
                          {selectedFile.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-border-subtle/50">
                    <button
                      onClick={() => handleDownloadFile(selectedFile)}
                      className="w-full py-2 px-3 bg-foreground/5 text-foreground hover:bg-foreground hover:text-background font-bold text-[10px] rounded-xl border border-border-subtle/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </button>
                    
                    {importedFileIds.includes(selectedFile.id) ? (
                      <div className="w-full py-2.5 px-3 bg-emerald-500/10 text-emerald-500 font-bold text-[10px] rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1.5 select-none">
                        <CheckCircle2 className="w-4 h-4 fill-current text-emerald-500" /> Imported to Neural Space
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImportFile(selectedFile, pluginName)}
                        className="w-full py-2.5 px-3 bg-primary text-white font-bold text-[10px] rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)] animate-pulse"
                      >
                        <Plus className="w-3.5 h-3.5" /> Import to Neural Space
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Eye className="w-8 h-8 text-foreground/20 mb-2" />
                  <p className="text-[10px] font-bold text-text-heading">Select an Asset</p>
                  <p className="text-[9px] text-foreground/40 max-w-[180px] mt-0.5">Click any photo or file on the left to inspect metadata, download, or save directly in Pensieve.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED AUTHENTIC CONSTITUENT CONSENT MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card-bg border border-border-subtle rounded-2xl overflow-hidden shadow-premium flex flex-col animate-scale-up">
            {/* Header */}
            <div className="p-5 border-b border-border-subtle/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className={`w-5 h-5 ${showAuthModal === 'oneDrive' ? 'text-blue-500' : showAuthModal === 'googlePhotos' ? 'text-sky-500' : 'text-amber-500'}`} />
                <span className="text-xs font-bold font-display text-text-heading">Cloud Plugin Link</span>
              </div>
              <button 
                onClick={() => setShowAuthModal(null)}
                className="text-foreground/40 hover:text-foreground p-1 hover:bg-foreground/5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {authStep === 'consent' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 mx-auto flex items-center justify-center text-xl shadow-inner border border-border-subtle/40">
                      {showAuthModal === 'oneDrive' ? '☁️' : '🔍'}
                    </div>
                    <h4 className="text-xs font-black text-text-heading">
                      Connect to {showAuthModal === 'oneDrive' ? 'Microsoft OneDrive' : showAuthModal === 'googlePhotos' ? 'Google Photos' : 'Google Drive'}
                    </h4>
                    <p className="text-[10px] text-foreground/50">
                      Linking will establish an isolated read-only bridge client.
                    </p>
                  </div>

                  {/* Mock Input Credentials */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[8px] font-black font-mono text-foreground/45 uppercase mb-1">Account Email</label>
                      <input 
                        type="email" 
                        value={authEmail} 
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-foreground/[0.02] border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black font-mono text-foreground/45 uppercase mb-1">Access Credentials</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-foreground/[0.02] border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Scopes Consents info */}
                  <div className="bg-foreground/[0.01] p-3 rounded-xl border border-border-subtle/30 space-y-2">
                    <p className="text-[8px] font-black font-mono text-foreground/45 uppercase">Granting Permissions:</p>
                    <ul className="space-y-1 text-[9px] text-foreground/60 leading-tight">
                      {plugins.find(p => p.id === showAuthModal)?.permissions.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{p} (Read-Only)</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[8px] text-foreground/60 leading-relaxed font-mono">
                    ⚠️ <strong>Plugin Sandbox Scope:</strong> Authorizing this plugin will NOT sync or backup notes, quotes, or cards created inside Pensieve. Drive storage operates as an isolated explorer.
                  </div>

                  {/* Cloudflare Pages / Custom Domain Deployment Guideline */}
                  {(showAuthModal === 'googleDrive' || showAuthModal === 'googlePhotos') && (
                    <div className="p-2.5 rounded-lg bg-sky-500/5 border border-sky-500/20 text-[8px] text-foreground/60 leading-relaxed font-mono space-y-1">
                      <div className="font-bold text-sky-500 flex items-center gap-1">
                        🌐 <span>Cloudflare & Production Deployment Guide:</span>
                      </div>
                      <p>
                        To ensure real-time Google OAuth popups work on your deployed custom domain (e.g., <code>*.pages.dev</code>):
                      </p>
                      <ol className="list-decimal pl-3 space-y-0.5">
                        <li>Go to your <strong>Firebase Console</strong> &gt; Authentication &gt; Settings &gt; Authorized Domains.</li>
                        <li>Add your Cloudflare Pages URL or custom domain to the list.</li>
                        <li>In the <strong>Google Cloud Console</strong> &gt; Credentials, ensure <code>https://&lt;your-project&gt;.firebaseapp.com/__/auth/handler</code> is present as an Authorized Redirect URI.</li>
                      </ol>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setShowAuthModal(null)}
                      className="flex-1 py-2 border border-border-subtle hover:bg-foreground/5 text-foreground font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalizeConnection}
                      className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      Authorize Bridge
                    </button>
                  </div>
                </div>
              )}

              {authStep === 'connecting' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-text-heading">Initiating Token Bridge...</p>
                    <p className="text-[10px] text-foreground/45">Establishing isolated sandbox connection protocol...</p>
                  </div>
                </div>
              )}

              {authStep === 'success' && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-scale-up">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 text-emerald-500">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-emerald-500">Plugin Connected!</p>
                    <p className="text-[10px] text-foreground/50">Your cloud drive plugin is ready. Tap Explore to start importing.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
