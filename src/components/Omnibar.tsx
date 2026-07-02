/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, FileText, CheckSquare, Quote, 
  Palette, Link2, Image as ImageIcon, ArrowRight, X, Sparkles, Mic, Square,
  Film, Disc, ShoppingBag, Hash, Github, Slash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem, MindItemType } from '../types';

// Slash command definitions
const SLASH_COMMANDS = [
  { cmd: '/note', label: 'Note', desc: 'Create a text note', icon: FileText, color: 'text-blue-500', type: 'note' as MindItemType },
  { cmd: '/film', label: 'Film', desc: 'Save a movie card', icon: Film, color: 'text-purple-500', type: 'film' as MindItemType },
  { cmd: '/album', label: 'Album', desc: 'Save an album card', icon: Disc, color: 'text-indigo-500', type: 'album' as MindItemType },
  { cmd: '/quote', label: 'Quote', desc: 'Save a quote', icon: Quote, color: 'text-amber-500', type: 'quote' as MindItemType },
  { cmd: '/link', label: 'Link', desc: 'Bookmark a URL', icon: Link2, color: 'text-teal-500', type: 'link' as MindItemType },
  { cmd: '/color', label: 'Color', desc: 'Save a hex color swatch', icon: Palette, color: 'text-rose-500', type: 'color' as MindItemType },
  { cmd: '/todo', label: 'Todo', desc: 'Create a checklist', icon: CheckSquare, color: 'text-emerald-500', type: 'note' as MindItemType },
  { cmd: '/product', label: 'Product', desc: 'Save a product card', icon: ShoppingBag, color: 'text-orange-500', type: 'product' as MindItemType },
  { cmd: '/tag', label: 'Tag', desc: 'Search by tag', icon: Hash, color: 'text-neutral-500', type: null },
];

interface OmnibarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onItemCreated: (item: Omit<MindItem, 'id' | 'createdAt'>) => Promise<string>;
  onTriggerSerendipity: () => void;
  localAiEnabled?: boolean;
}

export default function Omnibar({ 
  searchQuery, 
  onSearchChange, 
  onItemCreated,
  onTriggerSerendipity,
  localAiEnabled = false
}: OmnibarProps) {
  const isUrl = (str: string) => {
    const clean = str.trim();
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .?=&+%-]*)*\/?$/i.test(clean) && (clean.includes('.') || clean.startsWith('http'));
  };

  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  const [isFocused, setIsFocused] = useState(false);
  const [composerType, setComposerType] = useState<MindItemType | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0);
  // Film composer state
  const [filmTitle, setFilmTitle] = useState('');
  const [filmYear, setFilmYear] = useState('');
  const [filmGenre, setFilmGenre] = useState('');
  const [filmDirector, setFilmDirector] = useState('');
  const [filmRating, setFilmRating] = useState('');
  const [filmRuntime, setFilmRuntime] = useState('');
  // Album composer state
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumYear, setAlbumYear] = useState('');
  // Product composer state
  const [productPrice, setProductPrice] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productBuyUrl, setProductBuyUrl] = useState('');
  
  // Composer form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; done: boolean }[]>([]);
  const [quoteBody, setQuoteBody] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [colorHex, setColorHex] = useState('#3b82f6');
  const [urlLink, setUrlLink] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [detectedType, setDetectedType] = useState<{ type: MindItemType | 'topic'; value: string; label?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await onItemCreated({
            type: 'voice',
            title: `Voice Note (${new Date().toLocaleTimeString()})`,
            content: 'Voice note recording',
            audioUrl: base64Audio,
            tags: ['voice', 'audio', 'note']
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Close composer when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        if (!noteBody && !urlLink && !quoteBody && !imageFile && checklistItems.every(i => !i.text)) {
          setComposerType(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [noteBody, urlLink, quoteBody, imageFile, checklistItems]);

  // Slash command filtering
  const filteredSlashCmds = slashFilter
    ? SLASH_COMMANDS.filter(c => c.cmd.includes(slashFilter.toLowerCase()) || c.label.toLowerCase().includes(slashFilter.slice(1).toLowerCase()))
    : SLASH_COMMANDS;

  const handleSlashSelect = (cmd: typeof SLASH_COMMANDS[0]) => {
    setShowSlashMenu(false);
    setSlashFilter('');
    onSearchChange('');
    if (cmd.type) {
      setComposerType(cmd.type);
    }
  };

  // Intelligent input detection as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (composerType === 'note') {
      setNoteTitle(val);
      return;
    }
    
    onSearchChange(val);

    // Slash command detection
    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(val);
      setSlashSelectedIdx(0);
      return;
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }

    if (composerType) return; // Don't auto-detect if already in a specific composer mode

    const cleanVal = val.trim();
    
    // 1. Color hex code detection: e.g. #3b82f6 or 3b82f6 (if exactly 6 hex chars)
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(cleanVal)) {
      const hex = cleanVal.startsWith('#') ? cleanVal : `#${cleanVal}`;
      setDetectedType({ type: 'color', value: hex });
      return;
    }

    // 2. URL detection: starts with http, https, or www, or ends with common TLDs, supporting search queries and parameters
    if (isUrl(cleanVal)) {
      let absoluteUrl = cleanVal;
      if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
        absoluteUrl = 'https://' + absoluteUrl;
      }
      setDetectedType({ type: 'link', value: absoluteUrl });
      return;
    }

    // 3. Auto quote detection: text wrapped in "" or “”
    const quoteRegex = /^["“‘].{10,}["”’]$/;
    if (quoteRegex.test(cleanVal)) {
      setDetectedType({ type: 'quote', value: cleanVal, label: 'Save as Quote' });
      return;
    }

    // 4. Film title detection: title ending with (YYYY) pattern e.g. "Inception (2010)"
    const filmRegex = /^(.+)\s*\((\d{4})\)\s*$/;
    const filmMatch = filmRegex.exec(cleanVal);
    if (filmMatch) {
      setDetectedType({ type: 'film' as any, value: filmMatch[1].trim(), label: `Save as Film · ${filmMatch[2]}` });
      return;
    }

    // 5. Topic/Hashtag detection
    if (cleanVal.startsWith('#') && cleanVal.length > 1 && !cleanVal.includes(' ')) {
      setDetectedType({ type: 'topic', value: cleanVal, label: `Search tag: ${cleanVal.slice(1)}` });
      return;
    }

    // 6. Intelligent "Note" detection (if starts with capital or is long sentence)
    if (cleanVal.length > 30 || (cleanVal.length > 10 && /^[A-Z]/.test(cleanVal))) {
      setDetectedType({ type: 'note', value: cleanVal, label: 'Create new note' });
      return;
    }

    setDetectedType(null);
  };

  const resetComposer = () => {
    setComposerType(null);
    setDetectedType(null);
    setNoteTitle('');
    setNoteBody('');
    setChecklistItems([]);
    setQuoteBody('');
    setQuoteAuthor('');
    setColorHex('#3b82f6');
    setUrlLink('');
    setImageFile(null);
    setImagePreview(null);
    onSearchChange('');
  };

  const handleCreateItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let newItem: Omit<MindItem, 'id' | 'createdAt'> | null = null;

    if (detectedType) {
      // Auto-save the detected item
      if (detectedType.type === 'color') {
        newItem = {
          type: 'color',
          title: 'Color Swatch',
          content: detectedType.value,
          colorHex: detectedType.value,
          tags: ['color', detectedType.value]
        };
      } else if (detectedType.type === 'link') {
        newItem = {
          type: 'link',
          title: 'Loading Bookmarked Link...',
          content: '',
          url: detectedType.value,
          tags: ['link', 'bookmark']
        };
      } else if (detectedType.type === 'quote') {
        const body = detectedType.value.replace(/^["\u201c\u2018]|["\u201d\u2019]$/g, '');
        newItem = {
          type: 'quote',
          title: 'A Beautiful Quote',
          content: body,
          tags: ['quote', 'inspiration']
        };
      } else if ((detectedType.type as any) === 'film') {
        newItem = {
          type: 'film',
          title: detectedType.value,
          content: '',
          tags: ['film', 'movie', detectedType.value.toLowerCase()]
        };
      } else if (detectedType.type === 'note') {
        newItem = {
          type: 'note',
          title: 'New Note',
          content: detectedType.value,
          tags: ['note', 'writing']
        };
      }
    } else {
      // Create based on selected composerType
      switch (composerType) {
        case 'note':
          const trimmedBody = noteBody.trim();
          const trimmedTitle = noteTitle.trim();
          if (!trimmedBody && !trimmedTitle) return;
          
          if (isUrl(trimmedBody) && !trimmedTitle) {
            newItem = {
              type: 'link',
              title: 'Saving bookmark...',
              content: '',
              url: trimmedBody.startsWith('http') ? trimmedBody : 'https://' + trimmedBody,
              tags: ['link', 'bookmark']
            };
          } else if (hexRegex.test(trimmedBody) && !trimmedTitle) {
            const hex = trimmedBody.startsWith('#') ? trimmedBody : `#${trimmedBody}`;
            newItem = {
              type: 'color',
              title: 'Color Swatch',
              content: hex,
              colorHex: hex,
              tags: ['color', hex]
            };
          } else {
            newItem = {
              type: 'note',
              title: trimmedTitle || 'Untitled Note',
              content: trimmedBody,
              tags: ['note', 'writing']
            };
          }
          break;

        case 'article': // Handled as link with body parsing on server
          if (!urlLink.trim()) return;
          newItem = {
            type: 'article',
            title: 'Loading Article Reader...',
            content: '',
            url: urlLink.trim(),
            tags: ['article', 'reading']
          };
          break;

        case 'quote':
          if (!quoteBody.trim()) return;
          newItem = {
            type: 'quote',
            title: 'A Saved Quote',
            content: quoteBody.trim(),
            author: quoteAuthor.trim() || undefined,
            tags: ['quote', 'inspiration']
          };
          break;

        case 'color':
          newItem = {
            type: 'color',
            title: 'Color Swatch',
            content: colorHex,
            colorHex: colorHex,
            tags: ['color', colorHex]
          };
          break;

        case 'link':
          if (!urlLink.trim()) return;
          newItem = {
            type: 'link',
            title: 'Saving bookmark...',
            content: '',
            url: urlLink.trim(),
            tags: ['link', 'bookmark']
          };
          break;

        case 'image':
          if (!imageFile) return;
          newItem = {
            type: 'image',
            title: 'Analyzing Visual Image...',
            content: 'An uploaded image',
            imageUrl: imageFile,
            tags: ['image', 'visual']
          };
          break;
      }
    }

    if (newItem) {
      await onItemCreated(newItem);
      resetComposer();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle slash menu navigation
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIdx(i => Math.min(i + 1, filteredSlashCmds.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSlashCmds[slashSelectedIdx]) {
          handleSlashSelect(filteredSlashCmds[slashSelectedIdx]);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        setSlashFilter('');
        onSearchChange('');
        return;
      }
    }

    // Ctrl+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateItem();
      return;
    }

    if (e.key === 'Enter') {
      if (detectedType) {
        handleCreateItem();
      } else if (!composerType && searchQuery.trim() !== '') {
        // If they just press Enter on standard text search, let's offer to save as a Note!
        setComposerType('note');
        setNoteBody(searchQuery);
        setNoteTitle('');
      }
    }

    // Arrow key navigation placeholder (move between sections)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Placeholder for section navigation
      console.log('Navigate sections:', e.key);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageFile(base64);
      setImagePreview(base64);
      setComposerType('image');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Checklist helper
  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: '', done: false }]);
  };

  const updateChecklistItem = (index: number, text: string) => {
    const list = [...checklistItems];
    list[index].text = text;
    setChecklistItems(list);
  };

  const saveChecklistAsNote = async () => {
    const activeItems = checklistItems.filter(item => item.text.trim() !== '');
    if (activeItems.length === 0) return;

    // Convert checklist to markdown/structured text note
    const checklistBody = activeItems.map(item => `- [${item.done ? 'x' : ' '}] ${item.text}`).join('\n');
    const noteTitleText = noteTitle.trim() || 'Shopping / Task List';

    await onItemCreated({
      type: 'note',
      title: noteTitleText,
      content: checklistBody,
      tags: ['checklist', 'todo', 'task']
    });
    resetComposer();
  };

  return (
    <div 
      id="pensieve-omnibar-container"
      ref={containerRef}
      className="sticky top-0 md:top-auto md:relative w-full max-w-2xl mx-auto z-40 px-4 md:px-4 mt-1 md:mt-4 pt-1 pb-2 md:pt-0 md:pb-2 bg-background md:bg-transparent transition-colors duration-300"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Slash Command Palette */}
      <AnimatePresence>
        {showSlashMenu && filteredSlashCmds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute bottom-full mb-2 left-4 right-4 bg-modal-bg/98 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-2 border-b border-border-subtle flex items-center gap-2">
              <Slash className="w-3.5 h-3.5 text-foreground/50" />
              <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider">Commands</span>
            </div>
            <div className="py-1.5 max-h-64 overflow-y-auto">
              {filteredSlashCmds.map((cmd, idx) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.cmd}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      idx === slashSelectedIdx ? 'bg-foreground/[0.05]' : 'hover:bg-foreground/[0.05]'
                    }`}
                    onClick={() => handleSlashSelect(cmd)}
                    onMouseEnter={() => setSlashSelectedIdx(idx)}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-foreground/[0.08] flex items-center justify-center flex-shrink-0 ${cmd.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground">{cmd.label}</span>
                      <span className="text-[10px] text-foreground/60 font-sans">{cmd.desc}</span>
                    </div>
                    <span className="ml-auto text-[9px] font-mono text-foreground/40 shrink-0">{cmd.cmd}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Animated Glow Backdrop */}
      <motion.div
        animate={isFocused ? {
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3],
        } : {
          scale: 1,
          opacity: 0.2
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-x-8 inset-y-2 -z-10 blur-3xl rounded-full bg-gradient-to-r from-primary/20 via-indigo-500/10 to-primary/20 pointer-events-none"
      />

      <div 
        id="pensieve-omnibar-box"
        className={`bg-card-bg/95 backdrop-blur-md border transition-all duration-300 overflow-hidden ${
          isFocused 
            ? 'border-foreground/20 rounded-3xl shadow-premium-hover ring-4 ring-primary/10 md:shadow-lg' 
            : 'border-card-border rounded-3xl shadow-premium'
        }`}
      >
        {/* Main Input Row */}
        <div className="flex items-center px-3 py-2.5 md:px-4 md:py-3.5 gap-2 md:gap-3">
          <Search className="w-5 h-5 text-foreground/40 shrink-0" />
          
          <input
            id="pensieve-omnibar-input"
            type="text"
            autoFocus
            className="w-full text-[15px] font-sans outline-none placeholder-foreground/40 text-foreground bg-transparent tracking-tight"
            placeholder={
              composerType === 'note' ? 'Write a title for your note...' :
              composerType === 'link' ? 'Paste any link (https://...)' :
              composerType === 'article' ? 'Paste article URL to read...' :
              composerType === 'quote' ? 'Paste a beautiful quote...' :
              'Remember everything, search instantly...'
            }
            value={composerType === 'note' ? noteTitle : searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
          />

          <AnimatePresence>
            <div className="flex items-center gap-2">
              {detectedType && !composerType && (detectedType.type as any) !== 'note' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold whitespace-nowrap"
                >
                  {detectedType.type === 'color' && <Palette className="w-3 h-3" />}
                  {detectedType.type === 'link' && <Link2 className="w-3 h-3" />}
                  {detectedType.type === 'quote' && <Quote className="w-3 h-3" />}
                  {detectedType.type === 'topic' && <Sparkles className="w-3 h-3" />}
                  {detectedType.type === 'note' && <FileText className="w-3 h-3" />}
                  <span>{detectedType.label || detectedType.type.toUpperCase()}</span>
                </motion.div>
              )}

              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={resetComposer}
                  className="p-1 rounded-full hover:bg-foreground/10 text-foreground/40 hover:text-foreground/70 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </AnimatePresence>

          <button
            id="pensieve-serendipity-trigger"
            onClick={onTriggerSerendipity}
            title="Serendipity: remember something forgotten"
            className="p-1.5 rounded-lg text-amber-500 hover:text-amber-400 transition flex items-center gap-1 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/10 bg-amber-500/5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Serendipity</span>
          </button>
        </div>

        {/* AI detection banner */}
        <AnimatePresence>
          {detectedType && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-foreground/[0.02] border-t border-border-subtle flex items-center justify-between text-xs text-foreground/60 font-mono"
            >
              <div className="flex items-center gap-2">
                {detectedType.type === 'color' && <Palette className="w-3.5 h-3.5 text-foreground/40" />}
                {detectedType.type === 'link' && <Link2 className="w-3.5 h-3.5 text-foreground/40" />}
                {detectedType.type === 'quote' && <Quote className="w-3.5 h-3.5 text-foreground/40" />}
                <span>
                  Detected <strong className="text-foreground font-semibold capitalize">{detectedType.type}</strong>: 
                  <span className="ml-1 opacity-80">{detectedType.value.substring(0, 40)}{detectedType.value.length > 40 ? '...' : ''}</span>
                </span>
              </div>
              <button
                onClick={() => handleCreateItem()}
                className="flex items-center gap-1 font-sans text-[11px] font-medium bg-foreground text-background px-2.5 py-1 rounded-lg hover:bg-foreground/90 transition"
              >
                Save <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer Expandable Sections */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border-subtle bg-foreground/[0.02]"
            >
              {/* Type selector toolbar */}
              {!composerType && (
                <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono text-foreground/40 tracking-wider uppercase">Quick Add</span>
                    <span className="text-[9px] font-mono text-foreground/30 ml-2 hidden sm:inline">· type / for commands</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={() => setComposerType('note')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Note</span>
                    </button>
                    <button
                      onClick={() => {
                        setComposerType('note');
                        setChecklistItems([{ text: '', done: false }]);
                      }}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setComposerType('quote')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <Quote className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quote</span>
                    </button>
                    <button
                      onClick={() => setComposerType('film')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <Film className="w-3.5 h-3.5 text-purple-500" />
                      <span>Film</span>
                    </button>
                    <button
                      onClick={() => setComposerType('album')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <Disc className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Album</span>
                    </button>
                    <button
                      onClick={() => setComposerType('color')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <Palette className="w-3.5 h-3.5 text-purple-500" />
                      <span>Color</span>
                    </button>
                    <button
                      onClick={() => setComposerType('link')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <Link2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                      <span>Image</span>
                    </button>
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="p-2 flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 text-red-500" />
                        <span>Stop ({recordingSeconds}s)</span>
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="p-2 flex items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/10 rounded-lg transition"
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-500" />
                        <span>Voice</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Specific composers */}
              <div className="px-4 pb-4">
                {composerType === 'note' && (
                  <div className="space-y-3">
                    {/* Note Body */}
                    <textarea
                      placeholder="Write your note contents here..."
                      className="w-full min-h-[100px] text-sm bg-transparent outline-none resize-none text-foreground placeholder-foreground/40"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                    />
                    
                    {/* Checklist option */}
                    {checklistItems.length > 0 ? (
                      <div className="border-t border-dashed border-border-subtle pt-3 space-y-2">
                        <span className="text-[11px] font-mono text-foreground/40 uppercase">Checklist Mode</span>
                        {checklistItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={(e) => {
                                const list = [...checklistItems];
                                list[idx].done = e.target.checked;
                                setChecklistItems(list);
                              }}
                              className="rounded border-border-subtle text-foreground bg-foreground/5 focus:ring-foreground w-4 h-4"
                            />
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateChecklistItem(idx, e.target.value)}
                              placeholder="Task detail..."
                              className="w-full text-xs bg-transparent outline-none text-foreground"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addChecklistItem();
                                }
                              }}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addChecklistItem}
                          className="text-[11px] font-sans font-medium text-foreground/60 hover:text-foreground"
                        >
                          + Add checklist item
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setChecklistItems([{ text: '', done: false }])}
                          className="text-[11px] font-sans font-medium text-foreground/50 hover:text-foreground/80 flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Convert to checklist / add tasks</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-foreground/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      
                      {checklistItems.some(item => item.text.trim() !== '') ? (
                        <button
                          onClick={saveChecklistAsNote}
                          className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          {noteBody.trim() ? "Save Note & Checklist" : "Save Checklist"}
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateItem}
                          disabled={!noteBody.trim() && !noteTitle.trim()}
                          className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                            (noteBody.trim() || noteTitle.trim())
                              ? 'bg-foreground hover:bg-foreground/90 text-background cursor-pointer'
                              : 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                          }`}
                        >
                          {isUrl(noteBody) ? "Save Link" : hexRegex.test(noteBody.trim()) ? "Save Color Swatch" : "Save Note"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {composerType === 'quote' && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      placeholder="Enter the quote text..."
                      className="w-full min-h-[80px] text-sm bg-transparent outline-none resize-none text-foreground placeholder-foreground/40 italic"
                      value={quoteBody}
                      onChange={(e) => setQuoteBody(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Author attribution (e.g., Albert Einstein)"
                      className="w-full text-xs bg-transparent border-b border-border-subtle pb-1 outline-none text-foreground placeholder-foreground/40"
                      value={quoteAuthor}
                      onChange={(e) => setQuoteAuthor(e.target.value)}
                    />
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-foreground/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Save Quote
                      </button>
                    </div>
                  </div>
                )}

                {composerType === 'color' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => {
                          setColorHex(e.target.value);
                          onSearchChange(''); // Reset search if they pick a color
                        }}
                        className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-none bg-transparent"
                      />
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={colorHex}
                          onChange={(e) => setColorHex(e.target.value)}
                          placeholder="#FF5733"
                          className="text-sm font-mono font-medium outline-none border-b border-border-subtle pb-0.5 text-foreground uppercase"
                        />
                        <p className="text-[10px] font-mono text-foreground/40">Save color swatch with palette generation</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-foreground/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Save Swatch
                      </button>
                    </div>
                  </div>
                )}

                {(composerType === 'link' || composerType === 'article') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center bg-foreground/[0.04] rounded-xl px-3 py-2 border border-border-subtle">
                      <Link2 className="w-4 h-4 text-foreground/40 shrink-0 mr-2" />
                      <input
                        type="text"
                        placeholder="https://example.com/some-interesting-read"
                        className="w-full text-xs bg-transparent outline-none text-foreground"
                        value={urlLink}
                        onChange={(e) => setUrlLink(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateItem();
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setComposerType('link')}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                          composerType === 'link' 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-card-bg text-foreground/70 border-border-subtle hover:bg-foreground/5'
                        }`}
                      >
                        Visual Bookmark
                      </button>
                      <button
                        onClick={() => setComposerType('article')}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                          composerType === 'article' 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-card-bg text-foreground/70 border-border-subtle hover:bg-foreground/5'
                        }`}
                      >
                        Distraction-Free Reader Mode
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-foreground/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Process & Save Link
                      </button>
                    </div>
                  </div>
                )}

                {composerType === 'image' && imagePreview && (
                  <div className="space-y-4 pt-2">
                    <div className="relative w-full max-h-[220px] rounded-xl overflow-hidden border border-border-subtle bg-foreground/[0.04] flex items-center justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Upload preview" 
                        className="max-h-[220px] object-contain"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setComposerType(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-foreground/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze and Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Film Composer */}
                {composerType === 'film' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Movie title..."
                        className="col-span-2 w-full text-sm bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground placeholder-foreground/40"
                        value={filmTitle}
                        onChange={(e) => setFilmTitle(e.target.value)}
                      />
                      <input type="text" placeholder="Year (e.g. 2010)" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={filmYear} onChange={e => setFilmYear(e.target.value)} />
                      <input type="text" placeholder="Runtime (e.g. 148 min)" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={filmRuntime} onChange={e => setFilmRuntime(e.target.value)} />
                      <input type="text" placeholder="Director" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={filmDirector} onChange={e => setFilmDirector(e.target.value)} />
                      <input type="text" placeholder="Genre (e.g. Sci-Fi)" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={filmGenre} onChange={e => setFilmGenre(e.target.value)} />
                      <input type="text" placeholder="Rating (e.g. 8.3/10)" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40 col-span-2" value={filmRating} onChange={e => setFilmRating(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button onClick={resetComposer} className="text-xs text-foreground/50 hover:text-foreground">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!filmTitle.trim()) return;
                          await onItemCreated({
                            type: 'film',
                            title: filmTitle.trim(),
                            content: '',
                            releaseYear: filmYear ? parseInt(filmYear) : undefined,
                            runtime: filmRuntime || undefined,
                            director: filmDirector || undefined,
                            genre: filmGenre ? filmGenre.split(',').map(g => g.trim()) : undefined,
                            rating: filmRating || undefined,
                            tags: ['film', 'movie', filmTitle.toLowerCase(), ...( filmGenre ? [filmGenre.toLowerCase()] : [])]
                          });
                          setFilmTitle(''); setFilmYear(''); setFilmGenre(''); setFilmDirector(''); setFilmRating(''); setFilmRuntime('');
                          resetComposer();
                        }}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Film className="w-3.5 h-3.5" /> Save Film
                      </button>
                    </div>
                  </div>
                )}

                {/* Album Composer */}
                {composerType === 'album' && (
                  <div className="space-y-3 pt-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Album title..."
                      className="w-full text-sm bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground placeholder-foreground/40"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Artist / Band" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={albumArtist} onChange={e => setAlbumArtist(e.target.value)} />
                      <input type="text" placeholder="Year" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={albumYear} onChange={e => setAlbumYear(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button onClick={resetComposer} className="text-xs text-foreground/50 hover:text-foreground">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!noteTitle.trim()) return;
                          await onItemCreated({
                            type: 'album',
                            title: noteTitle.trim(),
                            content: '',
                            author: albumArtist || undefined,
                            albumYear: albumYear ? parseInt(albumYear) : undefined,
                            tags: ['album', 'music', noteTitle.toLowerCase(), ...(albumArtist ? [albumArtist.toLowerCase()] : [])]
                          });
                          setNoteTitle(''); setAlbumArtist(''); setAlbumYear('');
                          resetComposer();
                        }}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Disc className="w-3.5 h-3.5" /> Save Album
                      </button>
                    </div>
                  </div>
                )}

                {/* Product Composer */}
                {composerType === 'product' && (
                  <div className="space-y-3 pt-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Product name..."
                      className="w-full text-sm bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground placeholder-foreground/40"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Brand" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={productBrand} onChange={e => setProductBrand(e.target.value)} />
                      <input type="text" placeholder="Price (e.g. 29.99)" className="text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                      <input type="text" placeholder="Buy URL (optional)" className="col-span-2 text-xs bg-foreground/[0.04] border border-border-subtle rounded-xl px-3 py-2 outline-none text-foreground placeholder-foreground/40" value={productBuyUrl} onChange={e => setProductBuyUrl(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button onClick={resetComposer} className="text-xs text-foreground/50 hover:text-foreground">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!noteTitle.trim()) return;
                          await onItemCreated({
                            type: 'product',
                            title: noteTitle.trim(),
                            content: '',
                            brand: productBrand || undefined,
                            price: productPrice || undefined,
                            buyUrl: productBuyUrl || undefined,
                            tags: ['product', ...(productBrand ? [productBrand.toLowerCase()] : [])]
                          });
                          setNoteTitle(''); setProductBrand(''); setProductPrice(''); setProductBuyUrl('');
                          resetComposer();
                        }}
                        className="bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Save Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
