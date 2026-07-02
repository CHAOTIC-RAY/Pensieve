import fs from 'fs';

let content = fs.readFileSync('src/components/SerendipityView.tsx', 'utf-8');

if (!content.includes("pushState")) {
  content = content.replace(
    "export default function SerendipityView({ isOpen, onClose, items, onInspectItem, onToggleFavorite }: SerendipityViewProps) {",
    `export default function SerendipityView({ isOpen, onClose, items, onInspectItem, onToggleFavorite }: SerendipityViewProps) {
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'serendipity' }, '');
      const handlePopState = () => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'serendipity') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);`
  );
  
  fs.writeFileSync('src/components/SerendipityView.tsx', content);
}
