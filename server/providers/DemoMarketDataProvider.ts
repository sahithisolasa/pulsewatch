import { MarketDataProvider } from './MarketDataProvider.ts';
import {
  MarketQuote,
  MarketOverview,
  HistoricalDataPoint,
  StockSearchResult,
  StockNewsItem,
  BenchmarkQuote,
} from '../types.ts';

interface SeededStockProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  currentPrice: number;
  previousPrice: number;
  currentVolume: number;
  averageVolume: number;
  volatility: number;
  previousVolatility: number;
  hasMajorEvent?: boolean;
  eventDescription?: string;
  hasDiscrepancy?: boolean;
  news: StockNewsItem[];
}

export class DemoMarketDataProvider implements MarketDataProvider {
  private stocks: Map<string, SeededStockProfile> = new Map();
  private benchmark: BenchmarkQuote;
  private indices: BenchmarkQuote[];

  constructor() {
    const nowISO = new Date().toISOString();

    this.benchmark = {
      symbol: 'NIFTY 50',
      name: 'NIFTY 50 Benchmark Index',
      currentValue: 24850.20,
      previousValue: 25025.40,
      change: -175.20,
      percentChange: -0.70,
      status: 'DEMO',
      timestamp: nowISO,
    };

    this.indices = [
      this.benchmark,
      {
        symbol: 'SENSEX',
        name: 'BSE SENSEX 30',
        currentValue: 81320.15,
        previousValue: 81850.00,
        change: -529.85,
        percentChange: -0.65,
        status: 'DEMO',
        timestamp: nowISO,
      },
      {
        symbol: 'BANK NIFTY',
        name: 'NIFTY Bank Index',
        currentValue: 51210.80,
        previousValue: 51702.00,
        change: -491.20,
        percentChange: -0.95,
        status: 'DEMO',
        timestamp: nowISO,
      },
    ];

    const seedData: SeededStockProfile[] = [
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        exchange: 'NSE',
        sector: 'Information Technology',
        currentPrice: 1523.40,
        previousPrice: 1590.20,
        currentVolume: 14200000,
        averageVolume: 5071400, // 2.8x normal
        volatility: 22.4,
        previousVolatility: 17.1, // +31%
        hasMajorEvent: true,
        eventDescription: 'Large guidance cut in US banking vertical + executive departure announcement.',
        hasDiscrepancy: false,
        news: [
          {
            id: 'infy-1',
            title: 'Infosys revises European discretionary tech spend estimates downward',
            source: 'Reuters Financial',
            timestamp: '4 hours ago',
            url: 'https://example.com/news/infy-guidance',
            sentiment: 'negative',
          },
          {
            id: 'infy-2',
            title: 'Institutional block deal of 4.2 million shares executed on NSE morning session',
            source: 'NSE Block Window',
            timestamp: '5 hours ago',
            url: 'https://example.com/news/infy-block',
            sentiment: 'negative',
          },
        ],
      },
      {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors Limited',
        exchange: 'NSE',
        sector: 'Automotive & Mobility',
        currentPrice: 942.50,
        previousPrice: 1000.50, // -5.8%
        currentVolume: 18500000,
        averageVolume: 8043000, // 2.3x normal
        volatility: 26.8,
        previousVolatility: 20.9, // +28%
        hasMajorEvent: true,
        eventDescription: 'JLR subsidiary reports supply chain interruption in UK powertrain assembly line.',
        hasDiscrepancy: false,
        news: [
          {
            id: 'ttm-1',
            title: 'Tata Motors faces UK aluminum supply disruption impacting premium SUV deliveries',
            source: 'Bloomberg Quint',
            timestamp: '3 hours ago',
            url: 'https://example.com/news/tatamotors-supply',
            sentiment: 'negative',
          },
        ],
      },
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        exchange: 'NSE',
        sector: 'Energy & Telecom & Retail',
        currentPrice: 2980.00,
        previousPrice: 2890.00, // +3.1%
        currentVolume: 12800000,
        averageVolume: 6100000, // 2.1x normal
        volatility: 18.2,
        previousVolatility: 16.0, // +13.7%
        hasMajorEvent: true,
        eventDescription: 'Telecom subscriber tariff hike accretive to EBITDA + Solar giga-factory milestone.',
        hasDiscrepancy: false,
        news: [
          {
            id: 'rel-1',
            title: 'Jio average revenue per user (ARPU) expands 8.4% post tariff rationalization',
            source: 'Economic Times',
            timestamp: '2 hours ago',
            url: 'https://example.com/news/reliance-arpu',
            sentiment: 'positive',
          },
        ],
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        exchange: 'NSE',
        sector: 'Private Banking',
        currentPrice: 1640.20,
        previousPrice: 1615.00, // +1.56%
        currentVolume: 15600000,
        averageVolume: 9750000, // 1.6x elevated
        volatility: 15.1,
        previousVolatility: 14.0,
        hasMajorEvent: false,
        eventDescription: 'Healthy deposit accretion reported in quarterly preliminary business update.',
        hasDiscrepancy: false,
        news: [
          {
            id: 'hdfc-1',
            title: 'HDFC Bank deposit growth outpaces systemic credit expansion in preliminary report',
            source: 'Mint Financial',
            timestamp: '6 hours ago',
            url: 'https://example.com/news/hdfc-deposits',
            sentiment: 'positive',
          },
        ],
      },
      {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank Limited',
        exchange: 'NSE',
        sector: 'Private Banking',
        currentPrice: 1180.00,
        previousPrice: 1195.00, // -1.25%
        currentVolume: 11200000,
        averageVolume: 8300000, // 1.35x normal
        volatility: 16.4,
        previousVolatility: 15.6,
        hasMajorEvent: false,
        eventDescription: undefined,
        hasDiscrepancy: false,
        news: [],
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        exchange: 'NSE',
        sector: 'Information Technology',
        currentPrice: 3920.00,
        previousPrice: 3912.00, // +0.20%
        currentVolume: 2100000,
        averageVolume: 2210000, // 0.95x normal
        volatility: 14.2,
        previousVolatility: 14.5, // -2%
        hasMajorEvent: false,
        eventDescription: undefined,
        hasDiscrepancy: false,
        news: [],
      },
      {
        symbol: 'ITC',
        name: 'ITC Limited',
        exchange: 'NSE',
        sector: 'FMCG & Hotels',
        currentPrice: 445.50,
        previousPrice: 446.20, // -0.15%
        currentVolume: 8800000,
        averageVolume: 9560000, // 0.92x normal
        volatility: 11.5,
        previousVolatility: 12.0,
        hasMajorEvent: false,
        eventDescription: undefined,
        hasDiscrepancy: false,
        news: [],
      },
      {
        symbol: 'SBIN',
        name: 'State Bank of India',
        exchange: 'NSE',
        sector: 'Public Banking',
        currentPrice: 815.00,
        previousPrice: 812.50, // +0.31%
        currentVolume: 12400000,
        averageVolume: 11800000, // 1.05x normal
        volatility: 17.5,
        previousVolatility: 17.2,
        hasMajorEvent: false,
        eventDescription: undefined,
        hasDiscrepancy: false,
        news: [],
      },
      {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel Limited',
        exchange: 'NSE',
        sector: 'Telecommunications',
        currentPrice: 1540.00,
        previousPrice: 1512.00, // +1.85%
        currentVolume: 7400000,
        averageVolume: 4900000, // 1.51x elevated
        volatility: 16.0,
        previousVolatility: 15.2,
        hasMajorEvent: false,
        eventDescription: 'Enterprise 5G connectivity contract wins in Southeast Asia',
        hasDiscrepancy: false,
        news: [],
      },
      {
        symbol: 'LT',
        name: 'Larsen & Toubro Limited',
        exchange: 'NSE',
        sector: 'Infrastructure & Capital Goods',
        currentPrice: 3580.00,
        previousPrice: 3595.00, // -0.42%
        currentVolume: 2600000,
        averageVolume: 2550000, // 1.02x
        volatility: 15.8,
        previousVolatility: 15.5,
        hasMajorEvent: false,
        eventDescription: undefined,
        hasDiscrepancy: false,
        news: [],
      },
    ];

    for (const item of seedData) {
      this.stocks.set(item.symbol, item);
    }
  }

  public getFreshnessMode(): string {
    return 'DEMO';
  }

  public async getQuote(symbol: string): Promise<MarketQuote | null> {
    const upper = symbol.toUpperCase().trim();
    const stock = this.stocks.get(upper);
    if (!stock) return null;

    const priceChange = stock.currentPrice - stock.previousPrice;
    const priceReturn = Number(((priceChange / stock.previousPrice) * 100).toFixed(2));
    const volumeRatio = Number((stock.currentVolume / stock.averageVolume).toFixed(2));
    const volatilityChange = Number(
      (((stock.volatility - stock.previousVolatility) / stock.previousVolatility) * 100).toFixed(1)
    );

    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      currentPrice: stock.currentPrice,
      previousPrice: stock.previousPrice,
      priceChange: Number(priceChange.toFixed(2)),
      priceReturn,
      currentVolume: stock.currentVolume,
      averageVolume: stock.averageVolume,
      volumeRatio,
      volatility: stock.volatility,
      previousVolatility: stock.previousVolatility,
      volatilityChange,
      timestamp: new Date().toISOString(),
      source: 'Deterministic Seed Provider (Demo Market Data)',
      status: 'DEMO',
      statusDetails: 'Seeded calibrated market signals for CODE 2026 hackathon demonstration',
      hasDiscrepancy: stock.hasDiscrepancy,
    };
  }

  public async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    for (const sym of symbols) {
      const q = await this.getQuote(sym);
      if (q) {
        results[sym.toUpperCase()] = q;
      }
    }
    return results;
  }

  public async getBenchmark(): Promise<BenchmarkQuote> {
    return this.benchmark;
  }

  public async getMarketOverview(): Promise<MarketOverview> {
    return {
      indices: this.indices,
      marketTrend: 'Mixed',
      benchmark: this.benchmark,
      timestamp: new Date().toISOString(),
      status: 'DEMO',
    };
  }

  public async getHistoricalData(
    symbol: string,
    timeframe: '1D' | '1W' | '1M' | '3M'
  ): Promise<HistoricalDataPoint[]> {
    const upper = symbol.toUpperCase().trim();
    const stock = this.stocks.get(upper);
    const basePrice = stock ? stock.currentPrice : 1500;
    const points: HistoricalDataPoint[] = [];

    let count = 24;
    let labelFormat = (i: number) => `${9 + Math.floor(i / 4)}:${(i % 4) * 15 || '00'}`;

    if (timeframe === '1D') {
      count = 26; // 9:15 to 15:30
      labelFormat = (i) => {
        const totalMinutes = 9 * 60 + 15 + i * 15;
        const hr = Math.floor(totalMinutes / 60);
        const mn = totalMinutes % 60;
        return `${hr}:${mn < 10 ? '0' + mn : mn}`;
      };
    } else if (timeframe === '1W') {
      count = 7;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Today'];
      labelFormat = (i) => days[i % days.length];
    } else if (timeframe === '1M') {
      count = 20;
      labelFormat = (i) => `Day ${i + 1}`;
    } else if (timeframe === '3M') {
      count = 24;
      labelFormat = (i) => `Wk ${i + 1}`;
    }

    // Seed deterministic random based on symbol characters
    let seed = 0;
    for (let c = 0; c < upper.length; c++) seed += upper.charCodeAt(c);

    const priceReturn = stock ? ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) : 0;
    const startPrice = basePrice / (1 + priceReturn);

    let runningPrice = startPrice;
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random variation
      const pseudoRand = Math.sin(seed + i * 1.7) * 0.008;
      // Drift towards final price
      const drift = ((basePrice - startPrice) / count);
      runningPrice = runningPrice + drift + (runningPrice * pseudoRand);

      const high = runningPrice * (1 + Math.abs(Math.cos(seed + i)) * 0.004);
      const low = runningPrice * (1 - Math.abs(Math.sin(seed + i * 2)) * 0.004);
      const volume = Math.round(
        (stock?.averageVolume || 5000000) / count * (0.8 + Math.abs(Math.sin(i * 1.3)) * 0.6)
      );

      points.push({
        time: labelFormat(i),
        price: Number(runningPrice.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        volume,
      });
    }

    // Ensure last point matches current price precisely
    if (points.length > 0) {
      points[points.length - 1].price = basePrice;
    }

    return points;
  }

  public async getNews(symbol: string): Promise<StockNewsItem[]> {
    const stock = this.stocks.get(symbol.toUpperCase().trim());
    return stock?.news || [];
  }

  public async searchStocks(query: string): Promise<StockSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) {
      return Array.from(this.stocks.values()).slice(0, 8).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        exchange: s.exchange,
        sector: s.sector,
        currentPrice: s.currentPrice,
        changePercent: Number((((s.currentPrice - s.previousPrice) / s.previousPrice) * 100).toFixed(2)),
      }));
    }

    const matches: StockSearchResult[] = [];
    for (const s of this.stocks.values()) {
      if (
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      ) {
        matches.push({
          symbol: s.symbol,
          name: s.name,
          exchange: s.exchange,
          sector: s.sector,
          currentPrice: s.currentPrice,
          changePercent: Number((((s.currentPrice - s.previousPrice) / s.previousPrice) * 100).toFixed(2)),
        });
      }
    }
    return matches;
  }

  public async validateDataDiscrepancy(symbol: string): Promise<{ hasDiscrepancy: boolean; message?: string }> {
    const stock = this.stocks.get(symbol.toUpperCase().trim());
    if (stock && stock.hasDiscrepancy) {
      return {
        hasDiscrepancy: true,
        message: `Market data discrepancy detected between primary tick feed and consolidated order book for ${symbol}.`,
      };
    }
    return { hasDiscrepancy: false };
  }

  private currentStep = 0;

  private readonly scenarios = [
    {
      id: 'step-0',
      name: 'Tech Guidance Cuts & Auto Supply Shock',
      description: 'Tata Motors experiences UK parts disruption; Infosys cuts guidance; Reliance rallies on Jio ARPU expansion.',
      highlightStock: 'TATAMOTORS',
      benchmarkPercent: -0.70,
      benchmarkValue: 24850.20,
      bankNiftyPercent: -0.95,
      bankNiftyValue: 51210.80,
      sensexPercent: -0.65,
      sensexValue: 81320.15,
      stocks: {
        TATAMOTORS: {
          price: 942.50,
          volume: 18500000,
          volatility: 26.8,
          newsTitle: 'Tata Motors faces UK aluminum supply disruption impacting premium SUV deliveries',
          newsSentiment: 'negative' as const,
        },
        INFY: {
          price: 1523.40,
          volume: 14200000,
          volatility: 22.4,
          newsTitle: 'Infosys revises European discretionary tech spend estimates downward',
          newsSentiment: 'negative' as const,
        },
        RELIANCE: {
          price: 2980.00,
          volume: 12800000,
          volatility: 18.2,
          newsTitle: 'Jio average revenue per user (ARPU) expands 8.4% post tariff rationalization',
          newsSentiment: 'positive' as const,
        },
        HDFCBANK: {
          price: 1642.00,
          volume: 11200000,
          volatility: 14.2,
          newsTitle: 'HDFC Bank branch deposit accretion tracks historical seasonal trends',
          newsSentiment: 'neutral' as const,
        },
        ICICIBANK: {
          price: 1184.00,
          volume: 14800000,
          volatility: 16.5,
          newsTitle: 'ICICI Bank maintains stable asset quality across retail portfolio',
          newsSentiment: 'neutral' as const,
        },
        TCS: {
          price: 4210.00,
          volume: 1800000,
          volatility: 14.1,
          newsTitle: 'TCS reports steady BFSI renewals in North America region',
          newsSentiment: 'neutral' as const,
        },
        ITC: {
          price: 492.00,
          volume: 6500000,
          volatility: 11.2,
          newsTitle: 'ITC agri-business exports remain stable amidst domestic inflation',
          newsSentiment: 'neutral' as const,
        },
        SBIN: {
          price: 818.00,
          volume: 14500000,
          volatility: 18.0,
          newsTitle: 'State Bank of India advances credit deposit ratio targets for FY26',
          newsSentiment: 'neutral' as const,
        },
        BHARTIARTL: {
          price: 1540.00,
          volume: 7400000,
          volatility: 16.0,
          newsTitle: 'Enterprise 5G connectivity contract wins in Southeast Asia',
          newsSentiment: 'positive' as const,
        },
        LT: {
          price: 3580.00,
          volume: 2600000,
          volatility: 15.8,
          newsTitle: 'L&T bids for high-speed transmission corridor packages in Western India',
          newsSentiment: 'neutral' as const,
        },
      },
    },
    {
      id: 'step-1',
      name: 'Banking Breakout & AI Cloud Mega-Deal',
      description: 'HDFC Bank surges on record loan growth; TCS wins $1.2B European contract; ICICI Bank margins expand.',
      highlightStock: 'HDFCBANK',
      benchmarkPercent: 0.82,
      benchmarkValue: 25050.40,
      bankNiftyPercent: 2.15,
      bankNiftyValue: 52310.00,
      sensexPercent: 0.74,
      sensexValue: 81925.50,
      stocks: {
        HDFCBANK: {
          price: 1722.00, // +4.7% surge!
          volume: 33600000, // 2.8x volume spike!
          volatility: 21.0,
          newsTitle: 'HDFC Bank reports record 18.2% loan growth; gross NPAs decline to 5-year low',
          newsSentiment: 'positive' as const,
        },
        TCS: {
          price: 4375.00, // +4.3% surge!
          volume: 5100000, // 2.5x volume spike!
          volatility: 19.5,
          newsTitle: 'TCS secures landmark $1.2B enterprise AI & hybrid cloud agreement with European financial group',
          newsSentiment: 'positive' as const,
        },
        ICICIBANK: {
          price: 1235.00, // +5.4% advance!
          volume: 26500000, // 2.1x volume spike!
          volatility: 19.8,
          newsTitle: 'ICICI Bank retail deposit franchise expands 17%; net interest margins beat consensus by 22 bps',
          newsSentiment: 'positive' as const,
        },
        RELIANCE: {
          price: 2990.00,
          volume: 9800000,
          volatility: 17.0,
          newsTitle: 'Reliance Retail expands omnichannel delivery logistics in Tier-2 metros',
          newsSentiment: 'positive' as const,
        },
        TATAMOTORS: {
          price: 955.00,
          volume: 11500000,
          volatility: 24.0,
          newsTitle: 'Tata Motors JLR activates alternative logistics corridor for assembly parts',
          newsSentiment: 'neutral' as const,
        },
        INFY: {
          price: 1538.00,
          volume: 8800000,
          volatility: 20.0,
          newsTitle: 'Infosys expands generative AI engineering partnerships with hyperscalers',
          newsSentiment: 'neutral' as const,
        },
        SBIN: {
          price: 838.00,
          volume: 16000000,
          volatility: 18.2,
          newsTitle: 'State Bank of India retail disbursements show positive quarter-on-quarter acceleration',
          newsSentiment: 'positive' as const,
        },
        ITC: {
          price: 493.50,
          volume: 6200000,
          volatility: 11.0,
          newsTitle: 'ITC hotel demerger regulatory clearance enters final approval window',
          newsSentiment: 'neutral' as const,
        },
        BHARTIARTL: {
          price: 1548.00,
          volume: 6000000,
          volatility: 15.5,
          newsTitle: 'Airtel Business adds 1,200 new enterprise accounts in Q2',
          newsSentiment: 'positive' as const,
        },
        LT: {
          price: 3610.00,
          volume: 2400000,
          volatility: 15.2,
          newsTitle: 'L&T construction division completes turnkey refinery modernization project',
          newsSentiment: 'neutral' as const,
        },
      },
    },
    {
      id: 'step-2',
      name: 'PSU Institutional Accumulation & Clean Energy Catalyst',
      description: 'State Bank of India detonates a major institutional block rally; Reliance commissions 10GW solar giga-complex.',
      highlightStock: 'SBIN',
      benchmarkPercent: 1.48,
      benchmarkValue: 25215.00,
      bankNiftyPercent: 2.80,
      bankNiftyValue: 52640.00,
      sensexPercent: 1.35,
      sensexValue: 82420.00,
      stocks: {
        SBIN: {
          price: 878.00, // +7.3% surge!
          volume: 49200000, // 3.8x institutional volume explosion!
          volatility: 25.5,
          newsTitle: 'State Bank of India records massive institutional block accumulation; sovereign wealth funds raise stake',
          newsSentiment: 'positive' as const,
        },
        RELIANCE: {
          price: 3110.00, // +7.6% surge!
          volume: 19500000, // 3.2x massive volume surge!
          volatility: 23.0,
          newsTitle: 'Reliance green energy division commissions India largest 10GW solar giga-complex ahead of schedule',
          newsSentiment: 'positive' as const,
        },
        TATAMOTORS: {
          price: 988.00, // sharp rebound
          volume: 13800000,
          volatility: 22.0,
          newsTitle: 'Tata Motors resolves aluminum supply constraints with European manufacturing partners',
          newsSentiment: 'positive' as const,
        },
        INFY: {
          price: 1572.00, // rebound
          volume: 9500000,
          volatility: 18.5,
          newsTitle: 'Infosys signs multi-million dollar banking platform modernization deal in Australia',
          newsSentiment: 'positive' as const,
        },
        HDFCBANK: {
          price: 1728.00,
          volume: 13500000,
          volatility: 16.0,
          newsTitle: 'HDFC Bank digital transactions cross 96% share of customer interactions',
          newsSentiment: 'positive' as const,
        },
        TCS: {
          price: 4360.00,
          volume: 2300000,
          volatility: 15.0,
          newsTitle: 'TCS recognized as global leader in cloud modernization services',
          newsSentiment: 'positive' as const,
        },
        ICICIBANK: {
          price: 1224.00,
          volume: 14200000,
          volatility: 16.5,
          newsTitle: 'ICICI Bank reports steady credit growth in SME segment',
          newsSentiment: 'positive' as const,
        },
        ITC: {
          price: 494.50,
          volume: 6800000,
          volatility: 11.5,
          newsTitle: 'ITC expands paperboards packaging facility to meet eco-friendly container demand',
          newsSentiment: 'neutral' as const,
        },
        BHARTIARTL: {
          price: 1555.00,
          volume: 5800000,
          volatility: 15.2,
          newsTitle: 'Bharti Airtel rolls out additional rural 5G coverage in six states',
          newsSentiment: 'positive' as const,
        },
        LT: {
          price: 3625.00,
          volume: 2500000,
          volatility: 15.0,
          newsTitle: 'L&T wins major overseas offshore hydrocarbon package in Middle East',
          newsSentiment: 'positive' as const,
        },
      },
    },
    {
      id: 'step-3',
      name: 'Defensive FMCG Flight & Global Tech Turbulence',
      description: 'ITC rockets to new highs on rural consumer breakout; Infosys drops on enterprise capex warning.',
      highlightStock: 'ITC',
      benchmarkPercent: 0.94,
      benchmarkValue: 25085.00,
      bankNiftyPercent: 0.65,
      bankNiftyValue: 51540.00,
      sensexPercent: 0.88,
      sensexValue: 82040.00,
      stocks: {
        ITC: {
          price: 524.00, // +6.8% defensive breakout!
          volume: 32500000, // 3.5x volume explosion!
          volatility: 19.8,
          newsTitle: 'ITC reports accelerated rural FMCG volume expansion of 14.8% with operating margins widening 180 bps',
          newsSentiment: 'positive' as const,
        },
        INFY: {
          price: 1475.00, // -7.2% sharp drop!
          volume: 18200000, // 3.6x volume spike!
          volatility: 26.0,
          newsTitle: 'US enterprise IT survey indicates unexpected capex freeze across financial services and retail verticals',
          newsSentiment: 'negative' as const,
        },
        TATAMOTORS: {
          price: 962.00,
          volume: 11200000,
          volatility: 23.5,
          newsTitle: 'Tata Motors commercial vehicle deliveries show modest seasonal dip in domestic market',
          newsSentiment: 'negative' as const,
        },
        SBIN: {
          price: 864.00,
          volume: 15500000,
          volatility: 20.0,
          newsTitle: 'State Bank of India consolidates after record multi-session institutional rally',
          newsSentiment: 'neutral' as const,
        },
        RELIANCE: {
          price: 3065.00,
          volume: 9800000,
          volatility: 18.0,
          newsTitle: 'Reliance Retail expands wholesale fulfillment network in southern region',
          newsSentiment: 'positive' as const,
        },
        HDFCBANK: {
          price: 1712.00,
          volume: 12000000,
          volatility: 15.5,
          newsTitle: 'HDFC Bank confirms credit metrics stay within target guidance parameters',
          newsSentiment: 'neutral' as const,
        },
        ICICIBANK: {
          price: 1208.00,
          volume: 12800000,
          volatility: 15.0,
          newsTitle: 'ICICI Bank digital lending volumes grow steadily in tier-3 centers',
          newsSentiment: 'neutral' as const,
        },
        TCS: {
          price: 4315.00,
          volume: 2100000,
          volatility: 14.5,
          newsTitle: 'TCS client retention stays high amidst global IT spending scrutiny',
          newsSentiment: 'neutral' as const,
        },
        BHARTIARTL: {
          price: 1538.00,
          volume: 5500000,
          volatility: 15.0,
          newsTitle: 'Telecom industry prepares for potential data tariff rationalization round',
          newsSentiment: 'neutral' as const,
        },
        LT: {
          price: 3590.00,
          volume: 2200000,
          volatility: 15.0,
          newsTitle: 'L&T infrastructure order book visibility remains robust across domestic corridors',
          newsSentiment: 'neutral' as const,
        },
      },
    },
  ];

  public getSimulationState() {
    const sc = this.scenarios[this.currentStep];
    return {
      step: this.currentStep,
      totalSteps: this.scenarios.length,
      scenarioName: sc.name,
      description: sc.description,
      highlightStock: sc.highlightStock,
      benchmarkReturn: sc.benchmarkPercent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dynamically advance or set the simulated market state for hackathon demonstrations
   */
  public simulateMovement(stepOrScenario?: number | string): {
    step: number;
    totalSteps: number;
    scenarioName: string;
    description: string;
    highlightStock: string;
    benchmarkReturn: number;
  } {
    if (typeof stepOrScenario === 'number' && stepOrScenario >= 0 && stepOrScenario < this.scenarios.length) {
      this.currentStep = stepOrScenario;
    } else {
      this.currentStep = (this.currentStep + 1) % this.scenarios.length;
    }

    const sc = this.scenarios[this.currentStep];
    const nowISO = new Date().toISOString();

    // 1. Update Benchmark (NIFTY 50)
    this.benchmark.currentValue = sc.benchmarkValue;
    this.benchmark.change = Number((sc.benchmarkValue - this.benchmark.previousValue).toFixed(2));
    this.benchmark.percentChange = sc.benchmarkPercent;
    this.benchmark.timestamp = nowISO;

    // 2. Update Indices
    for (const idx of this.indices) {
      if (idx.symbol === 'NIFTY 50') {
        idx.currentValue = sc.benchmarkValue;
        idx.change = this.benchmark.change;
        idx.percentChange = sc.benchmarkPercent;
        idx.timestamp = nowISO;
      } else if (idx.symbol === 'BANK NIFTY') {
        idx.currentValue = sc.bankNiftyValue;
        idx.change = Number((sc.bankNiftyValue - idx.previousValue).toFixed(2));
        idx.percentChange = sc.bankNiftyPercent;
        idx.timestamp = nowISO;
      } else if (idx.symbol === 'SENSEX') {
        idx.currentValue = sc.sensexValue;
        idx.change = Number((sc.sensexValue - idx.previousValue).toFixed(2));
        idx.percentChange = sc.sensexPercent;
        idx.timestamp = nowISO;
      }
    }

    // 3. Update Individual Stock Profiles
    for (const [sym, update] of Object.entries(sc.stocks)) {
      const stock = this.stocks.get(sym);
      if (stock) {
        stock.currentPrice = update.price;
        stock.currentVolume = update.volume;
        stock.volatility = update.volatility;
        stock.eventDescription = update.newsTitle;
        stock.hasMajorEvent = Boolean(update.newsTitle);

        // Prepend fresh news catalyst to top of list
        const newsItem: StockNewsItem = {
          id: `${sym.toLowerCase()}-sim-${this.currentStep}-${Date.now()}`,
          title: update.newsTitle,
          source: 'Market Wire (Simulated Live)',
          timestamp: 'Just now',
          url: `https://example.com/news/${sym.toLowerCase()}`,
          sentiment: update.newsSentiment,
        };

        stock.news = [newsItem, ...stock.news.filter((n) => n.title !== update.newsTitle)].slice(0, 5);
        this.stocks.set(sym, stock);
      }
    }

    return {
      step: this.currentStep,
      totalSteps: this.scenarios.length,
      scenarioName: sc.name,
      description: sc.description,
      highlightStock: sc.highlightStock,
      benchmarkReturn: sc.benchmarkPercent,
    };
  }
}


