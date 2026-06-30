/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, FileText, CheckSquare, Quote, 
  Palette, Link2, Image as ImageIcon, ArrowRight, X, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem, MindItemType } from '../types';

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
  const [isFocused, setIsFocused] = useState(false);
  const [composerType, setComposerType] = useState<MindItemType | null>(null);
  
  // Composer form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; done: boolean }[]>([{ text: '', done: false }]);
  const [quoteBody, setQuoteBody] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [colorHex, setColorHex] = useState('#3b82f6');
  const [urlLink, setUrlLink] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [detectedType, setDetectedType] = useState<{ type: MindItemType | 'topic'; value: string; label?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Intelligent input detection as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchChange(val);

    if (composerType) return; // Don't auto-detect if already in a specific composer mode

    const cleanVal = val.trim();
    
    // 1. Color hex code detection: e.g. #3b82f6 or 3b82f6 (if exactly 6 hex chars)
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(cleanVal)) {
      const hex = cleanVal.startsWith('#') ? cleanVal : `#${cleanVal}`;
      setDetectedType({ type: 'color', value: hex });
      return;
    }

    // 2. URL detection: starts with http, https, or www, or ends with common TLDs
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (urlRegex.test(cleanVal) && (cleanVal.includes('.') || cleanVal.startsWith('http'))) {
      let absoluteUrl = cleanVal;
      if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
        absoluteUrl = 'https://' + absoluteUrl;
      }
      setDetectedType({ type: 'link', value: absoluteUrl });
      return;
    }

    // 4. Topic/Hashtag detection
    if (cleanVal.startsWith('#') && cleanVal.length > 1 && !cleanVal.includes(' ')) {
      setDetectedType({ type: 'topic', value: cleanVal, label: `Search tag: ${cleanVal.slice(1)}` });
      return;
    }

    // 5. Intelligent "Note" detection (if starts with capital or is long sentence)
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
    setChecklistItems([{ text: '', done: false }]);
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
        const body = detectedType.value.replace(/^["“]|["”]$/g, '');
        newItem = {
          type: 'quote',
          title: 'A Beautiful Quote',
          content: body,
          tags: ['quote', 'inspiration']
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
          if (!noteBody.trim() && !noteTitle.trim()) return;
          newItem = {
            type: 'note',
            title: noteTitle.trim() || 'Untitled Note',
            content: noteBody.trim(),
            tags: ['note', 'writing']
          };
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
      id="mymind-omnibar-container"
      ref={containerRef}
      className="sticky top-0 md:top-auto md:relative w-full max-w-2xl mx-auto z-40 px-4 md:px-4 mt-1 md:mt-4 pt-1 pb-2 md:pt-0 md:pb-2 bg-background md:bg-transparent transition-colors duration-300"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
        id="mymind-omnibar-box"
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
            id="mymind-omnibar-input"
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
                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </AnimatePresence>

          <button
            id="mymind-serendipity-trigger"
            onClick={onTriggerSerendipity}
            title="Serendipity: remember something forgotten"
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition flex items-center gap-1 text-xs font-medium border border-amber-100 bg-amber-50/30 shrink-0"
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
              className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono"
            >
              <div className="flex items-center gap-2">
                {detectedType.type === 'color' && <Palette className="w-3.5 h-3.5 text-neutral-400" />}
                {detectedType.type === 'link' && <Link2 className="w-3.5 h-3.5 text-neutral-400" />}
                {detectedType.type === 'quote' && <Quote className="w-3.5 h-3.5 text-neutral-400" />}
                <span>
                  Detected <strong className="text-neutral-700 capitalize">{detectedType.type}</strong>: 
                  <span className="ml-1 opacity-80">{detectedType.value.substring(0, 40)}{detectedType.value.length > 40 ? '...' : ''}</span>
                </span>
              </div>
              <button
                onClick={() => handleCreateItem()}
                className="flex items-center gap-1 font-sans text-[11px] font-medium bg-neutral-800 text-white px-2.5 py-1 rounded-lg hover:bg-neutral-900 transition"
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
              className="border-t border-neutral-100 bg-neutral-50/50"
            >
              {/* Type selector toolbar */}
              {!composerType && (
                <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-neutral-400 tracking-wider uppercase">Quick Add</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setComposerType('note')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Note</span>
                    </button>
                    <button
                      onClick={() => {
                        setComposerType('note');
                        setChecklistItems([{ text: '', done: false }]);
                      }}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setComposerType('quote')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <Quote className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quote</span>
                    </button>
                    <button
                      onClick={() => setComposerType('color')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <Palette className="w-3.5 h-3.5 text-purple-500" />
                      <span>Color</span>
                    </button>
                    <button
                      onClick={() => setComposerType('link')}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-lg transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                      <span>Image</span>
                    </button>
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
                      className="w-full min-h-[100px] text-sm bg-transparent outline-none resize-none text-neutral-800 placeholder-neutral-400"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                    />
                    
                    {/* Checklist option */}
                    {checklistItems.length > 0 && checklistItems[0].text !== undefined && (
                      <div className="border-t border-dashed border-neutral-200 pt-3 space-y-2">
                        <span className="text-[11px] font-mono text-neutral-400 uppercase">Checklist Mode</span>
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
                              className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-800 w-4 h-4"
                            />
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateChecklistItem(idx, e.target.value)}
                              placeholder="Task detail..."
                              className="w-full text-xs bg-transparent outline-none text-neutral-700"
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
                          className="text-[11px] font-sans font-medium text-neutral-500 hover:text-neutral-800"
                        >
                          + Add checklist item
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      
                      {checklistItems.length > 0 && checklistItems[0].text !== undefined ? (
                        <button
                          onClick={saveChecklistAsNote}
                          className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          Save Checklist
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateItem}
                          className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          Save Note
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {composerType === 'quote' && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      placeholder="Enter the quote text..."
                      className="w-full min-h-[80px] text-sm bg-transparent outline-none resize-none text-neutral-800 placeholder-neutral-400 italic"
                      value={quoteBody}
                      onChange={(e) => setQuoteBody(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Author attribution (e.g., Albert Einstein)"
                      className="w-full text-xs bg-transparent border-b border-neutral-200 pb-1 outline-none text-neutral-700 placeholder-neutral-400"
                      value={quoteAuthor}
                      onChange={(e) => setQuoteAuthor(e.target.value)}
                    />
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
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
                          className="text-sm font-mono font-medium outline-none border-b border-neutral-200 pb-0.5 text-neutral-800 uppercase"
                        />
                        <p className="text-[10px] font-mono text-neutral-400">Save color swatch with palette generation</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={resetComposer}
                        className="text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Save Swatch
                      </button>
                    </div>
                  </div>
                )}

                {(composerType === 'link' || composerType === 'article') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center bg-neutral-100 rounded-xl px-3 py-2 border border-neutral-200/50">
                      <Link2 className="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
                      <input
                        type="text"
                        placeholder="https://example.com/some-interesting-read"
                        className="w-full text-xs bg-transparent outline-none text-neutral-700"
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
                        className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Process & Save Link
                      </button>
                    </div>
                  </div>
                )}

                {composerType === 'image' && imagePreview && (
                  <div className="space-y-4 pt-2">
                    <div className="relative w-full max-h-[220px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Upload preview" 
                        className="max-h-[220px] object-contain"
                        referrerPolicy="no-referrer"
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
                        className="text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateItem}
                        className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze and Save
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
