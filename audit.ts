export interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  contractAddress: string;
  owner: string;
  creationDate: string;
  verified: boolean;
}

export interface LiquidityInfo {
  totalLiquidity: string;
  liquidityLocked: boolean;
  lockDuration: string;
  lpTokens: string;
  dexPairs: DexPair[];
}

export interface DexPair {
  dex: string;
  pair: string;
  liquidity: string;
  volume24h: string;
}

export interface SecurityAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issues: SecurityIssue[];
  honeypotStatus: boolean;
  canSell: boolean;
  canBuy: boolean;
}

export interface SecurityIssue {
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OwnerAnalysis {
  ownerAddress: string;
  isContract: boolean;
  ownershipRenounced: boolean;
  multiSig: boolean;
  previousProjects: number;
  reputation: 'good' | 'neutral' | 'bad';
}

export interface TransactionData {
  totalTransactions: number;
  uniqueHolders: number;
  avgTransactionSize: string;
  largeTransactions: Transaction[];
  recentActivity: Transaction[];
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
}

export interface RiskPrediction {
  predictedRiskScore: number;
  confidenceLevel: number;
  riskFactors: string[];
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'buy' | 'hold' | 'sell' | 'avoid';
  aiAnalysis: string;
}

export interface SentimentData {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  socialMetrics: {
    twitterMentions: number;
    redditPosts: number;
    telegramMembers: number;
    discordMembers: number;
  };
  influencerMentions: Array<{
    platform: string;
    username: string;
    followers: number;
    sentiment: string;
    content: string;
    timestamp: number;
  }>;
  trendingStatus: boolean;
  riskFlags: string[];
  communityHealth: number;
}

export interface AuditResult {
  tokenInfo: TokenInfo;
  liquidity: LiquidityInfo;
  security: SecurityAnalysis;
  owner: OwnerAnalysis;
  transactions: TransactionData;
  lastUpdated: string;
  auditId: string;
  // Unique Features
  aiPrediction?: RiskPrediction;
  socialSentiment?: SentimentData;
  vulnerabilityAnalysis?: any; // This will be populated from VulnerabilityAnalysisResult
}