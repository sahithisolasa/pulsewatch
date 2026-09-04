import { MarketDataProvider } from './MarketDataProvider.ts';
import { DemoMarketDataProvider } from './DemoMarketDataProvider.ts';
import {
  MarketQuote,
  MarketOverview,
  HistoricalDataPoint,
  StockSearchResult,
  StockNewsItem,
  BenchmarkQuote,
  DataFreshnessStatus,
} from '../types.ts';

interface UpstoxSecurityMeta {
  symbol: string;
  name: string;
  exchange: string;
  isin: string;
  instrumentKey: string;
  sector: string;
  averageVolume: number;
  baselineVolatility: number;
}

export class UpstoxMarketDataProvider implements MarketDataProvider {
  private fallbackProvider: DemoMarketDataProvider;
  private inMemoryAccessToken: string | null = null;
  private cachedQuotes: Map<string, { quote: MarketQuote; fetchedAt: number }> = new Map();
  private cacheTtlMs = 10000; // 10s cache to respect Upstox rate limits
  private lastApiStatus: { success: boolean; message?: string; timestamp: number } = {
    success: false,
    message: 'Initializing Upstox connector',
    timestamp: Date.now(),
  };

  // Supported NSE Equities and Indices with exact Upstox Instrument Keys
  private static readonly INSTRUMENT_REGISTRY: Record<string, UpstoxSecurityMeta> = {
    TATAMOTORS: {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Limited',
      exchange: 'NSE',
      isin: 'INE155A01022',
      instrumentKey: 'NSE_EQ|INE155A01022',
      sector: 'Automotive & Mobility',
      averageVolume: 8043000,
      baselineVolatility: 22.5,
    },
    INFY: {
      symbol: 'INFY',
      name: 'Infosys Limited',
      exchange: 'NSE',
      isin: 'INE009A01021',
      instrumentKey: 'NSE_EQ|INE009A01021',
      sector: 'Information Technology',
      averageVolume: 5071400,
      baselineVolatility: 18.2,
    },
    HDFCBANK: {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      exchange: 'NSE',
      isin: 'INE040A01034',
      instrumentKey: 'NSE_EQ|INE040A01034',
      sector: 'Banking & Financial Services',
      averageVolume: 12400000,
      baselineVolatility: 15.4,
    },
    ITC: {
      symbol: 'ITC',
      name: 'ITC Limited',
      exchange: 'NSE',
      isin: 'INE154A01025',
      instrumentKey: 'NSE_EQ|INE154A01025',
      sector: 'Consumer FMCG',
      averageVolume: 9200000,
      baselineVolatility: 13.8,
    },
    TCS: {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      exchange: 'NSE',
      isin: 'INE467B01029',
      instrumentKey: 'NSE_EQ|INE467B01029',
      sector: 'Information Technology',
      averageVolume: 2400000,
      baselineVolatility: 16.1,
    },
    SBIN: {
      symbol: 'SBIN',
      name: 'State Bank of India',
      exchange: 'NSE',
      isin: 'INE062A01020',
      instrumentKey: 'NSE_EQ|INE062A01020',
      sector: 'Public Sector Banking',
      averageVolume: 14800000,
      baselineVolatility: 20.3,
    },
    ICICIBANK: {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank Limited',
      exchange: 'NSE',
      isin: 'INE090A01021',
      instrumentKey: 'NSE_EQ|INE090A01021',
      sector: 'Private Banking',
      averageVolume: 11500000,
      baselineVolatility: 17.0,
    },
    RELIANCE: {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Limited',
      exchange: 'NSE',
      isin: 'INE002A01018',
      instrumentKey: 'NSE_EQ|INE002A01018',
      sector: 'Energy & Retail & Telecom',
      averageVolume: 6100000,
      baselineVolatility: 16.8,
    },
    BHARTIARTL: {
      symbol: 'BHARTIARTL',
      name: 'Bharti Airtel Limited',
      exchange: 'NSE',
      isin: 'INE397D01024',
      instrumentKey: 'NSE_EQ|INE397D01024',
      sector: 'Telecommunications',
      averageVolume: 6900000,
      baselineVolatility: 17.5,
    },
    LT: {
      symbol: 'LT',
      name: 'Larsen & Toubro Limited',
      exchange: 'NSE',
      isin: 'INE018A01030',
      instrumentKey: 'NSE_EQ|INE018A01030',
      sector: 'Infrastructure & Engineering',
      averageVolume: 3200000,
      baselineVolatility: 18.0,
    },
    'NIFTY 50': {
      symbol: 'NIFTY 50',
      name: 'NIFTY 50 Benchmark Index',
      exchange: 'NSE',
      isin: 'NIFTY50',
      instrumentKey: 'NSE_INDEX|Nifty 50',
      sector: 'Benchmark Index',
      averageVolume: 250000000,
      baselineVolatility: 12.0,
    },
    'BANK NIFTY': {
      symbol: 'BANK NIFTY',
      name: 'NIFTY Bank Index',
      exchange: 'NSE',
      isin: 'BANKNIFTY',
      instrumentKey: 'NSE_INDEX|Nifty Bank',
      sector: 'Sector Index',
      averageVolume: 120000000,
      baselineVolatility: 15.0,
    },
    SENSEX: {
      symbol: 'SENSEX',
      name: 'BSE SENSEX 30',
      exchange: 'BSE',
      isin: 'SENSEX',
      instrumentKey: 'BSE_INDEX|SENSEX',
      sector: 'Benchmark Index',
      averageVolume: 80000000,
      baselineVolatility: 11.5,
    },
  };

  constructor() {
    this.fallbackProvider = new DemoMarketDataProvider();
  }

  /**
   * Determine the active Upstox access token (env var takes precedence, followed by in-memory token)
   */
  public getAccessToken(): string | null {
    return process.env.UPSTOX_ACCESS_TOKEN?.trim() || this.inMemoryAccessToken || null;
  }

  public setAccessToken(token: string): void {
    this.inMemoryAccessToken = token.trim();
  }

  /**
   * Check if Indian equity market is currently in open trading session (09:15 to 15:30 IST Mon-Fri)
   */
  private isMarketOpenNow(): boolean {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffsetMs);
    const day = istTime.getUTCDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) return false;

    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const currentMins = hours * 60 + minutes;
    const openMins = 9 * 60 + 15; // 09:15 IST
    const closeMins = 15 * 60 + 30; // 15:30 IST

    return currentMins >= openMins && currentMins <= closeMins;
  }

  /**
   * Evaluates freshness status
   */
  public getFreshnessMode(): DataFreshnessStatus {
    const token = this.getAccessToken();
    if (!token) {
      return 'DEMO';
    }
    if (!this.lastApiStatus.success) {
      return this.cachedQuotes.size > 0 ? 'STALE' : 'DEMO';
    }
    return this.isMarketOpenNow() ? 'LIVE' : 'DELAYED';
  }

  /**
   * Generate Upstox OAuth 2.0 Login URL
   */
  public getLoginUrl(): string {
    const apiKey = process.env.UPSTOX_API_KEY?.trim() || '';
    const redirectUri = process.env.UPSTOX_REDIRECT_URI?.trim() || 'http://localhost:3000/api/auth/upstox/callback';
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(
      apiKey
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Exchange OAuth authorization code for Upstox access token
   */
  public async exchangeCodeForToken(code: string): Promise<{ accessToken: string; user?: any }> {
    const apiKey = process.env.UPSTOX_API_KEY?.trim();
    const apiSecret = process.env.UPSTOX_API_SECRET?.trim();
    const redirectUri = process.env.UPSTOX_REDIRECT_URI?.trim() || 'http://localhost:3000/api/auth/upstox/callback';

    if (!apiKey || !apiSecret) {
      throw new Error('UPSTOX_API_KEY and UPSTOX_API_SECRET must be configured in environment variables');
    }

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const res = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.message || data.error || 'Failed to exchange Upstox authorization code for access token');
    }

    this.setAccessToken(data.access_token);
    this.lastApiStatus = {
      success: true,
      message: 'Authenticated via OAuth',
      timestamp: Date.now(),
    };

    return {
      accessToken: data.access_token,
      user: {
        userId: data.user_id,
        userName: data.user_name,
        email: data.email,
      },
    };
  }

  /**
   * Look up instrument key for a symbol
   */
  private getInstrumentKey(symbol: string): string | null {
    const upper = symbol.toUpperCase().trim();
    const meta = UpstoxMarketDataProvider.INSTRUMENT_REGISTRY[upper];
    return meta ? meta.instrumentKey : null;
  }

  /**
   * Retrieve live quotes from Upstox API
   */
  private async fetchUpstoxQuotes(instrumentKeys: string[]): Promise<Record<string, any>> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Upstox access token not configured (UPSTOX_ACCESS_TOKEN or OAuth session required)');
    }

    const encodedKeys = instrumentKeys.map((k) => encodeURIComponent(k)).join(',');
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodedKeys}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      const errMsg = body?.message || body?.errors?.[0]?.message || `Upstox API HTTP error ${res.status}`;
      throw new Error(errMsg);
    }

    return body.data || {};
  }

  /**
   * Normalizes Upstox raw quote into PulseWatch MarketQuote
   */
  private normalizeQuote(
    symbol: string,
    rawQuote: any,
    meta: UpstoxSecurityMeta
  ): MarketQuote {
    const currentPrice = Number(rawQuote.last_price || rawQuote.ohlc?.close || 0);
    // In Upstox, ohlc.close represents the previous trading session close
    const previousPrice = Number(rawQuote.ohlc?.close || currentPrice);
    const priceChange = rawQuote.net_change !== undefined ? Number(rawQuote.net_change) : (currentPrice - previousPrice);
    const priceReturn = previousPrice > 0 ? Number((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2)) : 0;

    const currentVolume = Number(rawQuote.volume || 0);
    const averageVolume = meta.averageVolume;
    const volumeRatio = averageVolume > 0 && currentVolume > 0
      ? Number((currentVolume / averageVolume).toFixed(2))
      : 1.0;

    // Estimate day volatility from high/low spread if available
    let volatility = meta.baselineVolatility;
    if (rawQuote.ohlc?.high && rawQuote.ohlc?.low && rawQuote.ohlc?.low > 0) {
      const highLowSpread = ((rawQuote.ohlc.high - rawQuote.ohlc.low) / rawQuote.ohlc.low) * 100;
      volatility = Number(highLowSpread.toFixed(1));
    }
    const previousVolatility = meta.baselineVolatility;
    const volatilityChange = Number((((volatility - previousVolatility) / previousVolatility) * 100).toFixed(1));

    const freshness = this.getFreshnessMode();

    return {
      symbol: meta.symbol,
      name: meta.name,
      exchange: meta.exchange,
      sector: meta.sector,
      currentPrice,
      previousPrice,
      priceChange,
      priceReturn,
      currentVolume,
      averageVolume,
      volumeRatio,
      volatility,
      previousVolatility,
      volatilityChange,
      timestamp: rawQuote.timestamp || new Date().toISOString(),
      source: 'Upstox NSE Live API v2',
      status: freshness,
    };
  }

  /**
   * Get single quote
   */
  public async getQuote(symbol: string): Promise<MarketQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes[symbol.toUpperCase().trim()] || null;
  }

  /**
   * Get quotes for multiple symbols with resilient fallback
   */
  public async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    const missingInCache: string[] = [];
    const now = Date.now();

    // Check memory cache first
    for (const sym of symbols) {
      const upper = sym.toUpperCase().trim();
      const cached = this.cachedQuotes.get(upper);
      if (cached && now - cached.fetchedAt < this.cacheTtlMs) {
        results[upper] = cached.quote;
      } else {
        missingInCache.push(upper);
      }
    }

    if (missingInCache.length === 0) {
      return results;
    }

    // Resolve instrument keys for missing items
    const instrumentKeysToFetch: string[] = [];
    const symbolToKeyMap: Record<string, string> = {};

    for (const sym of missingInCache) {
      const key = this.getInstrumentKey(sym);
      if (key) {
        instrumentKeysToFetch.push(key);
        symbolToKeyMap[sym] = key;
      }
    }

    const token = this.getAccessToken();

    if (token && instrumentKeysToFetch.length > 0) {
      try {
        const rawQuotesData = await this.fetchUpstoxQuotes(instrumentKeysToFetch);

        for (const sym of missingInCache) {
          const key = symbolToKeyMap[sym];
          const meta = UpstoxMarketDataProvider.INSTRUMENT_REGISTRY[sym];
          if (!key || !meta) continue;

          // Upstox response keys may format as NSE_EQ:INE155A01022 or NSE_EQ|INE155A01022
          const keyColon = key.replace('|', ':');
          const raw = rawQuotesData[keyColon] || rawQuotesData[key];

          if (raw && (raw.last_price || raw.ohlc?.close)) {
            const normalized = this.normalizeQuote(sym, raw, meta);
            results[sym] = normalized;
            this.cachedQuotes.set(sym, { quote: normalized, fetchedAt: now });
          }
        }

        this.lastApiStatus = {
          success: true,
          message: 'Quotes updated successfully from Upstox',
          timestamp: now,
        };
      } catch (err: any) {
        console.warn(`Upstox quote fetch warning: ${err.message}. Engaging resilient demo fallback.`);
        this.lastApiStatus = {
          success: false,
          message: err.message,
          timestamp: now,
        };
      }
    }

    // For any symbol still missing (unauthorized, rate limited, network, or index), use fallback
    const stillMissing = symbols.map((s) => s.toUpperCase().trim()).filter((s) => !results[s]);
    if (stillMissing.length > 0) {
      const fallbackQuotes = await this.fallbackProvider.getQuotes(stillMissing);
      for (const [sym, quote] of Object.entries(fallbackQuotes)) {
        // Tag quote appropriately
        const fallbackStatus = token ? 'STALE' : 'DEMO';
        results[sym] = {
          ...quote,
          status: fallbackStatus,
          statusDetails: this.lastApiStatus.message,
        };
      }
    }

    return results;
  }

  /**
   * Get benchmark index quote
   */
  public async getBenchmark(): Promise<BenchmarkQuote> {
    const niftyKey = 'NSE_INDEX|Nifty 50';
    const token = this.getAccessToken();

    if (token) {
      try {
        const rawQuotes = await this.fetchUpstoxQuotes([niftyKey]);
        const keyColon = niftyKey.replace('|', ':');
        const raw = rawQuotes[keyColon] || rawQuotes[niftyKey];

        if (raw && raw.last_price) {
          const currentValue = Number(raw.last_price);
          const previousValue = Number(raw.ohlc?.close || currentValue);
          const change = raw.net_change !== undefined ? Number(raw.net_change) : currentValue - previousValue;
          const percentChange = previousValue > 0 ? Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2)) : 0;

          return {
            symbol: 'NIFTY 50',
            name: 'NIFTY 50 Benchmark Index',
            currentValue,
            previousValue,
            change,
            percentChange,
            status: this.getFreshnessMode(),
            timestamp: raw.timestamp || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        console.warn('Upstox benchmark fetch warning:', err.message);
      }
    }

    const fallbackBench = await this.fallbackProvider.getBenchmark();
    return {
      ...fallbackBench,
      status: token ? 'STALE' : 'DEMO',
    };
  }

  /**
   * Get broad market overview (NIFTY 50, SENSEX, BANK NIFTY)
   */
  public async getMarketOverview(): Promise<MarketOverview> {
    const indicesKeys = ['NSE_INDEX|Nifty 50', 'NSE_INDEX|Nifty Bank', 'BSE_INDEX|SENSEX'];
    const token = this.getAccessToken();

    if (token) {
      try {
        const rawQuotes = await this.fetchUpstoxQuotes(indicesKeys);
        const indices: BenchmarkQuote[] = [];

        const indexMeta = [
          { symbol: 'NIFTY 50', name: 'NIFTY 50 Benchmark Index', key: 'NSE_INDEX|Nifty 50' },
          { symbol: 'SENSEX', name: 'BSE SENSEX 30', key: 'BSE_INDEX|SENSEX' },
          { symbol: 'BANK NIFTY', name: 'NIFTY Bank Index', key: 'NSE_INDEX|Nifty Bank' },
        ];

        for (const meta of indexMeta) {
          const raw = rawQuotes[meta.key.replace('|', ':')] || rawQuotes[meta.key];
          if (raw && raw.last_price) {
            const currentValue = Number(raw.last_price);
            const previousValue = Number(raw.ohlc?.close || currentValue);
            const change = raw.net_change !== undefined ? Number(raw.net_change) : currentValue - previousValue;
            const percentChange = previousValue > 0 ? Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2)) : 0;

            indices.push({
              symbol: meta.symbol,
              name: meta.name,
              currentValue,
              previousValue,
              change,
              percentChange,
              status: this.getFreshnessMode(),
              timestamp: raw.timestamp || new Date().toISOString(),
            });
          }
        }

        if (indices.length > 0) {
          const benchmark = indices[0];
          const marketTrend = benchmark.percentChange > 0.2 ? 'Positive' : benchmark.percentChange < -0.2 ? 'Negative' : 'Mixed';
          return {
            indices,
            benchmark,
            marketTrend,
            timestamp: new Date().toISOString(),
            status: this.getFreshnessMode(),
          };
        }
      } catch (err: any) {
        console.warn('Upstox market overview fetch warning:', err.message);
      }
    }

    return this.fallbackProvider.getMarketOverview();
  }

  /**
   * Get historical chart data for 1D, 1W, 1M, 3M
   */
  public async getHistoricalData(
    symbol: string,
    timeframe: '1D' | '1W' | '1M' | '3M'
  ): Promise<HistoricalDataPoint[]> {
    const key = this.getInstrumentKey(symbol);
    const token = this.getAccessToken();

    if (token && key) {
      try {
        let endpoint = '';
        const now = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        if (timeframe === '1D') {
          endpoint = `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(key)}/30minute`;
        } else {
          const daysBack = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90;
          const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
          endpoint = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(key)}/day/${formatDate(now)}/${formatDate(fromDate)}`;
        }

        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const body = await res.json();
        if (res.ok && body.data?.candles && Array.isArray(body.data.candles)) {
          // Upstox candles: [timestamp, open, high, low, close, volume, oi]
          // Reversing because Upstox returns newest first
          const candles = [...body.data.candles].reverse();
          const points: HistoricalDataPoint[] = candles.map((c: any) => {
            const timeStr = new Date(c[0]).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            return {
              time: timeframe === '1D' ? timeStr : new Date(c[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: Number(c[4]),
              high: Number(c[2]),
              low: Number(c[3]),
              volume: Number(c[5]),
            };
          });

          if (points.length > 0) {
            return points;
          }
        }
      } catch (err: any) {
        console.warn(`Upstox historical candle fetch error for ${symbol}:`, err.message);
      }
    }

    // Graceful fallback to deterministic historical generator
    return this.fallbackProvider.getHistoricalData(symbol, timeframe);
  }

  /**
   * Get news and catalysts for stocks
   */
  public async getNews(symbol: string): Promise<StockNewsItem[]> {
    // Retain verified stock news catalysts from the Indian equities dataset
    return this.fallbackProvider.getNews(symbol);
  }

  /**
   * Search equities in universe
   */
  public async searchStocks(query: string): Promise<StockSearchResult[]> {
    const q = query.toLowerCase().trim();
    const matches: StockSearchResult[] = [];

    // Query active Upstox registry
    for (const [sym, meta] of Object.entries(UpstoxMarketDataProvider.INSTRUMENT_REGISTRY)) {
      if (sym.includes('INDEX') || sym.includes('NIFTY') || sym.includes('SENSEX')) continue;
      if (!q || sym.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q) || meta.sector.toLowerCase().includes(q)) {
        // Try getting live cached price or baseline price
        const cached = this.cachedQuotes.get(sym);
        matches.push({
          symbol: sym,
          name: meta.name,
          exchange: meta.exchange,
          sector: meta.sector,
          currentPrice: cached?.quote.currentPrice || 1000,
          changePercent: cached?.quote.priceReturn || 0,
        });
      }
    }

    return matches.slice(0, 10);
  }

  /**
   * Detect and report feed discrepancies
   */
  public async validateDataDiscrepancy(symbol: string): Promise<{ hasDiscrepancy: boolean; message?: string }> {
    const key = this.getInstrumentKey(symbol);
    if (!key) {
      return { hasDiscrepancy: false };
    }

    // If Upstox token is active and reporting, check tick timestamp age
    const cached = this.cachedQuotes.get(symbol.toUpperCase().trim());
    if (cached) {
      const ageMinutes = (Date.now() - cached.fetchedAt) / (1000 * 60);
      if (this.isMarketOpenNow() && ageMinutes > 15) {
        return {
          hasDiscrepancy: true,
          message: `Last recorded tick timestamp is over ${Math.round(ageMinutes)}m delayed during market hours.`,
        };
      }
    }

    return { hasDiscrepancy: false };
  }
}
