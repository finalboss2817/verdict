
import React from 'react';
import { Analysis } from '../types';
import { Clock, ChevronRight, Zap, Crosshair } from 'lucide-react';

interface HistoryItemProps {
  analysis: Analysis;
  isActive: boolean;
  onClick: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ analysis, isActive, onClick }) => {
  const date = new Date(analysis.timestamp).toLocaleDateString();
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all border ${
        isActive 
          ? 'bg-zinc-800 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.02)]' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 uppercase tracking-wider">
          <Clock size={12} />
          {date}
        </span>
        <div className="flex items-center gap-2">
          {analysis.mode === 'VOID' ? <Zap size={10} className="text-emerald-500" /> : <Crosshair size={10} className="text-blue-500" />}
          <ChevronRight size={14} className={isActive ? 'text-zinc-100' : 'text-zinc-600'} />
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-200 truncate mb-2">
        "{analysis.objection}"
      </p>
      <div className="flex gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-black tracking-tight ${
          analysis.result.intentLevel === 'High' ? 'bg-emerald-950 text-emerald-400' :
          analysis.result.intentLevel === 'Medium' ? 'bg-amber-950 text-amber-400' :
          'bg-rose-950 text-rose-400'
        }`}>
          {analysis.result.intentLevel}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm uppercase font-black tracking-tight">
          {analysis.result.closeProbability}
        </span>
      </div>
    </button>
  );
};
