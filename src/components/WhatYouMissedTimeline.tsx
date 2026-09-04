import React from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Zap } from 'lucide-react';
import { MeaningfulChangeAnalysis } from '../types.ts';

interface WhatYouMissedTimelineProps {
  items: MeaningfulChangeAnalysis[];
  onSelectStock: (stock: MeaningfulChangeAnalysis) => void;
}

export const WhatYouMissedTimeline: React.FC<WhatYouMissedTimelineProps> = ({
  items,
  onSelectStock,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-[#141416] border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-xs">
        All tracked equities remained within standard baseline thresholds during your absence.
      </div>
    );
  }

  // Focus on top 3 items that demand attention
  const topMissed = items.slice(0, 3);

  return (
    <div className="bg-[#141416] border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-950/50 border border-red-800/40 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
              What You Missed
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-red-950/70 border border-red-800/60 text-red-400">
                Top Priority
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranked catalysts demanding immediate review from your absence window
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {topMissed.map((stock, index) => {
          const isNegative = stock.priceReturn < 0;
          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="group cursor-pointer bg-[#0A0A0B] hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm tracking-tight group-hover:text-blue-400 transition">
                        {stock.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[110px]">
                        {stock.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-semibold text-sm text-slate-200">
                      ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`font-mono text-xs font-medium flex items-center justify-end ${
                        isNegative ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {isNegative ? (
                        <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" />
                      )}
                      {stock.priceReturn > 0 ? '+' : ''}
                      {stock.priceReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Score badge & main reason */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 border border-red-800/50 text-red-300">
                    Attention {stock.attentionScore}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {stock.volumeRatio.toFixed(1)}× vol
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {stock.shortReason}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                <span>View signal breakdown</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
