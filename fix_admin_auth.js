import fs from 'fs';
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

if (!content.includes('auth.currentUser')) {
  content = content.replace(
    "import { ArrowLeft, Plus, ShieldAlert, Package } from 'lucide-react';",
    "import { ArrowLeft, Plus, ShieldAlert, Package, Lock } from 'lucide-react';\nimport { auth } from '../lib/firebase';\nimport { onAuthStateChanged } from 'firebase/auth';"
  );
  
  content = content.replace(
    "const [items, setItems] = useState<StoreItem[]>([]);",
    `const [items, setItems] = useState<StoreItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);`
  );

  content = content.replace(
    "useEffect(() => {",
    `useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email || null);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {`
  );

  content = content.replace(
    "const isConfigured = isStoreAppwriteConfigured();",
    `const isConfigured = isStoreAppwriteConfigured();

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground/50">
          <Lock className="w-4 h-4" /> Authenticating Admin...
        </div>
      </div>
    );
  }

  const isAuthorized = userEmail?.toLowerCase() === '2093ray.dark@gmail.com' || userEmail?.toLowerCase() === '2003ray.dark@gmail.com';
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-text-heading mb-2">Access Denied</h1>
        <p className="text-foreground/60 mb-8 max-w-md">
          You do not have permission to view the Admin Dashboard. This area is restricted to authorized personnel.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl transition hover:opacity-90"
        >
          Return to Workspace
        </button>
      </div>
    );
  }`
  );
  
  fs.writeFileSync('src/components/AdminPanel.tsx', content);
}
