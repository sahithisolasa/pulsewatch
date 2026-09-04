import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, loginDemo } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signup(email, password, displayName.trim());
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginDemo();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0A0A0B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1-Click Demo Highlight for hackathon reviewers */}
        <div className="mb-6 p-4 rounded-lg bg-[#141416] border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">
              Hackathon Fast-Track
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Test the personal checkpointing and Firestore watchlist sync in one click.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition shadow-sm disabled:opacity-60"
          >
            <span>One-Click Demo Analyst Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Or {isSignUp ? 'create account' : 'sign in'}
          </span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Full Name</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#141416] rounded border border-slate-800 focus-within:border-blue-500">
                <User className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Email Address</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#141416] rounded border border-slate-800 focus-within:border-blue-500">
              <Mail className="w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Password</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#141416] rounded border border-slate-800 focus-within:border-blue-500">
              <Lock className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Watchlist Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account yet? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
