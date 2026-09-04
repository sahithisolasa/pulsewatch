import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Activity,
  BarChart2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  MeaningfulChangeAnalysis,
  HistoricalDataPoint,
  StockNewsItem,
} from '../types.ts';
import { fetchStockHistory, fetchStockNews, explainStockSignals } from '../services/api.ts';

interface StockDetailModalProps {
  stock: MeaningfulChangeAnalysis | null;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1D');
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [aiExplanation, setAiExplanation] = useState<{
    text: string;
    isAiGenerated: boolean;
    loading: boolean;
  }>({
    text: '',
    isAiGenerated: false,
    loading: false,
  });

  useEffect(() => {
    if (!stock) return;

    // Fetch history
    setLoadingHistory(true);
    fetchStockHistory(stock.symbol, timeframe)
      .then((res) => setHistory(res.data))
      .catch((err) => console.error('Failed to load chart history', err))
      .finally(() => setLoadingHistory(false));

    // Fetch news
    fetchStockNews(stock.symbol)
      .then((items) => setNews(items))
      .catch((err) => console.error('Failed to load news', err));

    // Fetch AI signal explanation
    setAiExplanation({ text: stock.shortReason, isAiGenerated: false, loading: true });
    explainStockSignals(stock)
      .then((res) => {
        setAiExplanation({
          text: res.explanation,
          isAiGenerated: res.isAiGenerated,
          loading: false,
        });
      })
      .catch(() => {
        setAiExplanation({
          text: stock.shortReason,
          isAiGenerated: false,
          loading: false,
        });
      });
  }, [stock?.symbol, timeframe]);

  if (!stock) return null;

  const isNegative = stock.priceReturn < 0;
  const isFlat = Math.abs(stock.priceReturn) < 0.1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0A0A0B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0A0A0B]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{stock.symbol}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                  {stock.exchange}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/50 text-purple-300 font-medium">
                  🟣 Demo Market Data
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {stock.name} • Sector: {stock.sector || 'Equities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold font-mono text-white">
                ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-xs font-mono font-semibold flex items-center justify-end ${
                  isNegative ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isNegative ? '-' : '+'}
                {Math.abs(stock.priceReturn).toFixed(2)}% (₹{stock.priceChange.toFixed(2)})
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Attention Score Banner */}
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg border ${
                  stock.attentionScore >= 80
                    ? 'bg-red-950/80 text-red-400 border-red-800'
                    : stock.attentionScore >= 60
                    ? 'bg-red-950/50 text-red-400 border-red-900/60'
                    : stock.attentionScore >= 31
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {stock.attentionScore}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Attention Score: {stock.attentionScore} / 100
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 uppercase text-[10px]">
                    {stock.classification}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Calculated from 5 normalized market factors (price, volume, benchmark spread, volatility, and catalysts).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Baseline Price</span>
                <span className="font-mono text-slate-200 font-semibold">
                  ₹{stock.previousPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">vs NIFTY</span>
                <span
                  className={`font-mono font-semibold ${
                    stock.relativePerformance < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {stock.relativePerformance > 0 ? '+' : ''}
                  {stock.relativePerformance.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Chart with Timeframe selector */}
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">Price Action & Volume Flow</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['1D', '1W', '1M', '3M'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded transition ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {loadingHistory ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                Loading calibrated market chart...
              </div>
            ) : (
              <div className="space-y-2">
                {/* Price Area Chart */}
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={isNegative ? '#f87171' : '#34d399'}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={isNegative ? '#f87171' : '#34d399'}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0A0B',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isNegative ? '#f87171' : '#34d399'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume Bar Chart */}
                <div className="h-16 w-full pt-1 border-t border-slate-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <Bar dataKey="volume" fill="#3b82f6" opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* "Why does this matter?" Section with Signal Breakdown */}
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  Why does this matter?
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                Component Signal Breakdown
              </span>
            </div>

            {/* Signal metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0A0A0B] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Price Movement</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    isNegative ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {stock.priceReturn > 0 ? '+' : ''}
                  {stock.priceReturn.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Sub-score: {stock.signalScores.priceMovementScore}/100
                </span>
              </div>

              <div className="bg-[#0A0A0B] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Volume Multiplier</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {stock.volumeRatio.toFixed(1)}× normal
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Sub-score: {stock.signalScores.volumeAnomalyScore}/100
                </span>
              </div>

              <div className="bg-[#0A0A0B] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">vs NIFTY 50</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    stock.relativePerformance < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {stock.relativePerformance > 0 ? '+' : ''}
                  {stock.relativePerformance.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Sub-score: {stock.signalScores.relativePerformanceScore}/100
                </span>
              </div>

              <div className="bg-[#0A0A0B] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Volatility</span>
                <span className="font-mono text-sm font-bold text-blue-400">
                  {stock.volatilityChange > 0 ? '+' : ''}
                  {stock.volatilityChange.toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Sub-score: {stock.signalScores.volatilityChangeScore}/100
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              These signals contributed directly to the final Attention Score of {stock.attentionScore}.
            </p>
          </div>

          {/* AI-Generated Explanation Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                  AI INSIGHT BRIEFING
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {aiExplanation.isAiGenerated ? '✨ AI-Generated' : 'Deterministic Engine'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {aiExplanation.loading ? 'Generating factual signal briefing...' : aiExplanation.text}
            </p>

            <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5 border-t border-slate-800">
              <ShieldAlert className="w-3 h-3 text-slate-500" />
              <span>
                Factual signal summary only. Never constitutes investment advice or a price prediction.
              </span>
            </div>
          </div>

          {/* News and Regulatory Catalysts */}
          <div className="bg-[#141416] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Verified News & Catalyst Filings
              </h3>
              <span className="text-xs text-slate-500">
                {news.length > 0 ? `${news.length} verified reports` : 'No verified filings'}
              </span>
            </div>

            {news.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No verified news data available for this equity during the current checkpoint window.
              </p>
            ) : (
              <div className="space-y-2">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#0A0A0B] border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 hover:text-blue-400 transition">
                        {item.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-400 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
