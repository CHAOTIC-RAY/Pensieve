import fs from 'fs';

let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// 1. Add popstate logic
content = content.replace(
  "useEffect(() => {\n    if (item) {\n      setTitle(item.title);",
  `useEffect(() => {
    if (item) {
      window.history.pushState({ modal: 'detailPanel' }, '');
      const handlePopState = (e) => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      
      setTitle(item.title);`
);

content = content.replace(
  "setIsEditing(false);\n    }\n  }, [item]);",
  `setIsEditing(false);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'detailPanel') {
          window.history.back();
        }
      };
    }
  }, [item, onClose]);`
);

// 2. Make it fullscreen on mobile
content = content.replace(
  "className=\"fixed inset-0 z-[100010] flex items-center justify-center p-4\"",
  "className=\"fixed inset-0 z-[100010] flex items-center justify-center md:p-4\""
);

content = content.replace(
  "className=\"w-full max-w-2xl max-h-[90vh] bg-modal-bg shadow-2xl flex flex-col rounded-3xl border border-border-subtle relative overflow-hidden\"",
  "className=\"w-full h-full md:max-w-2xl md:h-auto md:max-h-[90vh] bg-card-bg shadow-2xl flex flex-col md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden\""
);

// 3. Make header Notion-style and responsive
content = content.replace(
  `        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle/40 bg-modal-bg z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              Memory Registry
            </span>`,
  `        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border-subtle/40 bg-card-bg z-10 sticky top-0">
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={onClose}
              className="md:hidden p-2 -ml-2 rounded-xl text-foreground/60 hover:bg-foreground/5"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-[10px] md:text-xs font-semibold text-foreground/50 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400 hidden md:block" />
              Memory
            </span>`
);

content = content.replace(
  `          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80 transition"
          >
            <X className="w-5 h-5" />
          </button>`,
  `          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="hidden md:flex p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>`
);

fs.writeFileSync('src/components/DetailPanel.tsx', content);
