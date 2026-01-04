import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './services/supabase';
import { analyzeObjection } from './services/geminiService';
import { Analysis, ObjectionInput } from './types';
import { AnalysisView } from './components/AnalysisView';
import { HistoryItem } from './components/HistoryItem';
import { Protocol } from './components/Protocol';
import { Auth } from './components/Auth';
import { Gavel, LayoutDashboard, History, PlusCircle, Loader2, Send, AlertCircle, BookOpen, LogOut, User, Zap, Crosshair, Key, Menu, X } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const INITIAL_FORM_STATE: ObjectionInput = {
  objection: '',
  ticketSize: 'High-Ticket',
  product: '',
  stage: 'Discovery Call',
  mode: 'VOID'
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'engine' | 'protocol'>('engine');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [formData, setFormData] = useState<ObjectionInput>(INITIAL_FORM_STATE);
  
  // Track if authorization was recently triggered to avoid race condition resets
  const authTriggeredRef = useRef(false);

  const checkKey = useCallback(async () => {
    // If we just authorized, skip the automated check for a moment to let the environment settle
    if (authTriggeredRef.current) return;

    const aiStudio = (window as any).aistudio;
    if (aiStudio?.hasSelectedApiKey) {
      try {
        const selected = await aiStudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } catch (e) {
        setHasApiKey(false);
      }
    } else if (process.env.API_KEY) {
      setHasApiKey(true);
    } else {
      setHasApiKey(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    checkKey();
    const interval = setInterval(checkKey, 3000);
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkKey]);

  const handleAuthorize = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio?.openSelectKey) {
      try {
        authTriggeredRef.current = true;
        await aiStudio.openSelectKey();
        setHasApiKey(true);
        setError(null);
        // Reset the trigger flag after a short delay
        setTimeout(() => { authTriggeredRef.current = false; }, 5000);
      } catch (err) {
        authTriggeredRef.current = false;
        setError("Authorization portal failed to open.");
      }
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('timestamp', { ascending: false });
    if (!error && data) setHistory(data as Analysis[]);
  }, [session]);

  useEffect(() => {
    if (session) fetchHistory();
  }, [session, fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.objection.trim() || !session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeObjection(formData);
      const newEntry = {
        timestamp: Date.now(),
        objection: formData.objection,
        mode: formData.mode,
        context: {
          ticketSize: formData.ticketSize,
          product: formData.product,
          stage: formData.stage
        },
        result,
        user_id: session.user.id
      };

      const { data, error: dbError } = await supabase
        .from('analyses')
        .insert([newEntry])
        .select()
        .single();

      if (dbError) throw dbError;

      const savedAnalysis = data as Analysis;
      setHistory(prev => [savedAnalysis, ...prev]);
      setCurrentAnalysisId(savedAnalysis.id);
      setActiveView('engine');
      setFormData(INITIAL_FORM_STATE);
    } catch (err: any) {
      console.error("Verdict Error:", err);
      if (err.message === "MISSING_API_KEY" || err.message === "ENTITY_NOT_FOUND" || err.message.includes("API key")) {
        setHasApiKey(false);
        setError("Access Restricted: A valid API Key is required. Please use the 'AUTHORIZE ENGINE' gateway.");
      } else {
        setError(err.message || "The tactical link was severed. Verify your objection input.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (isInitialLoading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center">
      <Loader2 className="animate-spin text-zinc-500" size={32} />
    </div>
  );

  if (!session) return <Auth />;

  const currentAnalysis = history.find(a => a.id === currentAnalysisId);

  return (
    <div className="flex h-screen bg-[#070707] text-zinc-100 overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 lg:relative z-50 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-0 lg:opacity-0'}`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-zinc-100">
              <Gavel size={24} />
              <h1 className="font-black italic tracking-tighter text-xl">VERDICT</h1>
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">A venture by Meena technologies</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500">
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 border-b border-zinc-900 space-y-1">
          <button onClick={() => setActiveView('engine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'engine' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LayoutDashboard size={18} /> Engine
          </button>
          <button onClick={() => setActiveView('protocol')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'protocol' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <BookOpen size={18} /> Protocol
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 text-zinc-600 px-2 py-1">
            <History size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">History</span>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest">No previous verdicts</p>
            </div>
          ) : (
            history.map(item => (
              <HistoryItem key={item.id} analysis={item} isActive={currentAnalysisId === item.id} onClick={() => { setCurrentAnalysisId(item.id); setActiveView('engine'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center"><User size={16} className="text-zinc-500" /></div>
              <span className="text-[10px] font-black text-zinc-500 uppercase truncate max-w-[100px]">{session.user.email?.split('@')[0]}</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-zinc-600 hover:text-rose-400" title="Logout"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#070707] relative overflow-y-auto">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-4 md:px-6 sticky top-0 bg-[#070707]/90 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-600 hover:text-zinc-100"><Menu size={18} /></button>
          <div className="flex gap-2">
            {!hasApiKey && (
              <button onClick={handleAuthorize} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2 rounded-full text-[10px] font-black transition-all animate-pulse">
                <Key size={14} /> AUTHORIZE ENGINE
              </button>
            )}
            <button onClick={() => { setCurrentAnalysisId(null); setActiveView('engine'); setError(null); }} className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-full text-[10px] font-black transition-all shadow-xl">
              <PlusCircle size={14} /> NEW VERDICT
            </button>
          </div>
        </header>

        <div className="flex-1 w-full">
          {activeView === 'protocol' ? <Protocol /> : (
            <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-12">
              {(!currentAnalysisId || !currentAnalysis) ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="text-center space-y-4">
                    <h2 className="text-5xl md:text-6xl font-black text-zinc-100 tracking-tighter italic">VERDICT</h2>
                    <p className="text-zinc-600 text-[10px] md:text-sm font-medium uppercase tracking-widest">The Deal Disqualification Engine</p>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 md:p-10 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20"></div>
                    
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Selection</label>
                       <div className="grid grid-cols-2 gap-4">
                          <button type="button" onClick={() => setFormData({...formData, mode: 'VOID'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.mode === 'VOID' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                            <Zap size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">VOID (Sovereign)</span>
                          </button>
                          <button type="button" onClick={() => setFormData({...formData, mode: 'NEXUS'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.mode === 'NEXUS' ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                            <Crosshair size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">NEXUS (Tactical)</span>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Objection Script</label>
                      <textarea required placeholder='"We need more time to discuss with our internal team..."' className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[160px] resize-none text-base font-medium" value={formData.objection} onChange={(e) => setFormData({...formData, objection: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ticket Size</label>
                        <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 font-bold appearance-none cursor-pointer" value={formData.ticketSize} onChange={(e) => setFormData({...formData, ticketSize: e.target.value})}>
                          <option>High-Ticket ($10k+)</option><option>Mid-Ticket ($1k-$10k)</option><option>B2B Enterprise</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Market Sector</label>
                        <input required type="text" placeholder="e.g. Consulting" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 font-bold focus:outline-none focus:border-zinc-600" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Deal Phase</label>
                        <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 font-bold appearance-none cursor-pointer" value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                          <option>Discovery Call</option><option>Proposal Sent</option><option>Closing Stage</option>
                        </select>
                      </div>
                    </div>

                    <button disabled={isLoading} className="w-full bg-zinc-100 hover:bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-sm shadow-2xl active:scale-[0.98]">
                      {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={18} /> GENERATE FINAL VERDICT</>}
                    </button>

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex flex-col gap-2 text-rose-400 text-xs text-center animate-in shake duration-300">
                        <div className="flex items-center justify-center gap-3">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="font-bold uppercase tracking-tight">{error}</p>
                        </div>
                        {!hasApiKey && (
                          <p className="text-[9px] text-rose-500/60 uppercase font-black tracking-widest">Authorization required to establish engine link.</p>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              ) : <AnalysisView analysis={currentAnalysis} onDelete={(id) => {
                supabase.from('analyses').delete().eq('id', id).then(() => {
                  setHistory(h => h.filter(a => a.id !== id));
                  setCurrentAnalysisId(null);
                });
              }} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;