import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabase';
import { analyzeObjection } from './services/geminiService';
import { Analysis, ObjectionInput, AnalysisMode } from './types';
import { AnalysisView } from './components/AnalysisView';
import { HistoryItem } from './components/HistoryItem';
import { Protocol } from './components/Protocol';
import { Auth } from './components/Auth';
import { Gavel, LayoutDashboard, History, PlusCircle, Loader2, Send, AlertCircle, Trash2, BookOpen, LogOut, User, Zap, Crosshair, Linkedin, Menu, X, Key } from 'lucide-react';
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
  
  const [needsKeySelection, setNeedsKeySelection] = useState(false);

  const [formData, setFormData] = useState<ObjectionInput>(INITIAL_FORM_STATE);

  // Check if we are in an environment that supports window.aistudio
  const isAiStudioEnv = useMemo(() => {
    return typeof (window as any).aistudio !== 'undefined' && 
           typeof (window as any).aistudio.openSelectKey === 'function';
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
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

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('timestamp', { ascending: false });

    if (!error && data) {
      setHistory(data as Analysis[]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session, fetchHistory]);

  const handleSelectKey = async () => {
    if (isAiStudioEnv) {
      try {
        await (window as any).aistudio.openSelectKey();
        setNeedsKeySelection(false);
        setError(null);
      } catch (err) {
        console.error("Key selection failed", err);
      }
    }
  };

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
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
        if (isAiStudioEnv) {
          setNeedsKeySelection(true);
          setError("Sovereign Clearance Denied: Please authorize access via the strategic key protocol.");
        } else {
          setError("Deployment Configuration Error: The API_KEY environment variable is missing or invalid. Please configure it in your deployment settings.");
        }
      } else {
        setError(err.message || 'Operational failure. Check system logs.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!session?.user) return;
    
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (!error) {
      setHistory(prev => prev.filter(a => a.id !== id));
      if (currentAnalysisId === id) {
        setCurrentAnalysisId(null);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const startNewVerdict = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setCurrentAnalysisId(null);
    setActiveView('engine');
    setError(null);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSidebarViewChange = (view: 'engine' | 'protocol') => {
    setActiveView(view);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleHistoryItemClick = (id: string) => {
    setCurrentAnalysisId(id);
    setActiveView('engine');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const currentAnalysis = history.find(a => a.id === currentAnalysisId);

  return (
    <div className="flex h-screen bg-[#070707] text-zinc-100 overflow-hidden selection:bg-blue-500/30">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 lg:relative z-50 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0'}`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#0a0a0a]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Gavel className="text-zinc-100" size={24} />
              <h1 className="font-black italic tracking-tighter text-xl">VERDICT</h1>
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">A venture by Meena technologies</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 border-b border-zinc-900 space-y-1">
          <button 
            onClick={() => handleSidebarViewChange('engine')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'engine' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutDashboard size={18} />
            Analysis Engine
          </button>
          <button 
            onClick={() => handleSidebarViewChange('protocol')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'protocol' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <BookOpen size={18} />
            The Protocol
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 text-zinc-600 px-2 py-1">
            <History size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational History</span>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-zinc-700 text-xs font-medium italic">Pipeline clear.</p>
            </div>
          ) : (
            history.map(item => (
              <HistoryItem 
                key={item.id} 
                analysis={item} 
                isActive={currentAnalysisId === item.id && activeView === 'engine'}
                onClick={() => handleHistoryItemClick(item.id)}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-900 bg-[#0a0a0a] space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                <User size={16} className="text-zinc-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase truncate max-w-[120px]">
                  {session.user.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-tighter">Verified</span>
              </div>
            </div>
            <div className="flex gap-1">
              <a 
                href="https://www.linkedin.com/in/manish-trivedi-943331215"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-600 hover:text-blue-400 transition-colors"
                title="Reach Architect"
              >
                <Linkedin size={16} />
              </a>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-600 hover:text-rose-400 transition-colors"
                title="Terminate Session"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-[#070707] relative overflow-hidden">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-4 md:px-6 bg-[#070707]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-600 transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>
          
          <div className="flex gap-2">
            {needsKeySelection && isAiStudioEnv && (
              <button 
                onClick={handleSelectKey}
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-black transition-all animate-pulse"
              >
                <Key size={14} />
                AUTHORIZE ENGINE
              </button>
            )}
            <button 
              onClick={startNewVerdict}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-3 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-black transition-all shadow-xl active:scale-95"
            >
              <PlusCircle size={16} className="hidden sm:block" />
              NEW VERDICT
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {activeView === 'protocol' ? (
            <Protocol />
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-12 w-full">
              {(!currentAnalysisId || !currentAnalysis) ? (
                <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-zinc-100 tracking-tighter italic break-words">VERDICT</h2>
                    <div className="space-y-1">
                      <p className="text-zinc-600 max-w-lg mx-auto leading-relaxed text-[10px] md:text-sm font-medium uppercase tracking-widest px-4">
                        The Deal Disqualification Engine
                      </p>
                      <p className="text-zinc-500 font-mono text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium italic">
                        A venture by Meena technologies
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 md:p-10 space-y-8 md:space-y-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20"></div>
                    
                    {/* Protocol Selection */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Select Operational Protocol</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, mode: 'VOID'})}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.mode === 'VOID' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                          >
                            <Zap size={20} />
                            <span className="font-black text-xs uppercase tracking-widest">VOID (Sovereign)</span>
                            <span className="text-[9px] opacity-60 font-medium text-center">Blunt / Honest / Protection Focus</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, mode: 'NEXUS'})}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.mode === 'NEXUS' ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                          >
                            <Crosshair size={20} />
                            <span className="font-black text-xs uppercase tracking-widest">NEXUS (Tactical)</span>
                            <span className="text-[9px] opacity-60 font-medium text-center">Optimized / Win-Oriented</span>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Operational Input: Objection Message</label>
                      <textarea
                        required
                        placeholder='"We need to look at other options..."'
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[160px] resize-none text-base md:text-lg font-medium"
                        value={formData.objection}
                        onChange={(e) => setFormData({...formData, objection: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Ticket Profile</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 font-bold focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                          value={formData.ticketSize}
                          onChange={(e) => setFormData({...formData, ticketSize: e.target.value})}
                        >
                          <option>High-Ticket ($10k+)</option>
                          <option>Mid-Ticket ($1k-$10k)</option>
                          <option>B2B Enterprise</option>
                          <option>Consulting/Service</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Market Sector</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. SEO Audit"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 font-bold focus:outline-none focus:border-blue-500/50"
                          value={formData.product}
                          onChange={(e) => setFormData({...formData, product: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Deal Phase</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 font-bold focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                          value={formData.stage}
                          onChange={(e) => setFormData({...formData, stage: e.target.value})}
                        >
                          <option>Initial Outreach</option>
                          <option>Discovery Call</option>
                          <option>Proposal Sent</option>
                          <option>Contract Stage</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      disabled={isLoading}
                      className="w-full bg-zinc-100 hover:bg-white text-black font-black py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 group text-xs md:text-sm"
                    >
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          GENERATE FINAL VERDICT
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex flex-col gap-3 text-rose-400 text-xs items-center text-center">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="font-bold tracking-tight">{error}</p>
                        </div>
                        {needsKeySelection && isAiStudioEnv && (
                          <button 
                            type="button"
                            onClick={handleSelectKey}
                            className="text-[10px] font-black uppercase underline decoration-rose-500/50 hover:text-white transition-colors"
                          >
                            Click here to authorize strategic access
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <AnalysisView analysis={currentAnalysis} onDelete={deleteAnalysis} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;