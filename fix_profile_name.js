import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '<span className="text-sm font-semibold text-foreground truncate">{profileName}</span>',
  '<span className="text-sm font-semibold text-foreground truncate user-name-display" data-name={profileName}>{profileName}</span>'
);

fs.writeFileSync('src/App.tsx', content);
