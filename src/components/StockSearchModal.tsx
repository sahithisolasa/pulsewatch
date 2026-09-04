import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { StockSearchResult } from '../types.ts';
import { searchStocks } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdded?: () => void;
}

export const StockSearchModal: React.FC<StockSearchModalProps> = ({
  isOpen,
  onClose,
  onStockAdded,
}) => {
  const { watchlists, activeWatchlistId, addStockToWatchlist } = useAuth();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      searchStocks(query)
        .then((res) => setResults(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 150);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (symbol: string) => {
    if (!activeWatchlist) return;
    setAddingSymbol(symbol);
    try {
      await addStockToWatchlist(activeWatchlist.id, symbol);
      if (onStockAdded) onStockAdded();
    } catch (err: any) {
      alert(err.message || 'Error adding stock');
    } finally {
      setAddingSymbol(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0A0A0B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#0A0A0B]">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by symbol or company (e.g. INFY, TATAMOTORS, RELIANCE)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-2">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Adding to: {activeWatchlist?.name}</span>
            <span>{results.length} Equities available</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Searching market database...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching Indian equities found. Try 'INFY', 'TCS', or 'RELIANCE'.
            </div>
          ) : (
            results.map((stock) => {
              const isAlreadyIn = activeWatchlist?.stocks.includes(stock.symbol);
              const isAdding = addingSymbol === stock.symbol;

              return (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#141416] hover:bg-slate-900 border border-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-[#0A0A0B] border border-slate-800 flex items-center justify-center font-bold text-xs text-white">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{stock.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                          {stock.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">
                        {stock.name} • {stock.sector}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-slate-200">
                        ₹{stock.currentPrice.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-mono font-medium ${
                          stock.changePercent < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {stock.changePercent > 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {isAlreadyIn ? (
                      <span className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1 cursor-default">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(stock.symbol)}
                        disabled={isAdding}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAdding ? 'Adding...' : 'Add'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
