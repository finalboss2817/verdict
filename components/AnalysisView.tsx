
import React from 'react';
import { Analysis } from '../types';
import { AlertTriangle, Copy, Trash2, Zap, StopCircle, ArrowRightCircle, Target, Skull, Crosshair, Linkedin } from 'lucide-react';

interface AnalysisViewProps {
  analysis: Analysis;
  onDelete: (id: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onDelete }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      case 'Low': return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800/50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Assessment Report</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${analysis.mode === 'VOID' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'}`}>
              {analysis.mode === 'VOID' ? <Zap size={10} /> : <Crosshair size={10} />}
              Protocol: {analysis.mode}
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
            ID: {analysis.id.split('-')[0]} // {new Date(analysis.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => onDelete(analysis.id)}
            className="p-3 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
            title="Discard Analysis"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Probability Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${getStatusColor(analysis.result.intentLevel)} flex flex-col items-center justify-center text-center space-y-2`}>
          <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60">Intent Level</span>
          <span className="text-4xl font-black tracking-tighter">{analysis.result.intentLevel}</span>
          <p className="text-xs font-medium opacity-80 leading-tight">
            {analysis.result.intentExplanation}
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Close Probability</span>
          <span className="text-4xl font-black tracking-tighter text-zinc-100">{analysis.result.closeProbability}</span>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
             <div 
               className={`h-full transition-all duration-1000 ${analysis.result.intentLevel === 'Low' ? 'bg-rose-500' : 'bg-blue-500'}`}
               style={{ width: analysis.result.closeProbability.includes('-') ? analysis.result.closeProbability.split('-')[1].replace('%', '') + '%' : analysis.result.closeProbability.replace('%', '') + '%' }}
             />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 grid grid-cols-1 gap-2">
           <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
             <span className="text-[10px] font-black text-zinc-500 uppercase">Ticket</span>
             <span className="text-xs text-zinc-300 font-bold">{analysis.context.ticketSize}</span>
           </div>
           <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
             <span className="text-[10px] font-black text-zinc-500 uppercase">Stage</span>
             <span className="text-xs text-zinc-300 font-bold">{analysis.context.stage}</span>
           </div>
           <div className="flex justify-between items-center pt-1">
             <span className="text-[10px] font-black text-zinc-600 uppercase">Sector</span>
             <span className="text-xs text-zinc-300 font-bold truncate ml-4">{analysis.context.product}</span>
           </div>
        </div>
      </div>

      {/* The Meaning (The Moat) */}
      <section className="relative overflow-hidden bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Zap size={120} />
        </div>
        <h3 className="flex items-center gap-3 text-zinc-400 font-black mb-6 uppercase tracking-[0.2em] text-xs">
          <Skull size={16} className="text-rose-500" />
          The Internal Decoder
        </h3>
        <p className="text-2xl md:text-3xl font-bold text-zinc-100 leading-tight tracking-tight">
          "{analysis.result.meaning}"
        </p>
      </section>

      {/* Best Response */}
      <section className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-[0.2em] text-xs">
            <Target size={16} />
            Sovereign Response
          </h3>
          <button 
            onClick={() => copyToClipboard(analysis.result.bestResponse)}
            className="flex items-center gap-2 text-[10px] font-black uppercase bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full transition-all"
          >
            <Copy size={12} />
            Copy Message
          </button>
        </div>
        <div className="mono bg-black/40 p-8 rounded-2xl border border-zinc-800 text-blue-100 text-lg leading-relaxed shadow-inner selection:bg-blue-500/30">
          {analysis.result.bestResponse}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mistakes */}
        <section className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-8">
          <h3 className="flex items-center gap-3 text-rose-500 font-black mb-6 uppercase tracking-[0.2em] text-xs">
            <AlertTriangle size={16} />
            Avoid the "Beggar" Trap
          </h3>
          <ul className="space-y-4">
            {analysis.result.whatNotToSay.map((item, idx) => (
              <li key={idx} className="flex gap-4 text-zinc-400 text-sm font-medium leading-relaxed">
                <span className="text-rose-500 font-black mt-1 shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Walk Away */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h3 className="flex items-center gap-3 text-zinc-500 font-black mb-6 uppercase tracking-[0.2em] text-xs">
            <StopCircle size={16} />
            The Kill Switch
          </h3>
          <div className="border-l-4 border-zinc-700 pl-6 py-2">
            <p className="text-zinc-300 text-sm leading-relaxed font-medium italic">
              {analysis.result.walkAwaySignal}
            </p>
          </div>
        </section>
      </div>

      {/* Strategy */}
      <section className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8">
        <h3 className="flex items-center gap-3 text-emerald-500 font-black mb-8 uppercase tracking-[0.2em] text-xs">
          <ArrowRightCircle size={16} />
          Operational Cadence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="space-y-2">
            <span className="block text-[10px] text-zinc-600 font-black uppercase tracking-widest">Follow-ups</span>
            <p className="text-xl font-bold text-zinc-200">{analysis.result.followUpStrategy.maxFollowUps}</p>
          </div>
          <div className="space-y-2">
            <span className="block text-[10px] text-zinc-600 font-black uppercase tracking-widest">Frequency</span>
            <p className="text-xl font-bold text-zinc-200">{analysis.result.followUpStrategy.timeGap}</p>
          </div>
          <div className="space-y-2">
            <span className="block text-[10px] text-zinc-600 font-black uppercase tracking-widest">Hard Stop</span>
            <p className="text-xl font-bold text-zinc-200">{analysis.result.followUpStrategy.stopCondition}</p>
          </div>
        </div>
      </section>

      {/* Reach section at bottom of analysis */}
      <div className="pt-12 border-t border-zinc-900 text-center space-y-6">
        <div className="space-y-2">
          <h4 className="text-zinc-100 font-black uppercase tracking-[0.2em] text-[10px]">Reach the Architect</h4>
          <p className="text-zinc-600 text-[10px]">Strategic inquiries regarding this analysis.</p>
        </div>
        <div className="flex justify-center">
          <a 
            href="https://www.linkedin.com/in/manish-trivedi-943331215?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all text-zinc-400 hover:text-zinc-100"
          >
            <Linkedin size={14} className="text-blue-500" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};
