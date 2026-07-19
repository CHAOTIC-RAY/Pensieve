import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Star, Sparkles, Plus, Trash2, 
  ExternalLink, BookOpen, Copy, Check, Palette, Eye, Quote as QuoteIcon, Utensils,
  Film, Disc, ShoppingBag, CheckCircle2, Type, AlignLeft, AlignCenter, AlignRight,
  Bookmark, Link as LinkIcon, MessageSquare, Tag, Hash, Compass, Award, ChevronLeft,
  Clock, Mic, Edit3, Grid, FileText, Bold, Italic, Type as FontIcon, ZoomIn, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { MindItem, NoteStyle } from '../types';
import { getBacklinks, syncLinkedItemIds } from '../lib/wikiLinks';

interface DetailPanelProps {
  item: MindItem | null;
  onClose: () => void;
  onUpdateItem: (item: MindItem) => Promise<void>;
  onDeleteItem: (item: MindItem) => Promise<void>;
  onSetVibeFilter?: (type: 'color' | 'tag', value: string, label: string) => void;
  onOpenReader?: (item: MindItem) => void;
  allItems?: MindItem[];
  onNavigateToItem?: (item: MindItem) => void;
}

export default function DetailPanel({ 
  item, 
  onClose, 
  onUpdateItem, 
  onDeleteItem,
  onSetVibeFilter,
  onOpenReader,
  allItems = [],
  onNavigateToItem,
}: DetailPanelProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [noteStyle, setNoteStyle] = useState<NoteStyle>({});
  
  // Custom states for upgraded features
  const [editMode, setEditMode] = useState<'document' | 'sheet'>('document');
  const [isPreview, setIsPreview] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageAnnotation, setImageAnnotation] = useState('');
  const [annotations, setAnnotations] = useState<{ id: string; text: string; time: string }[]>([]);
  const [linkPickerQuery, setLinkPickerQuery] = useState('');

  // Sheet / Table state
  const [tableData, setTableData] = useState<string[][]>([]);

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
      
      // Separate tags
      const currentManual = item.manualTags || [];
      const currentAi = item.aiTags || [];
      
      // If there are legacy tags not in manual or AI, assume they are manual
      const legacyTags = (item.tags || []).filter(t => !currentManual.includes(t) && !currentAi.includes(t));
      
      setManualTags([...currentManual, ...legacyTags]);
      setAiTags([...currentAi]);
      setNoteStyle(item.noteStyle || {});

      // Parse image annotations if present
      parseAnnotations(item.content);

      // Parse table data if note has a table or if sheet mode is preferred
      const parsedTable = parseMarkdownTable(item.content);
      if (parsedTable) {
        setTableData(parsedTable);
        setEditMode('sheet');
      } else {
        setTableData([['Header 1', 'Header 2'], ['Row 1 Cell 1', 'Row 1 Cell 2']]);
        setEditMode('document');
      }

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'detailPanel') {
          window.history.back();
        }
      };
    }
  }, [item, onClose]);

  if (!item) return null;

  // Simple Markdown table parser
  function parseMarkdownTable(md: string): string[][] | null {
    if (!md) return null;
    const lines = md.split('\n').map(l => l.trim());
    const tableLines = lines.filter(l => l.startsWith('|') && l.endsWith('|'));
    if (tableLines.length < 2) return null; // Needs header and divider at least
    
    // Check if second line is a divider like |---|---|
    const hasDivider = tableLines[1].replace(/[\s|:-]/g, '') === '';
    if (!hasDivider) return null;

    const dataRows = tableLines.filter((_, idx) => idx !== 1); // skip divider line
    const grid = dataRows.map(row => {
      // Split and clean cell values
      const cells = row.split('|').map(c => c.trim());
      return cells.slice(1, cells.length - 1); // Remove empty outer cells
    });

    return grid.length > 0 ? grid : null;
  }

  // Generate markdown table from grid
  function generateMarkdownTable(grid: string[][]): string {
    if (grid.length === 0) return '';
    const headers = grid[0];
    const divider = headers.map(() => '---');
    const rows = grid.slice(1);
    
    const lines = [
      `| ${headers.join(' | ')} |`,
      `| ${divider.join(' | ')} |`,
      ...rows.map(row => `| ${row.join(' | ')} |`)
    ];
    return lines.join('\n');
  }

  // Parse annotations from Markdown content
  function parseAnnotations(md: string) {
    if (!md) return;
    const markerIndex = md.indexOf('### Image Annotations');
    if (markerIndex === -1) {
      setAnnotations([]);
      return;
    }
    const annotationsText = md.substring(markerIndex);
    const lines = annotationsText.split('\n');
    const parsed: { id: string; text: string; time: string }[] = [];
    lines.forEach((line, idx) => {
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
        if (match) {
          parsed.push({
            id: String(idx),
            time: match[1],
            text: match[2]
          });
        }
      }
    });
    setAnnotations(parsed);
  }

  // Save annotations list back to Markdown content
  function saveAnnotationsToContent(newList: typeof annotations, currentText: string) {
    let cleanText = currentText;
    const markerIndex = currentText.indexOf('### Image Annotations');
    if (markerIndex !== -1) {
      cleanText = currentText.substring(0, markerIndex).trim();
    }
    
    if (newList.length === 0) {
      setContent(cleanText);
      setTimeout(() => handleAutoSaveWithValues(title, cleanText, noteStyle), 50);
      return;
    }

    const annotationsBlock = '\n\n### Image Annotations\n' + newList.map(ann => `- **${ann.time}**: ${ann.text}`).join('\n');
    const newContent = cleanText + annotationsBlock;
    setContent(newContent);
    setTimeout(() => handleAutoSaveWithValues(title, newContent, noteStyle), 50);
  }

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageAnnotation.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAnn = {
      id: Date.now().toString(),
      text: imageAnnotation.trim(),
      time: timeStr
    };
    const updated = [...annotations, newAnn];
    setAnnotations(updated);
    setImageAnnotation('');
    saveAnnotationsToContent(updated, content);
  };

  const handleDeleteAnnotation = (id: string) => {
    const updated = annotations.filter(ann => ann.id !== id);
    setAnnotations(updated);
    saveAnnotationsToContent(updated, content);
  };

  const handleAutoSave = async () => {
    await handleAutoSaveWithValues(title, content, noteStyle);
  };

  const handleAutoSaveWithValues = async (tVal: string, cVal: string, sVal: NoteStyle) => {
    const combinedTags = Array.from(new Set([...manualTags, ...aiTags]));
    if (tVal !== item.title || cVal !== item.content || author !== item.author || 
        JSON.stringify(manualTags) !== JSON.stringify(item.manualTags) ||
        JSON.stringify(aiTags) !== JSON.stringify(item.aiTags) ||
        JSON.stringify(combinedTags) !== JSON.stringify(item.tags) || 
        JSON.stringify(sVal) !== JSON.stringify(item.noteStyle)) {
      await onUpdateItem({
        ...item,
        title: tVal,
        content: cVal,
        author,
        manualTags,
        aiTags,
        tags: combinedTags,
        noteStyle: sVal
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string, isAi: boolean) => {
    if (isAi) {
      setAiTags(prev => {
        const next = prev.filter(t => t !== tagToRemove);
        setTimeout(handleAutoSave, 50);
        return next;
      });
    } else {
      setManualTags(prev => {
        const next = prev.filter(t => t !== tagToRemove);
        setTimeout(handleAutoSave, 50);
        return next;
      });
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const t = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!manualTags.includes(t)) {
      setManualTags(prev => {
        const next = [...prev, t];
        setTimeout(handleAutoSave, 50);
        return next;
      });
    }
    setNewTag('');
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const nextTable = tableData.map((row, r) => 
      row.map((cell, c) => (r === rowIdx && c === colIdx ? val : cell))
    );
    setTableData(nextTable);
    const mdTable = generateMarkdownTable(nextTable);
    setContent(mdTable);
    handleAutoSaveWithValues(title, mdTable, noteStyle);
  };

  const addRow = () => {
    const colsCount = tableData[0]?.length || 2;
    const newRow = Array(colsCount).fill('');
    const nextTable = [...tableData, newRow];
    setTableData(nextTable);
    const mdTable = generateMarkdownTable(nextTable);
    setContent(mdTable);
    handleAutoSaveWithValues(title, mdTable, noteStyle);
  };

  const deleteRow = (idx: number) => {
    if (tableData.length <= 2) return; // Keep at least header + 1 row
    const nextTable = tableData.filter((_, i) => i !== idx);
    setTableData(nextTable);
    const mdTable = generateMarkdownTable(nextTable);
    setContent(mdTable);
    handleAutoSaveWithValues(title, mdTable, noteStyle);
  };

  const addColumn = () => {
    const nextTable = tableData.map((row, idx) => [...row, idx === 0 ? `Header ${row.length + 1}` : '']);
    setTableData(nextTable);
    const mdTable = generateMarkdownTable(nextTable);
    setContent(mdTable);
    handleAutoSaveWithValues(title, mdTable, noteStyle);
  };

  const deleteColumn = (colIdx: number) => {
    if (tableData[0].length <= 1) return; // Keep at least 1 column
    const nextTable = tableData.map(row => row.filter((_, c) => c !== colIdx));
    setTableData(nextTable);
    const mdTable = generateMarkdownTable(nextTable);
    setContent(mdTable);
    handleAutoSaveWithValues(title, mdTable, noteStyle);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const PRESET_TEXT_COLORS = [
    { name: 'Slate', hex: '#1E293B' },
    { name: 'Indigo', hex: '#4F46E5' },
    { name: 'Violet', hex: '#7C3AED' },
    { name: 'Rose', hex: '#E11D48' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Amber', hex: '#D97706' }
  ];

  const PRESET_BG_COLORS = [
    { name: 'Default', hex: '' },
    { name: 'Cream', hex: '#FFFDF5' },
    { name: 'Sage', hex: '#F3F7F4' },
    { name: 'Lavender', hex: '#F5F3F7' },
    { name: 'Peach', hex: '#FFF7F3' },
    { name: 'Sky', hex: '#F3F6F7' },
    { name: 'Slate', hex: '#F8FAFC' }
  ];

  const FONTS = [
    { id: 'sans', name: 'Sans Serif' },
    { id: 'serif', name: 'Elegant Serif' },
    { id: 'mono', name: 'Code Mono' },
    { id: 'display', name: 'Display' }
  ] as const;

  const SIZES = [
    { id: 'sm', name: 'Small' },
    { id: 'base', name: 'Normal' },
    { id: 'lg', name: 'Large' },
    { id: 'xl', name: 'Extra Large' }
  ] as const;

  const fontClasses: Record<string, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    display: 'font-display'
  };

  return (
    <>
      {/* Upgraded sliding detail drawer backdrop - matching preferences overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000] cursor-pointer"
      />

      <div className="fixed inset-0 z-[100010] flex items-end md:items-center justify-center md:p-6">
        <motion.div
          id="pensieve-detail-modal"
          initial={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
          // Custom modal background & styling - matching SettingsModal
          className="w-full h-full md:max-w-4xl md:h-[85vh] bg-modal-bg shadow-2xl flex flex-col md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden text-foreground"
        >
          {/* Header - matching settings header */}
          <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5 border-b border-border-subtle/80 bg-modal-sidebar backdrop-blur-xl z-20 sticky top-0 select-none">
            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={onClose}
                className="md:hidden p-2 -ml-2 rounded-xl text-foreground/60 hover:bg-foreground/5 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-[10px] md:text-xs font-semibold text-foreground/50 flex items-center gap-1.5 uppercase tracking-widest">
                <Bookmark className="w-3.5 h-3.5 text-primary hidden md:block" />
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
                className="hidden md:flex p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/45 hover:text-foreground/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable details */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar z-10 custom-scrollbar">
            
            {/* Image Support with Beautiful Lightbox Zoom */}
            {item.imageUrl && (
              <div className="space-y-4">
                <div className="w-full rounded-3xl overflow-hidden shadow-md border border-border-subtle bg-black/5 relative group">
                  <img 
                    src={item.imageUrl} 
                    alt={title} 
                    className="w-full h-auto object-contain max-h-[400px] mx-auto cursor-zoom-in" 
                    onClick={() => setShowLightbox(true)}
                  />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white p-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer pointer-events-none">
                    <ZoomIn className="w-4 h-4" /> Click to Zoom
                  </div>
                </div>

                {/* Lightbox Dialog */}
                <AnimatePresence>
                  {showLightbox && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowLightbox(false)}
                      className="fixed inset-0 z-[200000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                      <button className="absolute top-4 right-4 bg-white/10 p-2.5 rounded-full hover:bg-white/20 text-white transition">
                        <X className="w-6 h-6" />
                      </button>
                      <motion.img 
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        src={item.imageUrl} 
                        alt={title} 
                        className="max-w-full max-h-full object-contain rounded-xl select-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Voice / Audio Support with simulated premium waveform */}
            {item.type === 'voice' && (
              <div className="w-full bg-foreground/[0.02] border border-border-subtle rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 border border-primary/20 shadow-inner">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="w-full h-12 bg-foreground/5 rounded-full flex items-center px-4">
                  <div className="w-3 h-3 rounded-full bg-primary mr-4 shrink-0 animate-ping"></div>
                  {/* Fake waveform */}
                  <div className="flex-1 flex items-center gap-1.5 h-6">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-primary/40 rounded-full transition-all duration-300 hover:bg-primary" 
                        style={{ height: `${Math.max(12, Math.sin(i * 0.4) * 40 + 50 + Math.random() * 20)}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-foreground/50 ml-4 shrink-0 font-bold">0:45</div>
                </div>
              </div>
            )}

            {/* Color Palette / Swatch Inspector — compact */}
            {item.type === 'color' && item.colorHex && (
              <div className="p-4 border border-border-subtle rounded-2xl bg-foreground/[0.01] space-y-4">
                <div className="flex flex-row items-center gap-4">
                  {/* Swatch visual */}
                  <div 
                    className="w-16 h-16 rounded-2xl shadow-md border border-white/20 cursor-pointer relative group shrink-0"
                    style={{ backgroundColor: item.colorHex }}
                    onClick={() => copyToClipboard(item.colorHex!)}
                  >
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 rounded-2xl transition flex items-center justify-center text-white text-[10px] font-bold font-mono">
                      Copy
                    </div>
                  </div>
                  
                  {/* Swatch detail */}
                  <div className="flex-1 space-y-1.5 text-left min-w-0">
                    <h3 className="text-base font-bold uppercase tracking-wide text-foreground font-mono truncate">{item.colorHex.toUpperCase()}</h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <button 
                        onClick={() => copyToClipboard(item.colorHex!)}
                        className="px-3.5 py-2 bg-foreground/5 hover:bg-foreground/10 text-xs font-mono font-bold rounded-xl border border-border-subtle flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-foreground/55" />
                        <span>{item.colorHex.toUpperCase()}</span>
                      </button>
                      {copiedColor === item.colorHex && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                          <Check className="w-3 h-3" /> Hex Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Color Harmony Recommendations */}
                <div className="pt-4 border-t border-border-subtle/50 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-foreground/45 font-bold flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary" /> Generated Color Harmonies
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { type: 'Analogous', color: '#b9a8d5' },
                      { type: 'Monochrome', color: '#8db59a' },
                      { type: 'Triadic', color: '#d5b9a8' },
                      { type: 'Complementary', color: '#d5a8b9' }
                    ].map((h, i) => (
                      <div 
                        key={i} 
                        onClick={() => copyToClipboard(h.color)}
                        className="p-3 border border-border-subtle rounded-2xl bg-modal-sidebar cursor-pointer hover:shadow-md transition active:scale-95 space-y-2 select-none"
                      >
                        <div className="w-full h-12 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: h.color }} />
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-foreground/60">{h.type}</p>
                          <p className="text-[10px] font-mono font-black tracking-tight text-foreground/80 mt-0.5">{h.color.toUpperCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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

              {/* Reader mode and URL preview */}
              {(item.type === 'article' || item.type === 'link') && (
                <div className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Distraction-Free Reader Mode
                    </h4>
                    <p className="text-[11px] text-foreground/60 leading-relaxed font-medium">
                      Read the stripped, clean text of this webpage with premium customizable styling.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenReader?.(item);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0 border border-primary/10"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Reader</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quote Author */}
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

            {/* Editor Container with Document/Sheet Toggles */}
            <div className="space-y-4">
              {item.type === 'note' && (
                <div className="flex border-b border-border-subtle/80 pb-2 gap-2">
                  <button
                    onClick={() => setEditMode('document')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                      editMode === 'document' 
                        ? 'bg-foreground text-background border-foreground shadow-sm' 
                        : 'bg-transparent text-foreground/50 border-transparent hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Document View</span>
                  </button>
                  <button
                    onClick={() => setEditMode('sheet')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                      editMode === 'sheet' 
                        ? 'bg-foreground text-background border-foreground shadow-sm' 
                        : 'bg-transparent text-foreground/50 border-transparent hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Spreadsheet View</span>
                  </button>
                </div>
              )}

              {/* DUAL MODE EDITOR AREA */}
              {editMode === 'sheet' && item.type === 'note' ? (
                /* SHEET / SPREADSHEET EDITOR */
                <div className="space-y-3.5 overflow-x-auto p-1 max-w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={addRow}
                      className="px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-[10px] font-bold border border-border-subtle rounded-xl flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                    <button 
                      onClick={addColumn}
                      className="px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-[10px] font-bold border border-border-subtle rounded-xl flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Column
                    </button>
                  </div>
                  
                  <table className="w-full border-collapse border border-border-subtle rounded-2xl overflow-hidden shadow-sm text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-modal-sidebar border-b border-border-subtle">
                        {tableData[0]?.map((header, colIdx) => (
                          <th key={`header-${colIdx}`} className="p-2 border-r border-border-subtle text-left font-bold relative group">
                            <input 
                              type="text" 
                              value={header} 
                              onChange={e => handleCellChange(0, colIdx, e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-foreground w-full p-1"
                            />
                            <button 
                              onClick={() => deleteColumn(colIdx)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.slice(1).map((row, rowIdx) => (
                        <tr key={`row-${rowIdx}`} className="border-b border-border-subtle/50 hover:bg-foreground/[0.01]">
                          {row.map((cell, colIdx) => (
                            <td key={`cell-${rowIdx}-${colIdx}`} className="p-1.5 border-r border-border-subtle/50 relative group">
                              <input 
                                type="text" 
                                value={cell} 
                                onChange={e => handleCellChange(rowIdx + 1, colIdx, e.target.value)}
                                className="bg-transparent border-none outline-none text-foreground/90 w-full p-1.5"
                              />
                              {colIdx === 0 && (
                                <button 
                                  onClick={() => deleteRow(rowIdx + 1)}
                                  className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* DOCUMENT EDITOR (with toggled markdown preview & formatting toolbar) */
                <div className="space-y-3">
                  {/* Text Editor Formatting Bar */}
                  <div className="flex items-center gap-1 bg-foreground/[0.02] border border-border-subtle rounded-xl p-1 shrink-0 select-none">
                    <button
                      onClick={() => setIsPreview(!isPreview)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                        isPreview 
                          ? 'bg-foreground text-background border-foreground' 
                          : 'bg-transparent text-foreground/50 border-transparent hover:text-foreground hover:bg-foreground/5'
                      }`}
                    >
                      {isPreview ? '✏️ Edit Mode' : '👁️ Markdown Preview'}
                    </button>

                    <div className="h-4 w-[1px] bg-border-subtle/60 mx-1.5"></div>

                    <button
                      onClick={() => {
                        const style = { ...noteStyle, bold: !noteStyle.bold };
                        setNoteStyle(style);
                        handleAutoSaveWithValues(title, content, style);
                      }}
                      className={`p-1.5 rounded-lg transition ${noteStyle.bold ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:bg-foreground/5'}`}
                      title="Bold Text"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const style = { ...noteStyle, italic: !noteStyle.italic };
                        setNoteStyle(style);
                        handleAutoSaveWithValues(title, content, style);
                      }}
                      className={`p-1.5 rounded-lg transition ${noteStyle.italic ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:bg-foreground/5'}`}
                      title="Italic Text"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                  </div>

                  <div 
                    className="min-h-[300px] rounded-2xl border border-border-subtle/50 p-4 transition-colors"
                    style={{ 
                      backgroundColor: noteStyle.bgColor || 'transparent', 
                      color: noteStyle.color || 'inherit' 
                    }}
                  >
                    {isPreview ? (
                      <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-sans min-h-[300px] p-2">
                        <ReactMarkdown>{content || '*Empty note*'}</ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onBlur={handleAutoSave}
                        placeholder={item.type === 'quote' ? "Quote..." : "Empty note..."}
                        className={`w-full text-foreground/90 leading-relaxed bg-transparent border-none outline-none resize-none min-h-[350px] placeholder-foreground/20 ${fontClasses[noteStyle.fontFamily || 'sans']}`}
                        style={{
                          fontSize: noteStyle.fontSize === 'sm' ? '14px' : noteStyle.fontSize === 'lg' ? '20px' : noteStyle.fontSize === 'xl' ? '24px' : '16px',
                          fontWeight: noteStyle.bold ? 'bold' : 'normal',
                          fontStyle: noteStyle.italic ? 'italic' : 'normal',
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {item.aiSummary && (
              <div className="p-5 bg-gradient-to-br from-primary/[0.04] to-indigo-500/[0.04] border border-primary/10 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 fill-primary/20 text-primary animate-pulse" />
                  AI Summary
                </span>
                <p className="text-sm text-foreground/80 font-sans leading-relaxed">
                  {item.aiSummary}
                </p>
              </div>
            )}

            {/* Image Annotation Section */}
            {item.imageUrl && (
              <div className="pt-6 border-t border-border-subtle/50 space-y-4">
                <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                  Image Annotations
                </span>

                {/* Existing Annotations List */}
                <div className="space-y-2">
                  {annotations.map((ann) => (
                    <div key={ann.id} className="flex items-start justify-between p-3 rounded-xl border border-border-subtle bg-foreground/[0.01] hover:bg-foreground/[0.02]">
                      <div className="text-xs space-y-0.5 pr-4">
                        <span className="text-[9px] font-mono text-foreground/40 font-bold">{ann.time}</span>
                        <p className="text-foreground/80 font-sans leading-relaxed">{ann.text}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAnnotation(ann.id)}
                        className="text-foreground/30 hover:text-rose-500 p-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {annotations.length === 0 && (
                    <p className="text-xs text-foreground/35 italic">No annotations added yet. Type below to annotate specific details.</p>
                  )}
                </div>

                {/* Add Annotation Form */}
                <form onSubmit={handleAddAnnotation} className="flex gap-2">
                  <input
                    type="text"
                    value={imageAnnotation}
                    onChange={e => setImageAnnotation(e.target.value)}
                    placeholder="Enter image annotation detail..."
                    className="flex-1 bg-input-bg border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-foreground placeholder-foreground/35 outline-none focus:border-primary/40 transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-foreground text-xs font-bold rounded-xl hover:opacity-95 active:scale-95 transition"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* Bidirectional links (mymind-style) */}
            {item && (
              <div className="pt-8 border-t border-border-subtle/50 space-y-4">
                <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Linked Ideas
                </span>
                <p className="text-[11px] text-foreground/45 leading-relaxed">
                  Type <code className="px-1 py-0.5 rounded bg-foreground/5 font-mono text-[10px]">[[Note Title]]</code> in the body, or link an item below.
                </p>
                {(() => {
                  const outboundIds = syncLinkedItemIds(item, allItems);
                  const outbound = outboundIds
                    .map((id) => allItems.find((i) => i.id === id))
                    .filter(Boolean) as MindItem[];
                  const backlinks = getBacklinks(item.id, allItems);
                  return (
                    <>
                      {outbound.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {outbound.map((linked) => (
                            <button
                              key={linked.id}
                              type="button"
                              onClick={() => onNavigateToItem?.(linked)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition cursor-pointer"
                            >
                              → {linked.title || linked.type}
                            </button>
                          ))}
                        </div>
                      )}
                      {backlinks.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-foreground/40">
                            Backlinks
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {backlinks.map((bl) => (
                              <button
                                key={bl.id}
                                type="button"
                                onClick={() => onNavigateToItem?.(bl)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle bg-foreground/[0.02] text-foreground/70 hover:border-foreground/20 transition cursor-pointer"
                              >
                                ← {bl.title || bl.type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={linkPickerQuery}
                          onChange={(e) => setLinkPickerQuery(e.target.value)}
                          placeholder="Search vault to link…"
                          className="w-full bg-input-bg border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-foreground placeholder-foreground/35 outline-none focus:border-primary/40"
                        />
                        {linkPickerQuery.trim().length > 0 && (
                          <div className="max-h-36 overflow-y-auto rounded-xl border border-border-subtle divide-y divide-border-subtle/60">
                            {allItems
                              .filter(
                                (i) =>
                                  i.id !== item.id &&
                                  (i.title || i.content)
                                    .toLowerCase()
                                    .includes(linkPickerQuery.toLowerCase())
                              )
                              .slice(0, 8)
                              .map((candidate) => {
                                const already = (item.linkedItemIds || []).includes(candidate.id);
                                return (
                                  <button
                                    key={candidate.id}
                                    type="button"
                                    onClick={async () => {
                                      const nextIds = already
                                        ? (item.linkedItemIds || []).filter((id) => id !== candidate.id)
                                        : Array.from(new Set([...(item.linkedItemIds || []), candidate.id]));
                                      await onUpdateItem({ ...item, linkedItemIds: nextIds });
                                      setLinkPickerQuery('');
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-foreground/[0.03] flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <span className="truncate font-medium text-foreground/80">
                                      {candidate.title || candidate.content.slice(0, 40) || candidate.type}
                                    </span>
                                    <span className="text-[9px] font-mono text-foreground/40 shrink-0">
                                      {already ? 'Unlink' : 'Link'}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Tags */}
            <div className="pt-8 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Tag className="w-3.5 h-3.5" />
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {manualTags.map((tag, idx) => (
                  <span 
                    key={`manual-${idx}`}
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
                        handleRemoveTag(tag, false);
                      }}
                      className="ml-1 text-foreground/35 hover:text-foreground/75 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                
                {aiTags.map((tag, idx) => (
                  <span 
                    key={`ai-${idx}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-primary/10 text-primary border-primary/20 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 opacity-70" />
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
                        handleRemoveTag(tag, true);
                      }}
                      className="ml-1 text-primary/50 hover:text-primary transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                
                <form onSubmit={handleAddTag} className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex items-center bg-input-bg border border-border-subtle rounded-lg px-3 py-1 flex-1 sm:w-32 focus-within:border-primary/40 transition shadow-inner">
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

            {/* Complete Note Styling & Appearance Controls (Only for 'note' type) */}
            {item.type === 'note' && (
              <div className="space-y-6 pt-6 border-t border-border-subtle/50">
                <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-primary" />
                  Visual Customization
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Font & Size options */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/50">Font Typography</label>
                      <div className="flex flex-wrap gap-1.5">
                        {FONTS.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => {
                              const style = { ...noteStyle, fontFamily: font.id };
                              setNoteStyle(style);
                              handleAutoSaveWithValues(title, content, style);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              (noteStyle.fontFamily || 'sans') === font.id
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-transparent text-foreground/60 border-border-subtle hover:bg-foreground/5'
                            }`}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/50">Font Size</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SIZES.map((sz) => (
                          <button
                            key={sz.id}
                            onClick={() => {
                              const style = { ...noteStyle, fontSize: sz.id };
                              setNoteStyle(style);
                              handleAutoSaveWithValues(title, content, style);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              (noteStyle.fontSize || 'base') === sz.id
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-transparent text-foreground/60 border-border-subtle hover:bg-foreground/5'
                            }`}
                          >
                            {sz.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors Options */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/50">Text Color Accent</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_TEXT_COLORS.map((col) => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              const style = { ...noteStyle, color: col.hex };
                              setNoteStyle(style);
                              handleAutoSaveWithValues(title, content, style);
                            }}
                            className="w-7 h-7 rounded-full transition hover:scale-105 active:scale-95 border-2 border-white/20 relative flex items-center justify-center cursor-pointer shadow-sm"
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          >
                            {noteStyle.color === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                        {noteStyle.color && (
                          <button 
                            onClick={() => {
                              const style = { ...noteStyle, color: undefined };
                              setNoteStyle(style);
                              handleAutoSaveWithValues(title, content, style);
                            }}
                            className="text-[10px] px-2.5 py-1 text-foreground/50 hover:text-foreground border border-border-subtle rounded-lg cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/50">Note Card Background</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_BG_COLORS.map((col) => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              const style = { ...noteStyle, bgColor: col.hex };
                              setNoteStyle(style);
                              handleAutoSaveWithValues(title, content, style);
                            }}
                            className="w-7 h-7 rounded-full transition hover:scale-105 active:scale-95 border border-border-subtle relative flex items-center justify-center cursor-pointer shadow-sm bg-white"
                            style={col.hex ? { backgroundColor: col.hex } : { background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px' }}
                            title={col.name}
                          >
                            {((!noteStyle.bgColor && !col.hex) || (noteStyle.bgColor === col.hex)) && <Check className="w-3.5 h-3.5 text-foreground/75" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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

          {/* Footer actions - matching settings footer */}
          <div className="px-4 md:px-6 py-4 border-t border-border-subtle bg-modal-sidebar flex justify-between items-center z-10 sticky bottom-0 select-none">
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
