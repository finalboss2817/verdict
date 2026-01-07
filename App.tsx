import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { analyzeObjection } from './services/geminiService';
import { Analysis, ObjectionInput } from './types';
import { AnalysisView } from './components/AnalysisView';
import { HistoryItem } from './components/HistoryItem';
import { Protocol } from './components/Protocol';
import { Auth } from './components/Auth';
import { Gavel, LayoutDashboard, History, PlusCircle, Loader2, Send, AlertCircle, BookOpen, LogOut, User, Zap, Crosshair, Menu, X, Settings } from 'lucide-react';
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
      await aiStudio.openSelectKey();
      setError(null);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e?: React.FormEvent, isRetry = false) => {
    if (e) e.preventDefault();
    if (!formData.objection.trim() || !session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeObjection(formData);
      
      const { data, error: dbError } = await supabase
        .from('analyses')
        .insert([{
          timestamp: Date.now(),
          objection: formData.objection,
          mode: formData.mode,
          context: { ticketSize: formData.ticketSize, product: formData.product, stage: formData.stage },
          result,
          user_id: session.user.id
        }])
        .select().single();

      if (dbError) throw dbError;

      setHistory(prev => [data as Analysis, ...prev]);
      setCurrentAnalysisId(data.id);
      setActiveView('engine');
      setFormData(INITIAL_FORM_STATE);
    } catch (err: any) {
      if (!isRetry && (err.message === "KEY_REQUIRED" || err.message === "AUTH_FAIL")) {
        const linked = await handleLinkEngine();
        if (linked) return handleSubmit(undefined, true);
      }
      setError(err.message === "KEY_REQUIRED" ? "Connection required. Click to link engine." : "Engine connection failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center">
      <Loader2 className="animate-spin text-zinc-500" size={32} />
    </div>
  );

  if (!session) return <Auth />;

  const currentAnalysis = history.find(a => a.id === currentAnalysisId);

  return (
    <div className="flex h-screen bg-[#070707] text-zinc-100 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 lg:relative z-50 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-0 lg:opacity-0'}`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Gavel size={24} />
              <h1 className="font-black italic text-xl uppercase tracking-tighter">VERDICT</h1>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500"><X size={20} /></button>
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
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </div>
          {history.map(item => (
            <HistoryItem key={item.id} analysis={item} isActive={currentAnalysisId === item.id && activeView === 'engine'} onClick={() => { setCurrentAnalysisId(item.id); setActiveView('engine'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} />
          ))}
        </div>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center"><User size={16} className="text-zinc-500" /></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase truncate max-w-[100px]">{session.user.email?.split('@')[0]}</span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-zinc-600 hover:text-rose-400"><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#070707] overflow-hidden">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#070707]/95 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-600 hover:text-zinc-100"><Menu size={18} /></button>
          <div className="flex items-center gap-3">
             <button onClick={handleLinkEngine} className="text-zinc-500 hover:text-zinc-300 p-2"><Settings size={18} /></button>
             <button onClick={() => { setCurrentAnalysisId(null); setActiveView('engine'); setError(null); }} className="bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-full text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2">
               <PlusCircle size={14} /> New Analysis
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {activeView === 'protocol' ? <Protocol /> : (
            <div className="max-w-4xl mx-auto p-6 md:p-12">
              {(!currentAnalysisId || !currentAnalysis) ? (
                <div className="space-y-12 animate-in fade-in duration-700">
                  <div className="text-center space-y-2">
                    <h2 className="text-6xl font-black text-zinc-100 tracking-tighter italic uppercase">VERDICT</h2>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em]">Sovereign Objection Analysis</p>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-zinc-900/10 border border-zinc-800/50 rounded-[40px] p-8 md:p-12 space-y-8 backdrop-blur-3xl shadow-2xl relative">
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setFormData({...formData, mode: 'VOID'})} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${formData.mode === 'VOID' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-950/50 border-zinc-800 text-zinc-600'}`}>
                        <Zap size={24} /> <span className="font-black text-[10px] uppercase tracking-widest">VOID Mode</span>
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, mode: 'NEXUS'})} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${formData.mode === 'NEXUS' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-zinc-950/50 border-zinc-800 text-zinc-600'}`}>
                        <Crosshair size={24} /> <span className="font-black text-[10px] uppercase tracking-widest">NEXUS Mode</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Objection Text</label>
                      <textarea required placeholder='"I need to check with my team..."' className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700 min-h-[160px] resize-none" value={formData.objection} onChange={(e) => setFormData({...formData, objection: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest" value={formData.ticketSize} onChange={(e) => setFormData({...formData, ticketSize: e.target.value})}>
                        <option>High-Ticket</option><option>Mid-Ticket</option><option>Enterprise</option>
                      </select>
                      <input required type="text" placeholder="Industry/Product" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[10px] text-zinc-100 font-bold uppercase tracking-widest" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} />
                      <select className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest" value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                        <option>Discovery</option><option>Proposal</option><option>Closing</option>
                      </select>
                    </div>

                    <button disabled={isLoading} className="w-full bg-zinc-100 hover:bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 text-xs tracking-widest uppercase">
                      {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={18} /> Run Verdict</>}
                    </button>

                    {error && (
                      <div className="flex items-center gap-3 text-rose-500 text-[10px] font-bold uppercase tracking-widest bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20">
                        <AlertCircle size={16} /> {error}
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