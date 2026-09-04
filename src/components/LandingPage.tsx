import React from 'react';
import {
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  Sliders,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';

interface LandingPageProps {
  onStartWatching: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartWatching,
  onExploreDemo,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 max-w-6xl mx-auto">
      {/* Hero Container */}
      <div className="text-center max-w-3xl mx-auto pt-6 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CODE 2026 Hackathon Presentation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
          Know what changed <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            while you were away.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          PulseWatch turns your stock watchlist into a personalized market briefing. It highlights meaningful moves, unusual volume, and key events so you never have to guess what happened.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartWatching}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
          >
            <span>Start Watching</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Explore Demo</span>
          </button>
        </div>
      </div>

      {/* 3 Core Feature Cards mandated by Prompt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0d1422] border border-slate-800 p-6 relative overflow-hidden group hover:border-cyan-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center mb-4 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Meaningful Changes</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Detects moves that actually matter, not just random noise. Evaluates volume multipliers, volatility expansion, and relative spread against the benchmark index.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0d1422] border border-slate-800 p-6 relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center mb-4 text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Personal Market Pulse</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Compares the market to when you last checked, not just the previous close. Your personal checkpoint remembers your last seen price and away elapsed window.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0d1422] border border-slate-800 p-6 relative overflow-hidden group hover:border-teal-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center mb-4 text-teal-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Explainable Attention Scores</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every stock gets an Attention Score from 0 to 100 with clear reasons, sub-score breakdowns, and Gemini AI signal briefings with zero hallucinations.
          </p>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="py-6 border-t border-slate-800/60 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>PulseWatch • "PulseWatch doesn't make users watch the market. It watches their watchlist and tells them what changed while they were away."</span>
        <span className="font-mono text-purple-400">🟣 Demo Market Data</span>
      </div>
    </div>
  );
};
