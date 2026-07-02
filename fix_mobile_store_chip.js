import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = "{/* Simple avatar profile */}";
const newContent = `{/* Store Button (Mobile) */}
          <button
            onClick={() => setIsStoreOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Store
          </button>
          
          {/* Simple avatar profile */}`;

if (!content.includes('Store Button (Mobile)')) {
  content = content.replace(target, newContent);
  fs.writeFileSync('src/App.tsx', content);
}
