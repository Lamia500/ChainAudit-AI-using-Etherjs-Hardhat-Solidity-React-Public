interface EnvironmentConfig {
  // Blockchain Configuration
  alchemyApiKey: string;
  etherscanApiKey: string;
  privateKey: string;
  
  // Smart Contract Addresses
  tokenAnalyzerAddress: string;
  auditRegistryAddress: string;
  scamDetectorAddress: string;
  
  // Network Configuration
  networkName: string;
  chainId: number;
  rpcUrl: string;
  
  // API Configuration
  dexscreenerApi: string;
  coingeckoApi: string;
  moralisApiKey: string;
  
  // Application Configuration
  appName: string;
  appVersion: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  
  // Security Configuration
  maxAuditRequestsPerHour: number;
  enableRateLimiting: boolean;
  auditCacheDuration: number;
  
  // Unique Features Configuration
  enableAiRiskPrediction: boolean;
  enableSocialSentiment: boolean;
  twitterBearerToken: string;
  openaiApiKey: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      // Blockchain Configuration
      alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY || '',
      etherscanApiKey: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
      privateKey: import.meta.env.VITE_PRIVATE_KEY || '',
      
      // Smart Contract Addresses
      tokenAnalyzerAddress: import.meta.env.VITE_TOKEN_ANALYZER_ADDRESS || '',
      auditRegistryAddress: import.meta.env.VITE_AUDIT_REGISTRY_ADDRESS || '',
      scamDetectorAddress: import.meta.env.VITE_SCAM_DETECTOR_ADDRESS || '',
      
      // Network Configuration
      networkName: import.meta.env.VITE_NETWORK_NAME || 'mainnet',
      chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '1'),
      rpcUrl: import.meta.env.VITE_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/',
      
      // API Configuration
      dexscreenerApi: import.meta.env.VITE_DEXSCREENER_API || 'https://api.dexscreener.com/latest',
      coingeckoApi: import.meta.env.VITE_COINGECKO_API || 'https://api.coingecko.com/api/v3',
      moralisApiKey: import.meta.env.VITE_MORALIS_API_KEY || '',
      
      // Application Configuration
      appName: import.meta.env.VITE_APP_NAME || 'CryptoAudit Pro',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
      
      // Security Configuration
      maxAuditRequestsPerHour: parseInt(import.meta.env.VITE_MAX_AUDIT_REQUESTS_PER_HOUR || '10'),
      enableRateLimiting: import.meta.env.VITE_ENABLE_RATE_LIMITING === 'true',
      auditCacheDuration: parseInt(import.meta.env.VITE_AUDIT_CACHE_DURATION || '300000'),
      
      // Unique Features Configuration
      enableAiRiskPrediction: import.meta.env.VITE_ENABLE_AI_RISK_PREDICTION === 'true',
      enableSocialSentiment: import.meta.env.VITE_ENABLE_SOCIAL_SENTIMENT === 'true',
      twitterBearerToken: import.meta.env.VITE_TWITTER_BEARER_TOKEN || '',
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = [
      'alchemyApiKey',
      'etherscanApiKey',
      'tokenAnalyzerAddress',
      'auditRegistryAddress',
      'scamDetectorAddress'
    ];

    const missingFields = requiredFields.filter(field => !this.config[field as keyof EnvironmentConfig]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing required environment variables: ${missingFields.join(', ')}`);
    }
  }

  get(): EnvironmentConfig {
    return { ...this.config };
  }

  getRpcUrl(): string {
    // Make sure we have a valid RPC URL with API key
    console.log('Getting RPC URL with base:', this.config.rpcUrl);
    console.log('Using Alchemy API key:', this.config.alchemyApiKey);
    const url = `${this.config.rpcUrl}${this.config.alchemyApiKey}`;
    console.log('Final RPC URL:', url);
    return url;
  }

  getEtherscanUrl(): string {
    return `https://api.etherscan.io/api?apikey=${this.config.etherscanApiKey}`;
  }

  isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
    return Boolean(this.config[feature]);
  }
}

export const environment = new Environment();
export type { EnvironmentConfig };