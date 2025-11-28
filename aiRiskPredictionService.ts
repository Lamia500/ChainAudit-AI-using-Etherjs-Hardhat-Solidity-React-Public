import { environment } from '../config/environment';
import { AuditResult } from '../types/audit';

interface RiskPrediction {
  predictedRiskScore: number;
  confidenceLevel: number;
  riskFactors: string[];
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'buy' | 'hold' | 'sell' | 'avoid';
  aiAnalysis: string;
}

interface MarketData {
  priceChange24h: number;
  volumeChange24h: number;
  holderGrowth: number;
  liquidityTrend: number;
}

export class AIRiskPredictionService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = environment.get().openaiApiKey;
  }

  async predictRisk(auditResult: AuditResult, marketData?: MarketData): Promise<RiskPrediction> {
    if (!environment.isFeatureEnabled('enableAiRiskPrediction') || !this.apiKey) {
      return this.getFallbackPrediction(auditResult);
    }

    try {
      const prompt = this.buildAnalysisPrompt(auditResult, marketData);
      const aiResponse = await this.callOpenAI(prompt);
      return this.parseAIResponse(aiResponse, auditResult);
    } catch (error) {
      console.error('AI Risk Prediction failed:', error);
      return this.getFallbackPrediction(auditResult);
    }
  }

  private buildAnalysisPrompt(auditResult: AuditResult, marketData?: MarketData): string {
    return `
Analyze this cryptocurrency token for investment risk:

Token Information:
- Name: ${auditResult.tokenInfo.name}
- Symbol: ${auditResult.tokenInfo.symbol}
- Total Supply: ${auditResult.tokenInfo.totalSupply}
- Contract Verified: ${auditResult.tokenInfo.verified}

Security Analysis:
- Current Risk Score: ${auditResult.security.riskScore}/100
- Risk Level: ${auditResult.security.riskLevel}
- Can Buy: ${auditResult.security.canBuy}
- Can Sell: ${auditResult.security.canSell}
- Honeypot Status: ${auditResult.security.honeypotStatus}
- Security Issues: ${auditResult.security.issues.length}

Liquidity:
- Total Liquidity: $${auditResult.liquidity.totalLiquidity}
- Liquidity Locked: ${auditResult.liquidity.liquidityLocked}
- DEX Pairs: ${auditResult.liquidity.dexPairs.length}

Owner Analysis:
- Ownership Renounced: ${auditResult.owner.ownershipRenounced}
- MultiSig: ${auditResult.owner.multiSig}
- Reputation: ${auditResult.owner.reputation}

Transaction Data:
- Total Transactions: ${auditResult.transactions.totalTransactions}
- Unique Holders: ${auditResult.transactions.uniqueHolders}

${marketData ? `
Market Data:
- 24h Price Change: ${marketData.priceChange24h}%
- 24h Volume Change: ${marketData.volumeChange24h}%
- Holder Growth: ${marketData.holderGrowth}%
- Liquidity Trend: ${marketData.liquidityTrend}%
` : ''}

Please provide:
1. Predicted risk score (0-100)
2. Confidence level (0-100)
3. Top 3 risk factors
4. Market trend assessment
5. Investment recommendation
6. Brief analysis summary

Format as JSON with keys: predictedRiskScore, confidenceLevel, riskFactors, marketTrend, recommendation, analysis
`;
  }

  private async callOpenAI(prompt: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency security expert and risk analyst. Provide accurate, data-driven analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseAIResponse(aiResponse: string, auditResult: AuditResult): RiskPrediction {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        predictedRiskScore: Math.min(100, Math.max(0, parsed.predictedRiskScore || auditResult.security.riskScore)),
        confidenceLevel: Math.min(100, Math.max(0, parsed.confidenceLevel || 75)),
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.slice(0, 3) : ['AI analysis unavailable'],
        marketTrend: ['bullish', 'bearish', 'neutral'].includes(parsed.marketTrend) ? parsed.marketTrend : 'neutral',
        recommendation: ['buy', 'hold', 'sell', 'avoid'].includes(parsed.recommendation) ? parsed.recommendation : 'hold',
        aiAnalysis: parsed.analysis || 'AI analysis completed successfully'
      };
    } catch (error) {
      return this.getFallbackPrediction(auditResult);
    }
  }

  private getFallbackPrediction(auditResult: AuditResult): RiskPrediction {
    const baseRisk = auditResult.security.riskScore;
    const adjustedRisk = Math.min(100, baseRisk + (Math.random() * 20 - 10)); // ±10 variation

    let recommendation: 'buy' | 'hold' | 'sell' | 'avoid' = 'hold';
    if (adjustedRisk < 25) recommendation = 'buy';
    else if (adjustedRisk < 50) recommendation = 'hold';
    else if (adjustedRisk < 75) recommendation = 'sell';
    else recommendation = 'avoid';

    return {
      predictedRiskScore: Math.round(adjustedRisk),
      confidenceLevel: 65,
      riskFactors: [
        'Contract security analysis',
        'Liquidity assessment',
        'Owner reputation check'
      ],
      marketTrend: 'neutral',
      recommendation,
      aiAnalysis: 'Fallback analysis based on security metrics and liquidity data'
    };
  }

  async getMarketData(contractAddress: string): Promise<MarketData | null> {
    try {
      // Simulate market data fetching from multiple sources
      // In production, this would call real APIs like CoinGecko, DexScreener, etc.
      return {
        priceChange24h: (Math.random() - 0.5) * 20, // -10% to +10%
        volumeChange24h: (Math.random() - 0.5) * 50, // -25% to +25%
        holderGrowth: Math.random() * 10, // 0% to 10%
        liquidityTrend: (Math.random() - 0.5) * 30 // -15% to +15%
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      return null;
    }
  }
}

export const aiRiskPredictionService = new AIRiskPredictionService();