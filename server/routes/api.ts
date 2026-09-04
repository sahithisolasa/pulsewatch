import { Router, Request, Response } from 'express';
import { DemoMarketDataProvider } from '../providers/DemoMarketDataProvider.ts';
import { UpstoxMarketDataProvider } from '../providers/UpstoxMarketDataProvider.ts';
import { MarketDataProvider } from '../providers/MarketDataProvider.ts';
import { MeaningfulChangeEngine } from '../services/MeaningfulChangeEngine.ts';
import { GeminiExplainer } from '../services/GeminiExplainer.ts';
import {
  MeaningfulChangeAnalysis,
  PulseOverviewResponse,
  MarketQuote,
} from '../types.ts';

export const apiRouter = Router();

// Providers: Demo provider and Upstox NSE live provider
const demoProvider = new DemoMarketDataProvider();
const upstoxProvider = new UpstoxMarketDataProvider();

// Active provider mode ('demo' or 'live')
let activeMode: 'demo' | 'live' =
  process.env.MARKET_DATA_MODE?.toLowerCase() === 'live' ? 'live' : 'demo';

function getActiveProvider(): MarketDataProvider {
  return activeMode === 'live' ? upstoxProvider : demoProvider;
}

/**
 * Format minutes into readable away string e.g. "5H 24M" or "45M"
 */
function formatAwayDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.max(1, Math.round(minutes))}M`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = Math.round(minutes % 60);
  return `${hours}H ${remMinutes > 0 ? remMinutes + 'M' : ''}`.trim();
}

/**
 * GET /api/market/status
 * Returns system readiness, active market data mode, and data freshness
 */
apiRouter.get('/market/status', async (req: Request, res: Response) => {
  try {
    const provider = getActiveProvider();
    const freshness = provider.getFreshnessMode();
    const benchmark = await provider.getBenchmark();
    const hasUpstoxToken = Boolean(upstoxProvider.getAccessToken());

    let badge = 'DEMO MARKET DATA';
    if (activeMode === 'live') {
      badge = freshness === 'LIVE'
        ? 'UPSTOX LIVE NSE'
        : freshness === 'DELAYED'
        ? 'NSE DELAYED FEED'
        : freshness === 'STALE'
        ? 'STALE TICK FEED'
        : 'UPSTOX RESILIENT FALLBACK';
    }

    res.json({
      mode: activeMode,
      freshness,
      badge,
      benchmarkSymbol: benchmark.symbol,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasUpstoxToken,
      upstoxConfigured: Boolean(process.env.UPSTOX_API_KEY && process.env.UPSTOX_API_SECRET),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve market status' });
  }
});

/**
 * POST /api/market/mode
 * Allows dynamically toggling between "demo" and "live" market data modes
 */
apiRouter.post('/market/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode === 'live' || mode === 'demo') {
    activeMode = mode;
    return res.json({
      success: true,
      mode: activeMode,
      freshness: getActiveProvider().getFreshnessMode(),
    });
  }
  res.status(400).json({ error: "Invalid mode. Allowed values: 'demo' or 'live'" });
});

/**
 * POST /api/market/simulate
 * Simulates price movement / market ticks on the demo data provider
 */
apiRouter.post('/market/simulate', (req: Request, res: Response) => {
  try {
    const { step, scenario } = req.body;
    const simResult = demoProvider.simulateMovement(step !== undefined ? step : scenario);
    res.json({
      success: true,
      ...simResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate market movement' });
  }
});

/**
 * GET /api/market/simulate/state
 * Retrieves current simulation stage and scenario metadata
 */
apiRouter.get('/market/simulate/state', (req: Request, res: Response) => {
  res.json(demoProvider.getSimulationState());
});

/**
 * GET /api/auth/upstox/status
 */
apiRouter.get('/auth/upstox/status', (req: Request, res: Response) => {
  const hasToken = Boolean(upstoxProvider.getAccessToken());
  const hasApiKey = Boolean(process.env.UPSTOX_API_KEY);
  const hasApiSecret = Boolean(process.env.UPSTOX_API_SECRET);
  res.json({
    mode: activeMode,
    hasToken,
    hasApiKey,
    hasApiSecret,
    redirectUri: process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3000/api/auth/upstox/callback',
    freshness: upstoxProvider.getFreshnessMode(),
  });
});

/**
 * GET /api/auth/upstox/login
 * Redirects user or returns URL for Upstox OAuth 2.0 authorization dialog
 */
apiRouter.get('/auth/upstox/login', (req: Request, res: Response) => {
  if (!process.env.UPSTOX_API_KEY) {
    return res.status(400).json({
      error: 'UPSTOX_API_KEY is not configured in server environment variables',
    });
  }
  const loginUrl = upstoxProvider.getLoginUrl();
  if (req.query.redirect === 'true' || req.headers.accept?.includes('text/html')) {
    return res.redirect(loginUrl);
  }
  res.json({ loginUrl });
});

/**
 * GET /api/auth/upstox/callback
 * Handles OAuth 2.0 callback from Upstox, exchanges code for access token
 */
apiRouter.get('/auth/upstox/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('Authorization code missing from Upstox callback');
  }

  try {
    await upstoxProvider.exchangeCodeForToken(code);
    activeMode = 'live';
    res.redirect('/?upstox_auth=success');
  } catch (err: any) {
    console.error('Failed to exchange Upstox OAuth code:', err.message);
    res.redirect(`/?upstox_auth=error&msg=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/market/overview
 */
apiRouter.get('/market/overview', async (req: Request, res: Response) => {
  try {
    const overview = await getActiveProvider().getMarketOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load market overview' });
  }
});

/**
 * GET /api/market/search?q=...
 */
apiRouter.get('/market/search', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await getActiveProvider().searchStocks(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/market/quote/:symbol
 */
apiRouter.get('/market/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const provider = getActiveProvider();
    const quote = await provider.getQuote(symbol);
    if (!quote) {
      return res.status(404).json({ error: `Stock '${symbol}' not found` });
    }
    const discrepancy = await provider.validateDataDiscrepancy(symbol);
    if (discrepancy.hasDiscrepancy) {
      quote.hasDiscrepancy = true;
      quote.statusDetails = discrepancy.message;
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/market/history/:symbol?timeframe=1D|1W|1M|3M
 */
apiRouter.get('/market/history/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const timeframeParam = (req.query.timeframe as string) || '1D';
    const validTimeframe = ['1D', '1W', '1M', '3M'].includes(timeframeParam)
      ? (timeframeParam as '1D' | '1W' | '1M' | '3M')
      : '1D';

    const history = await getActiveProvider().getHistoricalData(symbol, validTimeframe);
    res.json({
      symbol: symbol.toUpperCase(),
      timeframe: validTimeframe,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

/**
 * GET /api/market/news/:symbol
 */
apiRouter.get('/market/news/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const news = await getActiveProvider().getNews(symbol);
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * POST /api/market/pulse
 * Core batch calculation for user's watchlist: "What changed while you were away?"
 */
apiRouter.post('/market/pulse', async (req: Request, res: Response) => {
  try {
    const { symbols = [], checkpoints = {}, simulatedAwayMinutes } = req.body;
    const provider = getActiveProvider();

    const defaultSymbols = ['INFY', 'TATAMOTORS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'TCS', 'ITC', 'SBIN'];
    const activeSymbols: string[] = Array.isArray(symbols) && symbols.length > 0
      ? symbols
      : defaultSymbols;

    const benchmark = await provider.getBenchmark();
    const benchmarkReturn = benchmark.percentChange;

    const quotes = await provider.getQuotes(activeSymbols);

    // Calculate away minutes: either simulated, or difference from latest checkpoint, default 324 mins (5h 24m)
    let awayMinutes = typeof simulatedAwayMinutes === 'number' && simulatedAwayMinutes > 0
      ? simulatedAwayMinutes
      : 324; // 5h 24m demo scenario default

    let oldestCheckpointTime: string | null = null;
    const now = Date.now();

    if (!simulatedAwayMinutes && checkpoints && typeof checkpoints === 'object') {
      const timestamps = Object.values(checkpoints)
        .map((cp: any) => cp?.lastCheckedAt ? new Date(cp.lastCheckedAt).getTime() : null)
        .filter((t): t is number => Boolean(t) && !isNaN(t));

      if (timestamps.length > 0) {
        const minTime = Math.min(...timestamps);
        oldestCheckpointTime = new Date(minTime).toISOString();
        awayMinutes = Math.max(1, Math.round((now - minTime) / (1000 * 60)));
      }
    }

    const awayDurationText = formatAwayDuration(awayMinutes);
    const lastCheckedAt = oldestCheckpointTime || new Date(now - awayMinutes * 60 * 1000).toISOString();

    const analyses: MeaningfulChangeAnalysis[] = [];
    let unusualVolumeCount = 0;
    let majorEventsCount = 0;

    for (const sym of activeSymbols) {
      const upper = sym.toUpperCase().trim();
      const quote = quotes[upper];
      if (!quote) continue;

      const userCheckpoint = checkpoints[upper];
      const checkpointPrice = userCheckpoint?.lastSeenPrice;

      // Extract catalyst news description if available
      let eventDesc: string | undefined;
      let hasMajor = false;
      const news = await provider.getNews(upper);
      if (news.length > 0) {
        eventDesc = news[0].title;
        hasMajor = Boolean(eventDesc) && (
          upper === 'INFY' ||
          upper === 'TATAMOTORS' ||
          upper === 'RELIANCE' ||
          upper === 'HDFCBANK' ||
          upper === 'SBIN' ||
          upper === 'ITC' ||
          upper === 'TCS' ||
          Boolean(quote.hasDiscrepancy)
        );
      }

      const analysis = MeaningfulChangeEngine.calculate(
        quote,
        checkpointPrice,
        benchmarkReturn,
        eventDesc,
        hasMajor
      );

      analyses.push(analysis);

      if (analysis.volumeRatio >= 1.5) {
        unusualVolumeCount++;
      }
      if (analysis.signalScores.eventScore >= 60) {
        majorEventsCount++;
      }
    }

    // Categorize into Sections
    // SECTION 1: Needs Your Attention (High Attention + Meaningful: >= 61)
    const needsAttention = analyses
      .filter((a) => a.attentionScore >= 61)
      .sort((a, b) => b.attentionScore - a.attentionScore);

    // SECTION 2: Worth Watching (Score 31 - 60)
    const worthWatching = analyses
      .filter((a) => a.attentionScore >= 31 && a.attentionScore < 61)
      .sort((a, b) => b.attentionScore - a.attentionScore);

    // SECTION 3: Stable (Score 0 - 30)
    const stable = analyses
      .filter((a) => a.attentionScore < 31)
      .sort((a, b) => a.attentionScore - b.attentionScore);

    // Ranked missed events for "What You Missed" timeline
    const rankedMissedEvents = needsAttention.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      priceReturn: item.priceReturn,
      attentionScore: item.attentionScore,
      direction: item.direction,
      highlight: item.shortReason,
      type: (item.signalScores.eventScore >= 75 ? 'major_event' : item.volumeRatio >= 2.0 ? 'unusual_volume' : 'meaningful_price') as 'meaningful_price' | 'unusual_volume' | 'major_event',
    }));

    const response: PulseOverviewResponse = {
      awayDurationText,
      awayMinutes,
      lastCheckedAt,
      trackedCount: analyses.length,
      meaningfulChangesCount: needsAttention.length,
      unusualVolumeEventsCount: unusualVolumeCount,
      majorEventsCount,
      needsAttention,
      worthWatching,
      stable,
      rankedMissedEvents,
      benchmark,
      status: provider.getFreshnessMode() as any,
    };

    res.json(response);
  } catch (error) {
    console.error('Pulse calculation error:', error);
    res.status(500).json({ error: 'Unable to calculate the latest market pulse' });
  }
});

/**
 * POST /api/stocks/:symbol/explain
 * Explain already-detected factual signals using Gemini AI with deterministic fallback.
 */
apiRouter.post('/stocks/:symbol/explain', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const {
      name,
      currentPrice,
      priceChange,
      priceReturn,
      volumeRatio,
      relativePerformance,
      volatilityChange,
      attentionScore,
      classification,
      deterministicReason,
    } = req.body;

    const result = await GeminiExplainer.explainSignals({
      symbol,
      name: name || symbol,
      currentPrice: Number(currentPrice) || 0,
      priceChange: Number(priceChange) || 0,
      priceReturn: Number(priceReturn) || 0,
      volumeRatio: Number(volumeRatio) || 1.0,
      relativePerformance: Number(relativePerformance) || 0,
      volatilityChange: Number(volatilityChange) || 0,
      attentionScore: Number(attentionScore) || 50,
      classification: classification || 'Meaningful',
      deterministicReason: deterministicReason || 'Trading volume and price fluctuations detected.',
      benchmarkName: 'NIFTY 50',
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      explanation: 'Analysis unavailable. Please review measured statistical signals.',
      isAiGenerated: false,
    });
  }
});

/**
 * GET /api/stocks/:symbol/analysis
 */
apiRouter.get('/stocks/:symbol/analysis', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const provider = getActiveProvider();
    const quote = await provider.getQuote(symbol);
    if (!quote) {
      return res.status(404).json({ error: `Stock ${symbol} not found` });
    }

    const benchmark = await provider.getBenchmark();
    const news = await provider.getNews(symbol);
    const history1D = await provider.getHistoricalData(symbol, '1D');
    const discrepancy = await provider.validateDataDiscrepancy(symbol);

    const hasMajor = news.length > 0 && (symbol === 'INFY' || symbol === 'TATAMOTORS' || symbol === 'RELIANCE');
    const analysis = MeaningfulChangeEngine.calculate(
      quote,
      undefined,
      benchmark.percentChange,
      news[0]?.title,
      hasMajor
    );

    res.json({
      analysis,
      quote,
      benchmark,
      news,
      history1D,
      discrepancy,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze stock' });
  }
});
