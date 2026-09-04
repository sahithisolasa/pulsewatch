import {
  MarketOverview,
  HistoricalDataPoint,
  StockNewsItem,
  StockSearchResult,
  PulseOverviewResponse,
  MeaningfulChangeAnalysis,
} from '../types.ts';

export async function fetchMarketStatus() {
  const res = await fetch('/api/market/status');
  if (!res.ok) throw new Error('Failed to fetch market status');
  return res.json();
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const res = await fetch('/api/market/overview');
  if (!res.ok) throw new Error('Failed to load market overview');
  return res.json();
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function fetchStockHistory(
  symbol: string,
  timeframe: '1D' | '1W' | '1M' | '3M'
): Promise<{ symbol: string; timeframe: string; data: HistoricalDataPoint[] }> {
  const res = await fetch(`/api/market/history/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function fetchStockNews(symbol: string): Promise<StockNewsItem[]> {
  const res = await fetch(`/api/market/news/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export async function fetchMarketPulse(
  symbols: string[],
  checkpoints: Record<string, { lastSeenPrice: number; lastCheckedAt: string }> = {},
  simulatedAwayMinutes?: number
): Promise<PulseOverviewResponse> {
  const res = await fetch('/api/market/pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols, checkpoints, simulatedAwayMinutes }),
  });
  if (!res.ok) throw new Error('Unable to calculate the latest market pulse');
  return res.json();
}

export async function explainStockSignals(analysis: MeaningfulChangeAnalysis): Promise<{
  explanation: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}> {
  const res = await fetch(`/api/stocks/${encodeURIComponent(analysis.symbol)}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: analysis.name,
      currentPrice: analysis.currentPrice,
      priceChange: analysis.priceChange,
      priceReturn: analysis.priceReturn,
      volumeRatio: analysis.volumeRatio,
      relativePerformance: analysis.relativePerformance,
      volatilityChange: analysis.volatilityChange,
      attentionScore: analysis.attentionScore,
      classification: analysis.classification,
      deterministicReason: analysis.shortReason,
    }),
  });
  if (!res.ok) throw new Error('Failed to generate signal explanation');
  return res.json();
}

export async function simulateMarketMovement(step?: number): Promise<{
  success: boolean;
  step: number;
  totalSteps: number;
  scenarioName: string;
  description: string;
  highlightStock: string;
  benchmarkReturn: number;
}> {
  const res = await fetch('/api/market/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step }),
  });
  if (!res.ok) throw new Error('Failed to simulate market movement');
  return res.json();
}

export async function fetchSimulationState(): Promise<{
  step: number;
  totalSteps: number;
  scenarioName: string;
  description: string;
  highlightStock: string;
  benchmarkReturn: number;
}> {
  const res = await fetch('/api/market/simulate/state');
  if (!res.ok) throw new Error('Failed to fetch simulation state');
  return res.json();
}

