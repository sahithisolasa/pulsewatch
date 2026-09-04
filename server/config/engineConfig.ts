export interface EngineWeights {
  priceMovement: number;
  volumeAnomaly: number;
  relativePerformance: number;
  volatilityChange: number;
  event: number;
}

export interface EngineThresholds {
  volumeRatio: {
    normal: number;     // 1.0x
    elevated: number;   // 1.5x
    unusual: number;    // 2.0x
    highlyUnusual: number; // 3.0x+
  };
  priceMovementPercent: {
    minimal: number;    // < 0.8%
    moderate: number;   // 0.8% - 2.5%
    significant: number;// 2.5% - 4.5%
    extreme: number;    // > 4.5%
  };
  relativeSpreadPercent: {
    aligned: number;    // < 1.0%
    notable: number;    // 1.0% - 2.5%
    divergent: number;  // > 2.5%
  };
  volatilityExpansionPercent: {
    stable: number;     // < 10%
    expanding: number;  // 10% - 25%
    surging: number;    // > 25%
  };
  classification: {
    normalMax: number;       // 30
    worthWatchingMax: number;// 60
    meaningfulMax: number;   // 80
    highAttentionMin: number;// 81
  };
}

export const ENGINE_WEIGHTS: EngineWeights = {
  priceMovement: 0.30,
  volumeAnomaly: 0.20,
  relativePerformance: 0.15,
  volatilityChange: 0.15,
  event: 0.20,
};

export const ENGINE_THRESHOLDS: EngineThresholds = {
  volumeRatio: {
    normal: 1.0,
    elevated: 1.5,
    unusual: 2.0,
    highlyUnusual: 3.0,
  },
  priceMovementPercent: {
    minimal: 0.8,
    moderate: 2.5,
    significant: 4.5,
    extreme: 6.0,
  },
  relativeSpreadPercent: {
    aligned: 1.0,
    notable: 2.5,
    divergent: 4.0,
  },
  volatilityExpansionPercent: {
    stable: 10,
    expanding: 25,
    surging: 40,
  },
  classification: {
    normalMax: 30,
    worthWatchingMax: 60,
    meaningfulMax: 80,
    highAttentionMin: 81,
  },
};
