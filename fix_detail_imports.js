import fs from 'fs';
let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

if (!content.includes('Mic')) {
  content = content.replace(
    "} from 'lucide-react';",
    ", Mic } from 'lucide-react';"
  );
  fs.writeFileSync('src/components/DetailPanel.tsx', content);
}
