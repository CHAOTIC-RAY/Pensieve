import fs from 'fs';

let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// 1. Remove isEditing toggle and its block entirely
content = content.replace(/\{isEditing \? \([\s\S]*?\) : null\}/m, "");
content = content.replace(/\{\!isEditing && \(/g, "{true && (");

// 2. We can call handleSaveChanges on onBlur of the title and content.
// wait, handleSaveChanges looks like this:
//   const handleSaveChanges = async () => {
//     if (!item) return;
//     const updated = { ...item, title, content, author, tags };
//     await onUpdateItem(updated);
//     setIsEditing(false);
//   };
// We can just create an auto-save function.
content = content.replace(
  "const handleSaveChanges = async () => {",
  `const handleSaveChanges = async () => {
    if (!item) return;
    const updated = { ...item, title, content, author, tags, noteStyle };
    await onUpdateItem(updated);
  };
  
  const handleAutoSave = () => {
    if (title !== item?.title || content !== item?.content || author !== item?.author) {
      handleSaveChanges();
    }
  };
  
  const oldHandleSaveChanges = async () => {`
);

// Add onBlur to title
content = content.replace(
  `                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="font-sans font-bold text-3xl md:text-4xl text-text-heading tracking-tight leading-tight bg-transparent border-none outline-none w-full"
                  />`,
  `                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Untitled"
                    className="font-sans font-bold text-3xl md:text-4xl text-text-heading tracking-tight leading-tight bg-transparent border-none outline-none w-full"
                  />`
);

// Add onBlur to content (textarea)
content = content.replace(
  `                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Empty content..."
                    className="w-full text-foreground/80 text-sm md:text-base font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[150px]"
                  />`,
  `                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Empty content..."
                    className="w-full text-foreground/80 text-sm md:text-base font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[150px]"
                  />`
);

fs.writeFileSync('src/components/DetailPanel.tsx', content);
