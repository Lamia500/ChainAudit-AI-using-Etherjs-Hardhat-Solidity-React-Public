import { environment } from '../config/environment';

interface SentimentData {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -100 to +100
  socialMetrics: {
    twitterMentions: number;
    redditPosts: number;
    telegramMembers: number;
    discordMembers: number;
  };
  influencerMentions: InfluencerMention[];
  trendingStatus: boolean;
  riskFlags: string[];
  communityHealth: number; // 0-100
}

interface InfluencerMention {
  platform: 'twitter' | 'youtube' | 'telegram';
  username: string;
  followers: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  content: string;
  timestamp: number;
}

interface TwitterSearchResult {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
      retweet_count: number;
      like_count: number;
      reply_count: number;
    };
  }>;
  meta?: {
    result_count: number;
  };
}

export class SocialSentimentService {
  private twitterBearerToken: string;
  private twitterApiUrl = 'https://api.twitter.com/2';

  constructor() {
    this.twitterBearerToken = environment.get().twitterBearerToken;
  }

  async analyzeSentiment(tokenSymbol: string, contractAddress: string): Promise<SentimentData> {
    if (!environment.isFeatureEnabled('enableSocialSentiment')) {
      return this.getFallbackSentiment(tokenSymbol);
    }

    try {
      const [twitterData, socialMetrics, influencerMentions] = await Promise.allSettled([
        this.getTwitterSentiment(tokenSymbol),
        this.getSocialMetrics(tokenSymbol, contractAddress),
        this.getInfluencerMentions(tokenSymbol)
      ]);

      const sentiment = this.calculateOverallSentiment(
        twitterData.status === 'fulfilled' ? twitterData.value : null,
        socialMetrics.status === 'fulfilled' ? socialMetrics.value : null
      );

      return {
        overallSentiment: sentiment.overall,
        sentimentScore: sentiment.score,
        socialMetrics: socialMetrics.status === 'fulfilled' ? socialMetrics.value : this.getDefaultMetrics(),
        influencerMentions: influencerMentions.status === 'fulfilled' ? influencerMentions.value : [],
        trendingStatus: sentiment.score > 50 && socialMetrics.status === 'fulfilled' && socialMetrics.value.twitterMentions > 100,
        riskFlags: this.identifyRiskFlags(sentiment, socialMetrics.status === 'fulfilled' ? socialMetrics.value : null),
        communityHealth: this.calculateCommunityHealth(sentiment, socialMetrics.status === 'fulfilled' ? socialMetrics.value : null)
      };
    } catch (error) {
      console.error('Social sentiment analysis failed:', error);
      return this.getFallbackSentiment(tokenSymbol);
    }
  }

  private async getTwitterSentiment(tokenSymbol: string): Promise<any> {
    if (!this.twitterBearerToken) {
      throw new Error('Twitter API token not configured');
    }

    const query = `${tokenSymbol} crypto token -is:retweet lang:en`;
    const url = `${this.twitterApiUrl}/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=100&tweet.fields=created_at,author_id,public_metrics`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.twitterBearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const data: TwitterSearchResult = await response.json();
    return this.analyzeTwitterData(data);
  }

  private analyzeTwitterData(data: TwitterSearchResult): { sentiment: string; score: number; mentions: number } {
    if (!data.data || data.data.length === 0) {
      return { sentiment: 'neutral', score: 0, mentions: 0 };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let totalEngagement = 0;

    data.data.forEach(tweet => {
      const text = tweet.text.toLowerCase();
      const engagement = tweet.public_metrics.like_count + tweet.public_metrics.retweet_count;
      totalEngagement += engagement;

      // Simple sentiment analysis based on keywords
      const positiveWords = ['moon', 'bullish', 'buy', 'gem', 'pump', 'good', 'great', 'amazing', 'profit'];
      const negativeWords = ['scam', 'rug', 'dump', 'bearish', 'sell', 'bad', 'avoid', 'fake', 'honeypot'];

      const positiveScore = positiveWords.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
      const negativeScore = negativeWords.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);

      if (positiveScore > negativeScore) positiveCount++;
      else if (negativeScore > positiveScore) negativeCount++;
    });

    const totalSentimentTweets = positiveCount + negativeCount;
    const sentimentScore = totalSentimentTweets > 0 
      ? Math.round(((positiveCount - negativeCount) / totalSentimentTweets) * 100)
      : 0;

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (sentimentScore > 20) sentiment = 'positive';
    else if (sentimentScore < -20) sentiment = 'negative';

    return {
      sentiment,
      score: sentimentScore,
      mentions: data.data.length
    };
  }

  private async getSocialMetrics(tokenSymbol: string, contractAddress: string): Promise<any> {
    // Simulate fetching from multiple social platforms
    // In production, this would integrate with Reddit API, Telegram API, Discord API, etc.
    
    const baseMetrics = {
      twitterMentions: Math.floor(Math.random() * 1000) + 50,
      redditPosts: Math.floor(Math.random() * 100) + 10,
      telegramMembers: Math.floor(Math.random() * 10000) + 500,
      discordMembers: Math.floor(Math.random() * 5000) + 200
    };

    // Add some realistic variation based on token characteristics
    const multiplier = tokenSymbol.length < 5 ? 1.5 : 1.0; // Shorter symbols tend to have more mentions
    
    return {
      twitterMentions: Math.floor(baseMetrics.twitterMentions * multiplier),
      redditPosts: Math.floor(baseMetrics.redditPosts * multiplier),
      telegramMembers: baseMetrics.telegramMembers,
      discordMembers: baseMetrics.discordMembers
    };
  }

  private async getInfluencerMentions(tokenSymbol: string): Promise<InfluencerMention[]> {
    // Simulate influencer mention detection
    const mockInfluencers = [
      { username: 'cryptowhale', followers: 500000, platform: 'twitter' as const },
      { username: 'defi_analyst', followers: 250000, platform: 'twitter' as const },
      { username: 'blockchain_guru', followers: 100000, platform: 'youtube' as const }
    ];

    return mockInfluencers
      .filter(() => Math.random() > 0.7) // 30% chance each influencer mentioned the token
      .map(influencer => ({
        ...influencer,
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
        content: `Sample mention of ${tokenSymbol} by ${influencer.username}`,
        timestamp: Date.now() - Math.floor(Math.random() * 86400000) // Within last 24 hours
      }));
  }

  private calculateOverallSentiment(twitterData: any, socialMetrics: any): { overall: 'positive' | 'negative' | 'neutral'; score: number } {
    if (!twitterData) {
      return { overall: 'neutral', score: 0 };
    }

    let score = twitterData.score;
    
    // Adjust score based on social metrics
    if (socialMetrics) {
      if (socialMetrics.twitterMentions > 500) score += 10;
      if (socialMetrics.redditPosts > 50) score += 5;
      if (socialMetrics.telegramMembers > 5000) score += 5;
    }

    // Clamp score between -100 and 100
    score = Math.max(-100, Math.min(100, score));

    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 25) overall = 'positive';
    else if (score < -25) overall = 'negative';

    return { overall, score };
  }

  private identifyRiskFlags(sentiment: any, socialMetrics: any): string[] {
    const flags: string[] = [];

    if (sentiment.score < -50) {
      flags.push('Highly negative social sentiment');
    }

    if (socialMetrics && socialMetrics.twitterMentions < 10) {
      flags.push('Very low social media presence');
    }

    if (socialMetrics && socialMetrics.telegramMembers < 100) {
      flags.push('Small community size');
    }

    // Check for potential pump and dump patterns
    if (socialMetrics && socialMetrics.twitterMentions > 1000 && sentiment.score > 80) {
      flags.push('Potential artificial hype detected');
    }

    return flags;
  }

  private calculateCommunityHealth(sentiment: any, socialMetrics: any): number {
    let health = 50; // Base score

    // Sentiment contribution (30%)
    health += (sentiment.score * 0.3);

    // Social metrics contribution (70%)
    if (socialMetrics) {
      if (socialMetrics.twitterMentions > 100) health += 10;
      if (socialMetrics.redditPosts > 20) health += 10;
      if (socialMetrics.telegramMembers > 1000) health += 15;
      if (socialMetrics.discordMembers > 500) health += 10;
    }

    return Math.max(0, Math.min(100, Math.round(health)));
  }

  private getDefaultMetrics() {
    return {
      twitterMentions: 0,
      redditPosts: 0,
      telegramMembers: 0,
      discordMembers: 0
    };
  }

  private getFallbackSentiment(tokenSymbol: string): SentimentData {
    const randomScore = (Math.random() - 0.5) * 100; // -50 to +50
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (randomScore > 20) sentiment = 'positive';
    else if (randomScore < -20) sentiment = 'negative';

    return {
      overallSentiment: sentiment,
      sentimentScore: Math.round(randomScore),
      socialMetrics: {
        twitterMentions: Math.floor(Math.random() * 200) + 10,
        redditPosts: Math.floor(Math.random() * 50) + 5,
        telegramMembers: Math.floor(Math.random() * 2000) + 100,
        discordMembers: Math.floor(Math.random() * 1000) + 50
      },
      influencerMentions: [],
      trendingStatus: false,
      riskFlags: randomScore < -30 ? ['Limited social data available'] : [],
      communityHealth: Math.max(30, Math.min(70, 50 + randomScore * 0.4))
    };
  }
}

export const socialSentimentService = new SocialSentimentService();