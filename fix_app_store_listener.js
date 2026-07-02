import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('pensieve_trigger_store')) {
  content = content.replace(
    "useEffect(() => {",
    `useEffect(() => {
    const handleStore = () => setIsStoreOpen(true);
    window.addEventListener('pensieve_trigger_store', handleStore);
    return () => window.removeEventListener('pensieve_trigger_store', handleStore);
  }, []);
  
  useEffect(() => {`
  );
  fs.writeFileSync('src/App.tsx', content);
}
