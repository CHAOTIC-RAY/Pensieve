import fs from 'fs';
let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// Replace framer motion variants
content = content.replace(
  /initial={{ scale: 0\.95, opacity: 0 }}/,
  "initial={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}"
).replace(
  /animate={{ scale: 1, opacity: 1 }}/,
  "animate={{ y: 0, opacity: 1 }}"
).replace(
  /exit={{ scale: 0\.95, opacity: 0 }}/,
  "exit={{ y: window.innerWidth < 768 ? '100%' : 20, opacity: window.innerWidth < 768 ? 1 : 0 }}"
).replace(
  /transition={{ type: 'spring', damping: 25, stiffness: 300 }}/,
  "transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}"
);

// Tweak the container sizing
content = content.replace(
  'className="w-full h-full md:max-w-3xl md:h-auto md:max-h-[95vh] bg-card-bg shadow-2xl flex flex-col md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden"',
  'className="w-full h-full md:max-w-4xl md:h-[85vh] bg-background md:bg-card-bg shadow-2xl flex flex-col md:rounded-3xl border-0 md:border md:border-border-subtle relative overflow-hidden"'
);

// Notion style improvements for title and content
content = content.replace(
  'className="font-sans font-bold text-3xl md:text-5xl text-text-heading tracking-tight leading-tight bg-transparent border-none outline-none w-full"',
  'className="font-sans font-black text-4xl md:text-5xl text-foreground tracking-tight leading-tight bg-transparent border-none outline-none w-full placeholder-foreground/20"'
);

content = content.replace(
  'className="w-full text-foreground/90 text-base md:text-lg font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[300px]"',
  'className="w-full text-foreground/90 text-lg md:text-xl font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[400px] placeholder-foreground/20"'
);

content = content.replace(
  'className="fixed inset-0 z-[100010] flex items-center justify-center md:p-4"',
  'className="fixed inset-0 z-[100010] flex items-end md:items-center justify-center md:p-6"'
);

// Tweak header
content = content.replace(
  'className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border-subtle/40 bg-card-bg z-10 sticky top-0"',
  'className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5 border-b border-border-subtle/40 bg-background/80 md:bg-card-bg/80 backdrop-blur-xl z-20 sticky top-0"'
);

// Tweak inner container padding
content = content.replace(
  'className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-8 no-scrollbar z-10 custom-scrollbar"',
  'className="flex-1 overflow-y-auto px-6 md:px-16 py-10 space-y-8 no-scrollbar z-10 custom-scrollbar"'
);

fs.writeFileSync('src/components/DetailPanel.tsx', content);
