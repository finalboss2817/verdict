import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Gavel, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
              <Gavel size={40} className="text-zinc-100" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-zinc-100">VERDICT</h1>
            <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-[0.2em] font-medium italic">A venture by Meena technologies</p>
          </div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">Operational Authentication Protocol</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Access Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  required
                  type="email"
                  placeholder="operator@nexus.com"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-500 text-[10px] font-bold uppercase tracking-wider text-center pt-2">
                [ ACCESS_DENIED ]: {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-zinc-100 hover:bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  {isSignUp ? 'INITIALIZE CLEARANCE' : 'ESTABLISH LINK'}
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-zinc-600 hover:text-zinc-400 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              {isSignUp ? 'Existing Clearance? Login' : 'Request Clearance? Sign Up'}
            </button>
          </div>
        </div>

        <div className="text-center opacity-30">
          <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">
            Encrypted End-to-End Operational Environment
          </p>
        </div>
      </div>
    </div>
  );
};