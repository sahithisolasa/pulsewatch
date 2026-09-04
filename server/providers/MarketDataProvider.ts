import {
  MarketQuote,
  MarketOverview,
  HistoricalDataPoint,
  StockSearchResult,
  StockNewsItem,
  BenchmarkQuote,
} from '../types.ts';

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>>;
  getBenchmark(): Promise<BenchmarkQuote>;
  getMarketOverview(): Promise<MarketOverview>;
  getHistoricalData(symbol: string, timeframe: '1D' | '1W' | '1M' | '3M'): Promise<HistoricalDataPoint[]>;
  getNews(symbol: string): Promise<StockNewsItem[]>;
  searchStocks(query: string): Promise<StockSearchResult[]>;
  getFreshnessMode(): string;
  validateDataDiscrepancy(symbol: string): Promise<{ hasDiscrepancy: boolean; message?: string }>;
}
