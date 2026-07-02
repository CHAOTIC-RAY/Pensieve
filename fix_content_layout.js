import fs from 'fs';

let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// Replace the note and quote display logic with inline-editable styled textareas or just unified inputs.
// Find the block: {item.type === 'quote' && !isEditing && ( ... )}

content = content.replace(/\{item\.type === 'quote' && \!isEditing && \([\s\S]*?\}\)/g, "");
content = content.replace(/\{item\.type === 'note' && \!isEditing && \([\s\S]*?\}\)/g, "");
content = content.replace(/\{true && \([\s\S]*?\{item\.type !== 'color' && item\.type !== 'note' && item\.type !== 'quote' && \(/g, "");

content = content.replace(
  `                {/* Generic view for item types that aren't note or quote */}
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Empty content..."
                    className="w-full text-foreground/80 text-sm md:text-base font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[150px]"
                  />
                )}
              </div>
            )}`,
  `                {item.type === 'quote' && (
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Author / Source"
                    className="w-full text-sm font-sans border-b border-border-subtle pb-1 bg-transparent outline-none text-foreground focus:border-indigo-500/40 transition-colors mb-4"
                  />
                )}
                {item.type !== 'color' && (
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder={item.type === 'quote' ? "Quote..." : "Empty content..."}
                    className="w-full text-foreground/80 text-base md:text-lg font-sans leading-relaxed bg-transparent border-none outline-none resize-none min-h-[300px]"
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
                )}
              </div>`
);

fs.writeFileSync('src/components/DetailPanel.tsx', content);
