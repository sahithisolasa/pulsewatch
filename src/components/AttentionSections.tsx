import React, { useState } from 'react';
import {
  ChevronRight,
  Info,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MeaningfulChangeAnalysis } from '../types.ts';

interface AttentionSectionsProps {
  needsAttention: MeaningfulChangeAnalysis[];
  worthWatching: MeaningfulChangeAnalysis[];
  stable: MeaningfulChangeAnalysis[];
  onSelectStock: (stock: MeaningfulChangeAnalysis) => void;
  onRemoveStock?: (symbol: string) => void;
}

export const AttentionSections: React.FC<AttentionSectionsProps> = ({
  needsAttention,
  worthWatching,
  stable,
  onSelectStock,
  onRemoveStock,
}) => {
  const [isStableExpanded, setIsStableExpanded] = useState<boolean>(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
      {/* COLUMN 1: Needs Your Attention (lg:col-span-5) */}
      <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Needs Your Attention
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {needsAttention.length} High Impact
          </span>
        </div>

        {needsAttention.length === 0 ? (
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500">
            No stocks currently meet the High Attention threshold.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {needsAttention.map((stock) => {
              const isNegative = stock.priceReturn < 0;
              return (
                <div
                  key={stock.symbol}
                  className="bg-[#141416] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col gap-3 transition shadow-sm"
                >
                  {/* Top row: Name/Symbol & Price/Return */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        onClick={() => onSelectStock(stock)}
                        className="font-bold text-lg leading-tight text-white hover:text-blue-400 cursor-pointer transition"
                      >
                        {stock.name || stock.symbol}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {stock.symbol} • {stock.exchange}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold font-mono text-white">
                        ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p
                        className={`text-sm font-semibold font-mono ${
                          isNegative ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {stock.priceReturn > 0 ? '+' : ''}
                        {stock.priceReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* 3-Column Signal Metrics Breakdown */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Attention
                      </span>
                      <span className="text-lg font-bold font-mono text-red-400">
                        {stock.attentionScore} / 100
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Volume
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-200">
                        {stock.volumeRatio.toFixed(1)}×
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        vs NIFTY
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          stock.relativePerformance < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {stock.relativePerformance > 0 ? '+' : ''}
                        {stock.relativePerformance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* AI Insight Box matching Design HTML */}
                  <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      <span className="text-blue-400 font-bold uppercase text-[9px] mr-1.5 tracking-wider">
                        AI INSIGHT:
                      </span>
                      {stock.shortReason}
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Why this matters</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onRemoveStock && (
                      <button
                        onClick={() => onRemoveStock(stock.symbol)}
                        title="Remove from watchlist"
                        className="text-slate-600 hover:text-red-400 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMN 2: Worth Watching (lg:col-span-4) */}
      <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">
            Worth Watching
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {worthWatching.length} Moderate
          </span>
        </div>

        {worthWatching.length === 0 ? (
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500">
            No stocks currently in the Worth Watching band.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {worthWatching.map((stock) => {
              const isNegative = stock.priceReturn < 0;
              return (
                <div
                  key={stock.symbol}
                  className="bg-[#141416] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col gap-3 transition shadow-sm"
                >
                  {/* Top row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        onClick={() => onSelectStock(stock)}
                        className="font-bold text-base leading-tight text-white hover:text-amber-400 cursor-pointer transition"
                      >
                        {stock.symbol}
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                        {stock.name || stock.symbol} • {stock.exchange}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold font-mono text-white">
                        ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p
                        className={`text-xs font-semibold font-mono ${
                          isNegative ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {stock.priceReturn > 0 ? '+' : ''}
                        {stock.priceReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Attention Score and Volume indicators */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">
                      Attention Score:{' '}
                      <span className="text-amber-500 font-bold font-mono">
                        {stock.attentionScore}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Vol:{' '}
                      <span className="text-slate-200 font-mono font-medium">
                        {stock.volumeRatio.toFixed(1)}×
                      </span>
                    </span>
                  </div>

                  {/* Progress bar matching design */}
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, stock.attentionScore))}%` }}
                    ></div>
                  </div>

                  {/* Short reason */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {stock.shortReason}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="text-xs text-slate-300 hover:text-amber-400 font-medium flex items-center gap-1 transition"
                    >
                      <span>View details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onRemoveStock && (
                      <button
                        onClick={() => onRemoveStock(stock.symbol)}
                        title="Remove from watchlist"
                        className="text-slate-600 hover:text-red-400 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMN 3: Stable (lg:col-span-3) */}
      <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Stable
          </h2>
          <button
            onClick={() => setIsStableExpanded(!isStableExpanded)}
            className="text-[10px] underline text-slate-400 hover:text-slate-200 flex items-center gap-0.5 transition"
          >
            <span>{isStableExpanded ? 'Collapse' : 'Expand'}</span>
            {isStableExpanded ? (
              <ChevronUp className="w-3 h-3 inline" />
            ) : (
              <ChevronDown className="w-3 h-3 inline" />
            )}
          </button>
        </div>

        {stable.length === 0 ? (
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500">
            No stable stocks in current list.
          </div>
        ) : (
          <div className="flex flex-col border border-slate-800 rounded-xl bg-[#141416]/70 divide-y divide-slate-800 overflow-hidden shadow-sm">
            {(isStableExpanded ? stable : stable.slice(0, 3)).map((stock) => {
              const isNegative = stock.priceReturn < 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock)}
                  className="p-3 flex justify-between items-center hover:bg-slate-900/60 cursor-pointer transition group"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {stock.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-300 font-medium">
                      ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </div>
                    <div
                      className={`text-xs font-mono ${
                        isNegative ? 'text-red-400/80' : 'text-emerald-400/80'
                      }`}
                    >
                      {stock.priceReturn > 0 ? '+' : ''}
                      {stock.priceReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}

            {!isStableExpanded && stable.length > 3 && (
              <div
                onClick={() => setIsStableExpanded(true)}
                className="p-3 text-center text-slate-500 italic text-[11px] hover:text-slate-400 cursor-pointer transition"
              >
                +{stable.length - 3} more stocks with no major signals
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
