import { GoogleGenAI } from '@google/genai';

export interface StructuredMarketSignals {
  symbol: string;
  name?: string;
  currentPrice: number;
  priceChange: number;
  priceReturn: number;
  volumeRatio: number;
  relativePerformance: number;
  volatilityChange: number;
  attentionScore: number;
  classification: string;
  deterministicReason: string;
  benchmarkName?: string;
}

export interface ExplanationResult {
  explanation: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export class GeminiExplainer {
  /**
   * Generates a concise factual explanation for a stock's attention score.
   * If Gemini is unavailable or errors, seamlessly returns the deterministic explanation.
   */
  public static async explainSignals(signals: StructuredMarketSignals): Promise<ExplanationResult> {
    const ai = getAiClient();

    if (!ai) {
      return {
        explanation: signals.deterministicReason,
        isAiGenerated: false,
      };
    }

    try {
      const benchmark = signals.benchmarkName || 'NIFTY 50';
      const prompt = `You are a financial analyst generating a factual explanation for a watchlist monitoring system.
The system has calculated an Attention Score of ${signals.attentionScore} / 100 (${signals.classification}) based on the following measured signals:

- Ticker: ${signals.symbol} (${signals.name || ''})
- Price Change: ${signals.priceReturn > 0 ? '+' : ''}${signals.priceReturn.toFixed(2)}% (Absolute: ₹${signals.priceChange.toFixed(2)})
- Trading Volume: ${signals.volumeRatio.toFixed(1)}x normal 20-day average
- Relative Performance vs ${benchmark}: ${signals.relativePerformance > 0 ? '+' : ''}${signals.relativePerformance.toFixed(2)}%
- Volatility Shift: ${signals.volatilityChange > 0 ? '+' : ''}${signals.volatilityChange.toFixed(1)}%
- Primary trigger summary: ${signals.deterministicReason}

STRICT CONSTRAINTS:
1. Write 2 to 3 concise, highly readable sentences explaining WHY this stock earned an Attention Score of ${signals.attentionScore}.
2. Use ONLY the factual numbers provided above. Never invent or hallucinate other figures, rumors, or unmentioned news.
3. Absolutely NO forward-looking predictions, price targets, or trading recommendations (do NOT say buy, sell, accumulate, or hold).
4. Do not offer personalized financial advice. Maintain a neutral, professional institutional tone.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a factual market signal summarizer. You explain already-calculated statistical market movements concisely and objectively without speculation or investment advice.',
          temperature: 0.2,
          topP: 0.8,
        },
      });

      const text = response.text?.trim();
      if (text && text.length > 20) {
        return {
          explanation: text,
          isAiGenerated: true,
          modelUsed: 'gemini-3.8-flash',
        };
      }

      return {
        explanation: signals.deterministicReason,
        isAiGenerated: false,
      };
    } catch (err) {
      console.warn('Gemini explanation fallback triggered:', (err as Error).message);
      return {
        explanation: signals.deterministicReason,
        isAiGenerated: false,
      };
    }
  }
}
