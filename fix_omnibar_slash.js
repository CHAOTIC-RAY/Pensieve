import fs from 'fs';
let content = fs.readFileSync('src/components/Omnibar.tsx', 'utf-8');

// Add /store to SLASH_COMMANDS
content = content.replace(
  "{ cmd: '/tag', label: 'Tag', desc: 'Search by tag', icon: Hash, color: 'text-neutral-500', type: null },",
  `{ cmd: '/tag', label: 'Tag', desc: 'Search by tag', icon: Hash, color: 'text-neutral-500', type: null },
  { cmd: '/store', label: 'Store', desc: 'Open the Effects Marketplace', icon: ShoppingBag, color: 'text-amber-500', type: null, isAction: true },`
);

// In handleSlashSelect
content = content.replace(
  "if (cmd.type) {",
  `if ((cmd as any).isAction && cmd.cmd === '/store') {
      window.dispatchEvent(new CustomEvent('pensieve_trigger_store'));
      return;
    }
    if (cmd.type) {`
);

fs.writeFileSync('src/components/Omnibar.tsx', content);
