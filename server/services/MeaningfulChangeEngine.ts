import { ENGINE_WEIGHTS, ENGINE_THRESHOLDS } from '../config/engineConfig.ts';
import {
  AttentionClassification,
  MeaningfulChangeAnalysis,
  StockSignalScores,
  MarketQuote,
} from '../types.ts';

export interface MeaningfulChangeEngineInput {
  currentPrice: number;
  previousPrice: number;
  currentVolume: number;
  averageVolume: number;
  benchmarkReturn: number;
  volatility: number;
  previousVolatility: number;
  eventDescription?: string;
  hasMajorEvent?: boolean;
}

export class MeaningfulChangeEngine {
  /**
   * Calculates explainable attention scores and individual component signal scores.
   */
  public static calculate(
    quote: MarketQuote,
    checkpointPreviousPrice?: number,
    benchmarkReturn: number = -0.70,
    eventDescription?: string,
    hasMajorEvent: boolean = false
  ): MeaningfulChangeAnalysis {
    // Determine baseline price (from personal checkpoint if provided, otherwise quote.previousPrice)
    const baselinePrice = checkpointPreviousPrice && checkpointPreviousPrice > 0
      ? checkpointPreviousPrice
      : quote.previousPrice;

    const priceChange = quote.currentPrice - baselinePrice;
    const priceReturn = baselinePrice > 0 ? (priceChange / baselinePrice) * 100 : 0;
    const direction: 'UP' | 'DOWN' | 'FLAT' =
      priceReturn > 0.1 ? 'UP' : priceReturn < -0.1 ? 'DOWN' : 'FLAT';

    const currentVolume = quote.currentVolume;
    const averageVolume = quote.averageVolume > 0 ? quote.averageVolume : currentVolume;
    const volumeRatio = averageVolume > 0 ? Number((currentVolume / averageVolume).toFixed(2)) : 1.0;

    // Relative performance vs benchmark (e.g. NIFTY 50)
    // stockReturn - benchmarkReturn
    const relativePerformance = Number((priceReturn - benchmarkReturn).toFixed(2));

    // Volatility change
    const previousVol = quote.previousVolatility > 0 ? quote.previousVolatility : quote.volatility;
    const volatilityChange = previousVol > 0
      ? Number((((quote.volatility - previousVol) / previousVol) * 100).toFixed(1))
      : 0;

    // 1. Calculate Price Movement Score (0 - 100)
    const priceMovementScore = this.computePriceMovementScore(Math.abs(priceReturn));

    // 2. Calculate Volume Anomaly Score (0 - 100)
    const volumeAnomalyScore = this.computeVolumeAnomalyScore(volumeRatio);

    // 3. Calculate Relative Performance Score (0 - 100)
    const relativePerformanceScore = this.computeRelativePerformanceScore(Math.abs(relativePerformance));

    // 4. Calculate Volatility Change Score (0 - 100)
    const volatilityChangeScore = this.computeVolatilityChangeScore(volatilityChange);

    // 5. Calculate Event Score (0 - 100)
    const eventScore = this.computeEventScore(hasMajorEvent, eventDescription);

    // Attention Score weighted combination
    const rawAttentionScore =
      ENGINE_WEIGHTS.priceMovement * priceMovementScore +
      ENGINE_WEIGHTS.volumeAnomaly * volumeAnomalyScore +
      ENGINE_WEIGHTS.relativePerformance * relativePerformanceScore +
      ENGINE_WEIGHTS.volatilityChange * volatilityChangeScore +
      ENGINE_WEIGHTS.event * eventScore;

    const attentionScore = Math.min(100, Math.max(0, Math.round(rawAttentionScore)));

    // Classification
    const classification = this.classifyAttentionScore(attentionScore);

    // Generate deterministic short reason
    const shortReason = this.generateShortReason({
      priceReturn,
      volumeRatio,
      relativePerformance,
      volatilityChange,
      hasMajorEvent,
      eventDescription,
      attentionScore,
    });

    const signalScores: StockSignalScores = {
      priceMovementScore: Math.round(priceMovementScore),
      volumeAnomalyScore: Math.round(volumeAnomalyScore),
      relativePerformanceScore: Math.round(relativePerformanceScore),
      volatilityChangeScore: Math.round(volatilityChangeScore),
      eventScore: Math.round(eventScore),
    };

    return {
      symbol: quote.symbol,
      name: quote.name,
      exchange: quote.exchange,
      sector: quote.sector,
      currentPrice: quote.currentPrice,
      previousPrice: baselinePrice,
      priceChange: Number(priceChange.toFixed(2)),
      priceReturn: Number(priceReturn.toFixed(2)),
      direction,
      currentVolume,
      averageVolume,
      volumeRatio,
      benchmarkReturn,
      relativePerformance,
      volatility: quote.volatility,
      volatilityChange,
      attentionScore,
      classification,
      signalScores,
      shortReason,
      eventDescription,
      timestamp: quote.timestamp,
      dataFreshness: quote.status,
      hasDiscrepancy: quote.hasDiscrepancy,
    };
  }

  private static computePriceMovementScore(absReturn: number): number {
    const t = ENGINE_THRESHOLDS.priceMovementPercent;
    if (absReturn <= t.minimal) {
      return (absReturn / t.minimal) * 20; // 0 - 20
    }
    if (absReturn <= t.moderate) {
      return 20 + ((absReturn - t.minimal) / (t.moderate - t.minimal)) * 35; // 20 - 55
    }
    if (absReturn <= t.significant) {
      return 55 + ((absReturn - t.moderate) / (t.significant - t.moderate)) * 30; // 55 - 85
    }
    return Math.min(100, 85 + ((absReturn - t.significant) / (t.extreme - t.significant)) * 15);
  }

  private static computeVolumeAnomalyScore(volumeRatio: number): number {
    const t = ENGINE_THRESHOLDS.volumeRatio;
    if (volumeRatio <= t.normal) {
      return Math.max(5, volumeRatio * 15); // 5 - 15
    }
    if (volumeRatio <= t.elevated) {
      return 15 + ((volumeRatio - t.normal) / (t.elevated - t.normal)) * 35; // 15 - 50
    }
    if (volumeRatio <= t.unusual) {
      return 50 + ((volumeRatio - t.elevated) / (t.unusual - t.elevated)) * 25; // 50 - 75
    }
    if (volumeRatio <= t.highlyUnusual) {
      return 75 + ((volumeRatio - t.unusual) / (t.highlyUnusual - t.unusual)) * 20; // 75 - 95
    }
    return Math.min(100, 95 + (volumeRatio - t.highlyUnusual) * 5);
  }

  private static computeRelativePerformanceScore(absRelative: number): number {
    const t = ENGINE_THRESHOLDS.relativeSpreadPercent;
    if (absRelative <= t.aligned) {
      return (absRelative / t.aligned) * 25; // 0 - 25
    }
    if (absRelative <= t.notable) {
      return 25 + ((absRelative - t.aligned) / (t.notable - t.aligned)) * 40; // 25 - 65
    }
    if (absRelative <= t.divergent) {
      return 65 + ((absRelative - t.notable) / (t.divergent - t.notable)) * 25; // 65 - 90
    }
    return Math.min(100, 90 + ((absRelative - t.divergent) / 2.0) * 10);
  }

  private static computeVolatilityChangeScore(volChange: number): number {
    const absChange = Math.abs(volChange);
    const t = ENGINE_THRESHOLDS.volatilityExpansionPercent;
    if (absChange <= t.stable) {
      return (absChange / t.stable) * 25; // 0 - 25
    }
    if (absChange <= t.expanding) {
      return 25 + ((absChange - t.stable) / (t.expanding - t.stable)) * 40; // 25 - 65
    }
    if (absChange <= t.surging) {
      return 65 + ((absChange - t.expanding) / (t.surging - t.expanding)) * 25; // 65 - 90
    }
    return Math.min(100, 90 + (absChange - t.surging) * 0.5);
  }

  private static computeEventScore(hasMajorEvent: boolean, eventDescription?: string): number {
    if (hasMajorEvent) {
      return 90;
    }
    if (eventDescription && eventDescription.trim().length > 0) {
      return 60;
    }
    return 15;
  }

  private static classifyAttentionScore(score: number): AttentionClassification {
    const t = ENGINE_THRESHOLDS.classification;
    if (score <= t.normalMax) return 'Normal';
    if (score <= t.worthWatchingMax) return 'Worth Watching';
    if (score <= t.meaningfulMax) return 'Meaningful';
    return 'High Attention';
  }

  private static generateShortReason(data: {
    priceReturn: number;
    volumeRatio: number;
    relativePerformance: number;
    volatilityChange: number;
    hasMajorEvent: boolean;
    eventDescription?: string;
    attentionScore: number;
  }): string {
    const parts: string[] = [];

    // Price movement phrasing
    if (Math.abs(data.priceReturn) >= 3.0) {
      const verb = data.priceReturn < 0 ? 'Significant decline' : 'Sharp advance';
      parts.push(`${verb} (${data.priceReturn > 0 ? '+' : ''}${data.priceReturn.toFixed(1)}%)`);
    } else if (Math.abs(data.priceReturn) >= 1.2) {
      const verb = data.priceReturn < 0 ? 'Moderate pullback' : 'Steady gain';
      parts.push(`${verb} (${data.priceReturn > 0 ? '+' : ''}${data.priceReturn.toFixed(1)}%)`);
    }

    // Volume phrasing
    if (data.volumeRatio >= 2.0) {
      parts.push(`unusually heavy volume (${data.volumeRatio.toFixed(1)}× normal)`);
    } else if (data.volumeRatio >= 1.4) {
      parts.push(`elevated trading volume (${data.volumeRatio.toFixed(1)}× normal)`);
    }

    // Relative performance
    if (Math.abs(data.relativePerformance) >= 2.0) {
      const verb = data.relativePerformance < 0 ? 'strong underperformance' : 'strong outperformance';
      parts.push(`${verb} vs benchmark (${data.relativePerformance > 0 ? '+' : ''}${data.relativePerformance.toFixed(1)}%)`);
    }

    // Volatility or Event
    if (data.hasMajorEvent && data.eventDescription) {
      parts.push(`market catalyst: ${data.eventDescription}`);
    } else if (data.volatilityChange >= 25) {
      parts.push(`volatility expansion (+${data.volatilityChange.toFixed(0)}%)`);
    }

    if (parts.length === 0) {
      return 'Trading within normal baseline parameters with stable liquidity and aligned benchmark returns.';
    }

    // Capitalize first letter and format into a readable sentence
    const joined = parts.join(', combined with ');
    return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
  }
}
