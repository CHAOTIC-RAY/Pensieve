import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Star, Sparkles, Plus, Trash2, 
  ExternalLink, BookOpen, Copy, Check, Palette, Eye, Quote as QuoteIcon, Utensils,
  Film, Disc, ShoppingBag, CheckCircle2, Type, AlignLeft, AlignCenter, AlignRight,
  Bookmark, Link as LinkIcon, MessageSquare, Tag, Hash, Compass, Award, ChevronLeft,
  Clock, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { MindItem, NoteStyle } from '../types';

interface DetailPanelProps {
  item: MindItem | null;
  onClose: () => void;
  onUpdateItem: (item: MindItem) => Promise<void>;
  onDeleteItem: (item: MindItem) => Promise<void>;
  onSetVibeFilter?: (type: 'color' | 'tag', value: string, label: string) => void;
  onOpenReader?: (item: MindItem) => void;
}

export default function DetailPanel({ 
  item, 
  onClose, 
  onUpdateItem, 
  onDeleteItem,
  onSetVibeFilter,
  onOpenReader
}: DetailPanelProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [noteStyle, setNoteStyle] = useState<NoteStyle>({});

  useEffect(() => {
    if (item) {
      window.history.pushState({ modal: 'detailPanel' }, '');
      const handlePopState = (e: PopStateEvent) => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      
      setTitle(item.title);
      setContent(item.content);
      setAuthor(item.author || '');
      setTags(item.tags || []);
      setNoteStyle(item.noteStyle || {});

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'detailPanel') {
          window.history.back();
        }
      };
    }
  }, [item, onClose]);

  if (!item) return null;

  const handleAutoSave = async () => {
    if (title !== item.title || content !== item.content || author !== item.author || JSON.stringify(tags) !== JSON.stringify(item.tags) || JSON.stringify(noteStyle) !== JSON.stringify(item.noteStyle)) {
      await onUpdateItem({
        ...item,
        title,
        content,
        author,
        tags,
        noteStyle
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setTimeout(handleAutoSave, 50);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const t = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!tags.includes(t)) {
      setTags([...tags, t]);
      setTimeout(handleAutoSave, 50);
    }
    setNewTag('');
  };

  return (
    <>
      {/* Sliding detail drawer backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/70 backdrop-blur-[8px] z-[100000] cursor-pointer"
      />

      <div className="fixed inset-0 z-[100010] flex items-end md:items-center justify-center md:p-6">
        <motion.div
          id="pensieve-detail-modal"
          initial={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
          className="w-full h-full md:max-w-4xl md:h-[85vh] bg-background md:bg-card-bg shadow-2xl flex flex-col md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5 border-b border-border-subtle/40 bg-background/80 md:bg-card-bg/80 backdrop-blur-xl z-20 sticky top-0">
            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={onClose}
                className="md:hidden p-2 -ml-2 rounded-xl text-foreground/60 hover:bg-foreground/5 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-[10px] md:text-xs font-semibold text-foreground/50 flex items-center gap-1.5 uppercase tracking-widest">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400 hidden md:block" />
                {item.type}
              </span>
              {item.isFavorite && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full ml-2">
                  <Star className="w-3 h-3 fill-rose-500 text-rose-500" /> Favorite
                </span>
              )}
              {item.readLater && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full ml-2">
                  <Clock className="w-3 h-3 fill-amber-500 text-amber-500" /> Read Later
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="hidden md:flex p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable details */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar z-10 custom-scrollbar">
            
            
            {/* Voice / Audio Support */}
            {item.type === 'voice' && (
              <div className="w-full bg-foreground/5 border border-border-subtle rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-2">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="w-full h-12 bg-foreground/10 rounded-full flex items-center px-4">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 mr-4 shrink-0"></div>
                  {/* Fake waveform */}
                  <div className="flex-1 flex items-center gap-1 h-6">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-indigo-500/50 rounded-full" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-foreground/50 ml-4 shrink-0">0:45</div>
                </div>
              </div>
            )}

            {/* Image Support */}
            {item.imageUrl && (
              <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-border-subtle mb-6">
                <img src={item.imageUrl} alt={title} className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}

            {/* Notion Style Title */}
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleAutoSave}
                placeholder="Untitled"
                className="font-sans font-black text-4xl md:text-5xl text-foreground tracking-tight leading-tight bg-transparent border-none outline-none w-full placeholder-foreground/20"
              />

              {(item.type === 'article' || item.type === 'link') && (
                <div className="w-full bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Distraction-Free Reader Mode
                    </h4>
                    <p className="text-[11px] text-foreground/60 leading-relaxed">
                      Read the stripped, clean text of this webpage with premium customizable styling.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenReader?.(item);
                    }}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Reader</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quote Author (if applicable) */}
            {item.type === 'quote' && (
               <input
                 type="text"
                 value={author}
                 onChange={e => setAuthor(e.target.value)}
                 onBlur={handleAutoSave}
                 placeholder="Author / Source"
                 className="w-full text-lg font-serif italic border-none bg-transparent outline-none text-foreground/60 transition-colors mb-4 placeholder-foreground/30"
               />
            )}

            {/* Notion Style Content */}
            <div className="min-h-[200px]">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={handleAutoSave}
                placeholder={item.type === 'quote' ? "Quote..." : "Empty note..."}
                className="w-full text-foreground/90 text-lg md:text-xl font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[400px] placeholder-foreground/20"
                style={item.type === 'note' ? {
                  fontFamily: noteStyle.fontFamily === 'serif' ? 'Georgia, serif' : noteStyle.fontFamily === 'mono' ? 'JetBrains Mono, monospace' : noteStyle.fontFamily === 'display' ? 'Playfair Display, Georgia, serif' : 'var(--font-sans)',
                  fontSize: noteStyle.fontSize === 'sm' ? '14px' : noteStyle.fontSize === 'lg' ? '20px' : noteStyle.fontSize === 'xl' ? '24px' : '16px',
                  fontWeight: noteStyle.bold ? 'bold' : 'normal',
                  fontStyle: noteStyle.italic ? 'italic' : 'normal',
                } : item.type === 'quote' ? {
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '24px'
                } : undefined}
              />
            </div>

            {/* AI Summary */}
            {item.aiSummary && (
              <div className="p-5 bg-gradient-to-br from-indigo-500/[0.04] to-purple-500/[0.04] border border-indigo-500/10 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 fill-indigo-500/20 text-indigo-500" />
                  AI Summary
                </span>
                <p className="text-sm text-foreground/80 font-sans leading-relaxed">
                  {item.aiSummary}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="pt-8 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Tag className="w-3.5 h-3.5" />
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-foreground/5 text-foreground/70 border-border-subtle"
                  >
                    <span 
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        if (onSetVibeFilter) {
                          onSetVibeFilter('tag', tag, '#' + tag);
                          onClose();
                        }
                      }}
                    >
                      #{tag}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      className="ml-1 text-foreground/35 hover:text-foreground/75 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                <form onSubmit={handleAddTag} className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex items-center bg-input-bg border border-border-subtle rounded-lg px-3 py-1 flex-1 sm:w-32 focus-within:border-indigo-500/40 transition">
                    <Plus className="w-3.5 h-3.5 text-foreground/35 mr-1 shrink-0" />
                    <input 
                      type="text" 
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      className="w-full text-xs outline-none bg-transparent text-foreground placeholder-foreground/35 font-sans"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Note Style Controls (Only for 'note' type) */}
            {item.type === 'note' && (
              <div className="space-y-4 pt-5 border-t border-border-subtle/50">
                <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  Styling
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['sans', 'serif', 'mono'] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => {
                        setNoteStyle({ ...noteStyle, fontFamily: font });
                        setTimeout(handleAutoSave, 50);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        noteStyle.fontFamily === font
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-card-bg text-foreground/60 border-border-subtle hover:bg-foreground/5'
                      }`}
                    >
                      {font.charAt(0).toUpperCase() + font.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Metadata */}
            <div className="pt-5 border-t border-border-subtle/50 text-[10px] font-mono text-foreground/45 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-4 md:px-6 py-4 border-t border-border-subtle/40 bg-card-bg flex justify-between items-center z-10 sticky bottom-0">
            <button
              onClick={async () => {
                if (window.confirm('Are you certain you want to delete this?')) {
                  await onDeleteItem(item);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-500 font-bold hover:bg-rose-500/10 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <span className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">
              ID: {item.id.slice(0, 8)}
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
