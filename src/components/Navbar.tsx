import React from 'react';
import { Search, RefreshCw, LogOut } from 'lucide-react';
import { MarketOverview } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  marketOverview: MarketOverview | null;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  marketOverview,
  onOpenSearch,
  onOpenAuth,
  onRefresh,
  isRefreshing,
}) => {
  const { user, logout } = useAuth();

  const niftyIndex = marketOverview?.indices.find((i) => i.symbol === 'NIFTY 50') || marketOverview?.indices[0];

  return (
    <header className="sticky top-0 z-30 bg-[#0A0A0B] border-b border-slate-800">
      {/* Top benchmark micro-strip if multiple indices available */}
      {marketOverview && marketOverview.indices.length > 1 && (
        <div className="bg-[#0A0A0B] border-b border-slate-800/60 px-6 py-1 text-[11px] text-slate-400 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
            <div className="flex items-center gap-6 min-w-max">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                MARKETS:
              </span>
              {marketOverview.indices.map((idx) => {
                const isPos = idx.percentChange >= 0;
                return (
                  <div key={idx.symbol} className="flex items-center gap-2">
                    <span className="text-slate-300 font-medium">{idx.symbol}</span>
                    <span className="font-mono text-slate-200">₹{idx.currentValue.toLocaleString('en-IN')}</span>
                    <span className={`font-mono font-medium ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{idx.percentChange.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span>NSE Delayed Feed</span>
            </div>
          </div>
        </div>
      )}

      {/* Main navigation header strictly styled to Professional Polish design */}
      <nav className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-white">PulseWatch</span>
          </div>

          {/* Search Bar Input */}
          <div className="relative hidden sm:block">
            <button
              onClick={onOpenSearch}
              className="bg-slate-900 border border-slate-800 rounded-md py-1.5 px-4 text-sm w-64 md:w-72 text-left text-slate-400 hover:text-slate-200 hover:border-slate-700 transition flex items-center justify-between focus:outline-none focus:border-blue-500"
            >
              <span className="truncate">Search stocks (e.g. INFY, RELIANCE)</span>
              <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Mobile search icon trigger */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-1.5 text-slate-400 hover:text-white"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Market Data Freshness Status Pill */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={`flex h-2 w-2 rounded-full ${
                marketOverview?.status === 'LIVE'
                  ? 'bg-emerald-500 animate-pulse'
                  : marketOverview?.status === 'DELAYED'
                  ? 'bg-amber-500'
                  : marketOverview?.status === 'STALE'
                  ? 'bg-orange-500'
                  : 'bg-purple-500'
              }`}
            ></span>
            <span
              className={`tracking-wider font-semibold uppercase text-[11px] ${
                marketOverview?.status === 'LIVE'
                  ? 'text-emerald-400'
                  : marketOverview?.status === 'DELAYED'
                  ? 'text-amber-400'
                  : marketOverview?.status === 'STALE'
                  ? 'text-orange-400'
                  : 'text-purple-400'
              }`}
            >
              {marketOverview?.status === 'LIVE'
                ? 'UPSTOX LIVE NSE'
                : marketOverview?.status === 'DELAYED'
                ? 'NSE DELAYED'
                : marketOverview?.status === 'STALE'
                ? 'STALE TICK FEED'
                : 'DEMO MARKET DATA'}
            </span>
          </div>

          {/* Benchmark status and User Avatar */}
          <div className="flex items-center gap-4 border-l border-slate-800 pl-4 sm:pl-6">
            {niftyIndex && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-medium">NIFTY 50</span>
                <span
                  className={`text-sm font-semibold font-mono ${
                    niftyIndex.percentChange < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {niftyIndex.currentValue.toLocaleString('en-IN')} (
                  {niftyIndex.percentChange > 0 ? '+' : ''}
                  {niftyIndex.percentChange.toFixed(2)}%)
                </span>
              </div>
            )}

            <button
              onClick={onRefresh}
              title="Refresh pulse"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 cursor-pointer"
                  title={user.displayName || user.email || 'User'}
                >
                  <span className="text-xs font-bold text-slate-300">
                    {user.displayName
                      ? user.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'AJ'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="text-slate-400 hover:text-red-400 p-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs font-semibold px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
