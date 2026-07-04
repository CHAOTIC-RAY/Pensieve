import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  LogIn,
  Chrome,
  UserCircle,
  UserPlus
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        navigate('/');
      }
    }).catch((err) => {
      console.error("Redirect auth error:", err);
      setError(err.message || "Failed to sign in via redirect.");
    });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    const isIframe = window !== window.parent;
    const provider = new GoogleAuthProvider();
    
    if (isIframe) {
      setError("Google Sign-In is restricted inside preview iframes due to browser security policies. Please use 'Continue as Guest' or click 'Open in New Tab' below to log in.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result) {
        navigate('/');
      }
    } catch (err: any) {
      console.error("Error signing in with Google popup:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirErr: any) {
          console.error("Error signing in with Google redirect fallback:", redirErr);
          setError("Popup was blocked/closed, and fallback redirect also failed. Please allow popups or try another browser.");
          setIsLoading(false);
        }
      } else {
        setError(err.message || "Failed to sign in with Google.");
        setIsLoading(false);
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      localStorage.removeItem('pensieve_local_guest_active');
      window.location.href = '/';
    } catch (err: any) {
      console.warn("Firebase Anonymous sign-in failed/disabled, falling back to Local Guest Mode:", err);
      // Fallback to Local Guest Mode
      localStorage.setItem('pensieve_local_guest_active', 'true');
      window.location.href = '/';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Error with email auth:", err);
      if (isSignUp) {
        setError("Sign up failed. Ensure email/password is enabled.");
      } else {
        setError("Sign in failed. Check your credentials.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Gradient Background Elements */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-100/50 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[150px] rounded-full animate-[pulse_8s_infinite_alternate]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-purple-50/40 via-white to-primary/5 opacity-80" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/landing')}
          className="mb-8 flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-mono uppercase tracking-widest">Back to Landing</span>
        </button>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-3xl border border-black/[0.05] rounded-[32px] p-8 md:p-10 shadow-2xl shadow-purple-200/50 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black text-neutral-900 font-display tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-neutral-500 text-sm font-sans max-w-[240px] mx-auto leading-relaxed">
              {isSignUp 
                ? 'Join the collective intelligence and start mapping your mind.' 
                : 'Sign in to access your sovereign memory vault.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-[11px] text-center font-mono flex flex-col items-center gap-3"
            >
              <div className="leading-relaxed">{error}</div>
              {window !== window.parent && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors inline-block select-none cursor-pointer"
                >
                  Open in New Tab
                </a>
              )}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 bg-[#0c0d12] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span className="text-sm">Continue with Google</span>
            </button>

            {/* Anonymous Sign In Button */}
            <button
              onClick={handleAnonymousSignIn}
              disabled={isLoading}
              className="w-full py-4 bg-white border border-black/[0.05] text-neutral-700 rounded-2xl font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              <UserCircle className="w-5 h-5 text-neutral-400" />
              <span className="text-sm">Continue as Guest</span>
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white/80 text-neutral-300 font-mono uppercase tracking-[0.2em]">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white transition-all outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-primary/20 disabled:opacity-50"
            >
              {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{isLoading ? (isSignUp ? 'Creating...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-neutral-400 hover:text-neutral-600 text-xs font-sans transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-primary font-bold">Sign In</span></>
              ) : (
                <>Don't have an account? <span className="text-primary font-bold">Sign Up</span></>
              )}
            </button>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-mono text-neutral-300 uppercase tracking-[0.3em]">
          End-to-End Encrypted Session
        </p>
      </motion.div>
    </div>
  );
}
