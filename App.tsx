import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { analyzeObjection } from './services/geminiService';
import { Analysis, ObjectionInput } from './types';
import { AnalysisView } from './components/AnalysisView';
import { HistoryItem } from './components/HistoryItem';
import { Protocol } from './components/Protocol';
import { Auth } from './components/Auth';
import { Gavel, LayoutDashboard, History, PlusCircle, Loader2, Send, AlertCircle, BookOpen, LogOut, User, Zap, Crosshair, Menu, X, Link as LinkIcon, Settings } from 'lucide-react';
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
  const [formData, setFormData] = useState<ObjectionInput>(INITIAL_FORM_STATE);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    return () => subscription.unsubscribe();
  }, []);

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

  const handleLinkEngine = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
      try {
        await aiStudio.openSelectKey();
        setError(null);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const handleSubmit = async (e?: React.FormEvent, retryCount = 0) => {
    if (e) e.preventDefault();
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
      console.error(`Engine Exception:`, err);
      
      // Auto-recovery for platform-specific key issues
      const isAuthIssue = err.message === "AUTH_KEY_MISSING" || 
                          err.message === "AUTH_KEY_INVALID" || 
                          err.message === "ENTITY_NOT_FOUND";

      if (isAuthIssue && retryCount < 1) {
        const linked = await handleLinkEngine();
        if (linked) {
          // Proceed with silent retry assuming key was selected
          return handleSubmit(undefined, retryCount + 1);
        }
      }

      // Final Error State Messaging
      if (err.message === "AUTH_KEY_MISSING") {
        setError("API CONFIGURATION MISSING: Ensure 'API_KEY' is set in your environment variables.");
      } else if (err.message === "AUTH_KEY_INVALID") {
        setError("INVALID API KEY: The provided engine key was rejected by the server.");
      } else {
        setError(err.message || "An unexpected engine fault occurred.");
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 lg:relative z-50 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden'}`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-zinc-100">
              <Gavel size={24} />
              <h1 className="font-black italic tracking-tighter text-xl uppercase text-white">VERDICT</h1>
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">Meena Technologies</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 border-b border-zinc-900 space-y-1">
          <button onClick={() => { setActiveView('engine'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'engine' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LayoutDashboard size={18} /> Engine
          </button>
          <button onClick={() => { setActiveView('protocol'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'protocol' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
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
              <p className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest">Pipeline Clear</p>
            </div>
          ) : (
            history.map(item => (
              <HistoryItem key={item.id} analysis={item} isActive={currentAnalysisId === item.id && activeView === 'engine'} onClick={() => { setCurrentAnalysisId(item.id); setActiveView('engine'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
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

      <main className="flex-1 flex flex-col h-full bg-[#070707] relative overflow-hidden">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-4 md:px-6 sticky top-0 bg-[#070707]/95 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-600 hover:text-zinc-100 transition-colors"><Menu size={18} /></button>
          <div className="flex items-center gap-3">
             <button onClick={handleLinkEngine} className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-zinc-300 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all">
               <Settings size={12} /> Config Engine
             </button>
             <button onClick={() => { setCurrentAnalysisId(null); setActiveView('engine'); setError(null); }} className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-5 py-2.5 rounded-full text-[10px] font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest">
               <PlusCircle size={14} /> New Verdict
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {activeView === 'protocol' ? <Protocol /> : (
            <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-12">
              {(!currentAnalysisId || !currentAnalysis) ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <div className="text-center space-y-4">
                    <h2 className="text-5xl md:text-7xl font-black text-zinc-100 tracking-tighter italic uppercase">VERDICT</h2>
                    <p className="text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em]">The Deal Disqualification Engine</p>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-zinc-900/10 border border-zinc-800/50 rounded-[40px] p-6 md:p-12 space-y-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/30"></div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Operation Protocol</label>
                       <div className="grid grid-cols-2 gap-4">
                          <button type="button" onClick={() => setFormData({...formData, mode: 'VOID'})} className={`group p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all duration-300 ${formData.mode === 'VOID' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-zinc-950/50 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>
                            <Zap size={24} className={formData.mode === 'VOID' ? 'animate-pulse' : ''} /> 
                            <div className="text-center">
                              <span className="block font-black text-[10px] uppercase tracking-widest">VOID</span>
                              <span className="text-[8px] opacity-60 uppercase font-bold tracking-tighter text-zinc-500">Sovereign Focus</span>
                            </div>
                          </button>
                          <button type="button" onClick={() => setFormData({...formData, mode: 'NEXUS'})} className={`group p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all duration-300 ${formData.mode === 'NEXUS' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-2xl shadow-blue-500/10' : 'bg-zinc-950/50 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>
                            <Crosshair size={24} className={formData.mode === 'NEXUS' ? 'animate-pulse' : ''} />
                            <div className="text-center">
                              <span className="block font-black text-[10px] uppercase tracking-widest">NEXUS</span>
                              <span className="text-[8px] opacity-60 uppercase font-bold tracking-tighter text-zinc-500">Tactical Bridge</span>
                            </div>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Objection Input</label>
                      <textarea required placeholder='"I need to talk this over with my board... we will circle back in a few weeks."' className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[180px] resize-none text-base font-medium placeholder:text-zinc-800 transition-all" value={formData.objection} onChange={(e) => setFormData({...formData, objection: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Deal Size</label>
                        <select className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-400 font-bold appearance-none cursor-pointer focus:border-zinc-700" value={formData.ticketSize} onChange={(e) => setFormData({...formData, ticketSize: e.target.value})}>
                          <option>High-Ticket ($10k+)</option><option>Mid-Ticket ($1k-$10k)</option><option>B2B Enterprise</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Market/Product</label>
                        <input required type="text" placeholder="e.g. Agency Services" className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-100 font-bold focus:outline-none focus:border-zinc-700 placeholder:text-zinc-800" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Phase</label>
                        <select className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-400 font-bold appearance-none cursor-pointer focus:border-zinc-700" value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                          <option>Discovery Call</option><option>Proposal Sent</option><option>Closing Stage</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <button disabled={isLoading} className="w-full bg-zinc-100 hover:bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 text-xs tracking-widest shadow-2xl active:scale-[0.98] uppercase">
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={18} /> Decode Objection</>}
                      </button>

                      {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex flex-col items-center gap-4 text-rose-400 text-xs animate-shake">
                          <AlertCircle size={24} className="shrink-0" />
                          <div className="flex-1 space-y-1">
                             <p className="font-bold uppercase tracking-tight">{error}</p>
                             <p className="text-[9px] opacity-70">Verify your hosting provider's Environment Variables (API_KEY).</p>
                          </div>
                        </div>
                      )}
                    </div>
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