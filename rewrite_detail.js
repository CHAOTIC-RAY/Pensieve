import fs from 'fs';

let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// Remove Top Border Accent
content = content.replace(
  `        {/* Editorial Top Border Accents */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />`,
  ""
);

// We want to remove the isEditing toggle logic and just use inline inputs for title and content everywhere.
// But we still need to save changes on blur or unmount, or just use a Save button?
// Right now there's an "Update Memory" button when isEditing is true.
// Actually, let's just keep the Save button at the bottom but make the title look like Notion.

content = content.replace(
  `                  <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground/90 tracking-tight leading-tight">
                    {item.title}
                  </h2>`,
  `                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="font-sans font-bold text-3xl md:text-4xl text-text-heading tracking-tight leading-tight bg-transparent border-none outline-none w-full"
                  />`
);

content = content.replace(
  `                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 hover:underline shrink-0 pt-1 flex items-center gap-1"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Edit Details
                  </button>`,
  ``
);

// Replace the content viewer with a textarea
content = content.replace(
  `                {/* Generic view for item types that aren't note or quote */}
                {item.type !== 'color' && item.type !== 'note' && item.type !== 'quote' && (
                  <p className="text-foreground/80 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                )}`,
  `                {/* Generic view for item types that aren't note or quote */}
                {item.type !== 'color' && item.type !== 'note' && item.type !== 'quote' && (
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Empty content..."
                    className="w-full text-foreground/80 text-sm md:text-base font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[150px]"
                  />
                )}`
);

// We should also automatically save on blur. But since onUpdateItem is async, maybe just leave the Save button or add a debounced auto-save.
// Or just let the user hit Save in the footer.
// Let's look at the footer.

fs.writeFileSync('src/components/DetailPanel.tsx', content);
