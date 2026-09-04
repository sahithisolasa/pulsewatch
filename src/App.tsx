import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { WhatYouMissedTimeline } from './components/WhatYouMissedTimeline.tsx';
import { AttentionSections } from './components/AttentionSections.tsx';
import { WatchlistManager } from './components/WatchlistManager.tsx';
import { StockDetailModal } from './components/StockDetailModal.tsx';
import { StockSearchModal } from './components/StockSearchModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import {
  MarketOverview,
  PulseOverviewResponse,
  MeaningfulChangeAnalysis,
} from './types.ts';
import {
  fetchMarketOverview,
  fetchMarketPulse,
  simulateMarketMovement,
  fetchSimulationState,
} from './services/api.ts';
import { ShieldCheck, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';

function DashboardContent() {
  const {
    user,
    loading: authLoading,
    watchlists,
    activeWatchlistId,
    checkpoints,
    updateCheckpoints,
    resetCheckpointsToPast,
    removeStockFromWatchlist,
  } = useAuth();

  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [pulse, setPulse] = useState<PulseOverviewResponse | null>(null);
  const [selectedStock, setSelectedStock] = useState<MeaningfulChangeAnalysis | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUpdatingCheckpoints, setIsUpdatingCheckpoints] = useState<boolean>(false);
  const [simulatedMinutes, setSimulatedMinutes] = useState<number | undefined>(324); // 5h 24m demo scenario default
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationScenario, setSimulationScenario] = useState<{
    step: number;
    totalSteps: number;
    scenarioName: string;
    description: string;
    highlightStock?: string;
  } | null>(null);

  const activeWatchlist =
    watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  // Load market overview benchmarks
  const loadMarketData = useCallback(async () => {
    try {
      const overview = await fetchMarketOverview();
      setMarketOverview(overview);
    } catch (e) {
      console.warn('Could not load market overview:', e);
    }
  }, []);

  // Calculate market pulse for active watchlist
  const loadPulse = useCallback(async (customMinutes?: number) => {
    setIsRefreshing(true);
    try {
      const activeSymbols = activeWatchlist?.stocks || [
        'INFY',
        'TATAMOTORS',
        'RELIANCE',
        'HDFCBANK',
        'ICICIBANK',
        'TCS',
        'ITC',
        'SBIN',
      ];

      const mins = customMinutes !== undefined ? customMinutes : simulatedMinutes;
      const data = await fetchMarketPulse(activeSymbols, checkpoints, mins);
      setPulse(data);
    } catch (e) {
      console.error('Failed to load pulse data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeWatchlist?.stocks, checkpoints, simulatedMinutes]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  useEffect(() => {
    if (!authLoading) {
      loadPulse();
    }
  }, [authLoading, loadPulse]);

  // Handler to mark all stocks as checked at current price
  const handleMarkChecked = async () => {
    if (!pulse) return;
    setIsUpdatingCheckpoints(true);
    try {
      const currentSnapshots: Record<string, { price: number; volume?: number; score?: number; classification?: string }> = {};

      const allStocks = [
        ...pulse.needsAttention,
        ...pulse.worthWatching,
        ...pulse.stable,
      ];

      for (const s of allStocks) {
        currentSnapshots[s.symbol] = {
          price: s.currentPrice,
          volume: s.currentVolume,
          score: s.attentionScore,
          classification: s.classification,
        };
      }

      await updateCheckpoints(currentSnapshots);
      setSimulatedMinutes(0);
      await loadPulse(0);
    } catch (err) {
      console.error('Failed to mark checked:', err);
    } finally {
      setIsUpdatingCheckpoints(false);
    }
  };

  // Handler to simulate time away
  const handleSimulateAway = async (minutes: number) => {
    setSimulatedMinutes(minutes);
    await resetCheckpointsToPast(minutes);
    await loadPulse(minutes);
  };

  // Load initial simulation state
  useEffect(() => {
    fetchSimulationState()
      .then((state) => setSimulationScenario(state))
      .catch((err) => console.warn('Could not load initial simulation state:', err));
  }, []);

  // Handler to advance or select simulated market movement
  const handleSimulateMovement = async (step?: number) => {
    setIsSimulating(true);
    try {
      const result = await simulateMarketMovement(step);
      setSimulationScenario({
        step: result.step,
        totalSteps: result.totalSteps,
        scenarioName: result.scenarioName,
        description: result.description,
        highlightStock: result.highlightStock,
      });
      // Re-load both market overview (benchmarks, indices) and pulse calculations
      await loadMarketData();
      await loadPulse();
    } catch (err) {
      console.error('Failed to simulate market movement:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (showLanding && !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <Navbar
          marketOverview={marketOverview}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onRefresh={() => loadPulse()}
          isRefreshing={isRefreshing}
        />
        <LandingPage
          onStartWatching={() => {
            setShowLanding(false);
            setIsAuthOpen(true);
          }}
          onExploreDemo={() => {
            setShowLanding(false);
          }}
        />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar with Market Benchmark and Demo badge */}
      <Navbar
        marketOverview={marketOverview}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onRefresh={() => loadPulse()}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Core Hero Section */}
        <HeroSection
          pulse={pulse}
          userName={user?.displayName}
          onMarkChecked={handleMarkChecked}
          onSimulateAway={handleSimulateAway}
          onSimulateMovement={handleSimulateMovement}
          isUpdatingCheckpoints={isUpdatingCheckpoints}
          isSimulating={isSimulating}
          simulationScenario={simulationScenario}
        />

        {/* Top "What You Missed" priority highlights */}
        {pulse && pulse.needsAttention.length > 0 && (
          <WhatYouMissedTimeline
            items={pulse.needsAttention}
            onSelectStock={(stock) => setSelectedStock(stock)}
          />
        )}

        {/* Watchlist Manager bar */}
        <WatchlistManager onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Attention Sections: Needs Attention, Worth Watching, Stable */}
        {pulse && (
          <AttentionSections
            needsAttention={pulse.needsAttention}
            worthWatching={pulse.worthWatching}
            stable={pulse.stable}
            onSelectStock={(stock) => setSelectedStock(stock)}
            onRemoveStock={(sym) => {
              if (activeWatchlist) {
                removeStockFromWatchlist(activeWatchlist.id, sym);
              }
            }}
          />
        )}
      </main>

      {/* Footer strictly matching Professional Polish design */}
      <footer className="px-6 py-4 border-t border-slate-800 bg-[#0A0A0B] flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-widest gap-3">
        <div className="flex items-center gap-3">
          <span>Pulse Score Algorithm v2.4</span>
          <span>•</span>
          <span>Data Source: {pulse?.status === 'LIVE' ? 'Upstox v2 Live Feed' : 'NSE (Equities)'}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLanding(true)}
            className="text-slate-400 hover:text-white transition lowercase first-letter:uppercase"
          >
            Landing Page
          </button>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Ready
          </span>
          <span>•</span>
          <span className={
            pulse?.status === 'LIVE'
              ? 'text-emerald-400'
              : pulse?.status === 'DELAYED'
              ? 'text-amber-400'
              : pulse?.status === 'STALE'
              ? 'text-orange-400'
              : 'text-purple-400'
          }>
            {pulse?.status === 'LIVE'
              ? '🟢 Upstox Live Feed'
              : pulse?.status === 'DELAYED'
              ? '🟡 NSE Delayed Feed'
              : pulse?.status === 'STALE'
              ? '🟠 Stale Tick Feed'
              : '🟣 Demo Market Data'}
          </span>
        </div>
      </footer>

      {/* Modals */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
      />

      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onStockAdded={() => loadPulse()}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
