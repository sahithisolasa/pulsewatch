export type DataFreshnessStatus = 'LIVE' | 'DELAYED' | 'STALE' | 'DEMO';
export type AttentionClassification = 'Normal' | 'Worth Watching' | 'Meaningful' | 'High Attention';

export interface StockSignalScores {
  priceMovementScore: number;
  volumeAnomalyScore: number;
  relativePerformanceScore: number;
  volatilityChangeScore: number;
  eventScore: number;
}

export interface MeaningfulChangeAnalysis {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceReturn: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
  currentVolume: number;
  averageVolume: number;
  volumeRatio: number;
  benchmarkReturn: number;
  relativePerformance: number;
  volatility: number;
  volatilityChange: number;
  attentionScore: number;
  classification: AttentionClassification;
  signalScores: StockSignalScores;
  shortReason: string;
  eventDescription?: string;
  timestamp: string;
  dataFreshness: DataFreshnessStatus;
  hasDiscrepancy?: boolean;
}

export interface BenchmarkQuote {
  symbol: string;
  name: string;
  currentValue: number;
  previousValue: number;
  change: number;
  percentChange: number;
  status: DataFreshnessStatus;
  timestamp: string;
}

export interface MarketOverview {
  indices: BenchmarkQuote[];
  marketTrend: 'Positive' | 'Negative' | 'Mixed';
  benchmark: BenchmarkQuote;
  timestamp: string;
  status: DataFreshnessStatus;
}

export interface HistoricalDataPoint {
  time: string;
  price: number;
  volume: number;
  high: number;
  low: number;
}

export interface StockNewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  url?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  currentPrice: number;
  changePercent: number;
}

export interface UserStockCheckpoint {
  id?: string;
  userId: string;
  stockId: string;
  lastCheckedAt: string;
  lastSeenPrice: number;
  lastSeenVolume: number;
  lastSeenAttentionScore?: number;
  lastSeenClassification?: string;
}

export interface PulseOverviewResponse {
  awayDurationText: string;
  awayMinutes: number;
  lastCheckedAt: string;
  trackedCount: number;
  meaningfulChangesCount: number;
  unusualVolumeEventsCount: number;
  majorEventsCount: number;
  needsAttention: MeaningfulChangeAnalysis[];
  worthWatching: MeaningfulChangeAnalysis[];
  stable: MeaningfulChangeAnalysis[];
  rankedMissedEvents: {
    symbol: string;
    name: string;
    priceReturn: number;
    attentionScore: number;
    direction: 'UP' | 'DOWN' | 'FLAT';
    highlight: string;
    type: 'meaningful_price' | 'unusual_volume' | 'major_event';
  }[];
  benchmark: BenchmarkQuote;
  status: DataFreshnessStatus;
}

export interface Watchlist {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  stocks: string[];
  createdAt: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
