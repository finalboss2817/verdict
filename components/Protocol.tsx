
import React from 'react';
import { Shield, Target, Database, Skull, Zap, Crosshair, Linkedin, Mail } from 'lucide-react';

export const Protocol: React.FC = () => {
  const sections = [
    {
      title: "The 'Prize' Philosophy",
      icon: <Target className="text-blue-500" />,
      content: "In high-ticket sales, the moment you begin 'chasing', you have lost. VERDICT is designed to maintain your status as the Prize. Most salespeople suffer from 'Happy Ears'—hearing interest where there is only politeness. We provide the cold water necessary to prune your pipeline."
    },
    {
      title: "The Moat: Skepticism-as-a-Service",
      icon: <Skull className="text-rose-500" />,
      content: "General LLMs are fine-tuned for 'Agreeableness.' VERDICT is hard-coded for 'Skepticism.' It looks for reasons to kill the deal. This objective distance is our competitive moat. We don't want you to close everything; we want you to close only what matters."
    },
    {
      title: "Dual-Engine Strategy",
      icon: <Zap className="text-emerald-500" />,
      content: "Choose your operational lens. VOID (Green) provides brutal, disqualification-heavy honesty to protect your schedule. NEXUS (Blue) offers optimized, high-status tactical responses to bridge the gap and close high-value deals without sounding desperate."
    },
    {
      title: "Cloud Sovereignty",
      icon: <Database className="text-zinc-500" />,
      content: "Your operational intelligence is now decoupled from your browser cache. Stored in high-security PostgreSQL silos and protected by Supabase Auth, your history is persistent, private, and encrypted. Access your high-stakes intelligence from any terminal, anywhere."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4 text-center border-b border-zinc-900 pb-12">
        <h2 className="text-5xl font-black tracking-tighter text-zinc-100 italic">THE PROTOCOL</h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em]">Operational Framework & Intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4 hover:border-zinc-700 transition-colors group">
            <div className="bg-zinc-950 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
              {section.icon}
            </div>
            <h3 className="text-xl font-bold text-zinc-100">{section.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3">
             <Zap className="text-emerald-500" size={24} />
             <h4 className="font-black text-zinc-100 uppercase tracking-widest text-sm">Protocol: VOID</h4>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Optimized for <strong>Time Protection</strong>. It assumes the objection is a rejection until proven otherwise. Use this when you are overwhelmed with leads and need to prune the weak ones aggressively.
          </p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3">
             <Crosshair className="text-blue-500" size={24} />
             <h4 className="font-black text-zinc-100 uppercase tracking-widest text-sm">Protocol: NEXUS</h4>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Optimized for <strong>Tactical Conversion</strong>. It seeks the logical path to close while maintaining your status as the Prize. Use this for high-value potential deals that just need a high-authority leader to guide the finish.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="shrink-0">
          <Shield className="text-zinc-500" size={48} />
        </div>
        <div>
          <h4 className="text-zinc-100 font-bold text-lg mb-2 uppercase tracking-wide">The Sovereign Mindset</h4>
          <p className="text-zinc-400 text-sm italic leading-relaxed">
            "Better to lose a hundred bad deals in five minutes than to lose one bad deal in five months. Protect the schedule, and the profit follows."
          </p>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-900 text-center space-y-6">
        <div className="space-y-2">
          <h4 className="text-zinc-100 font-black uppercase tracking-[0.2em] text-xs">Reach the Architect</h4>
          <p className="text-zinc-500 text-xs">For strategic inquiries or technical support regarding the VERDICT engine.</p>
        </div>
        <div className="flex justify-center gap-4">
          <a 
            href="https://www.linkedin.com/in/manish-trivedi-943331215?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-6 py-3 rounded-2xl text-xs font-bold transition-all text-zinc-300 hover:text-zinc-100"
          >
            <Linkedin size={16} className="text-blue-500" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};
