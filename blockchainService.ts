import { ethers } from 'ethers';
import { environment } from '../config/environment';

// Import ABIs from compiled contracts
import TokenAnalyzerArtifact from '../../artifacts/contracts/TokenAnalyzer.sol/TokenAnalyzer.json';
import AuditRegistryArtifact from '../../artifacts/contracts/AuditRegistry.sol/AuditRegistry.json';
import ScamDetectorArtifact from '../../artifacts/contracts/ScamDetector.sol/ScamDetector.json';

// Use the actual ABIs from the compiled contracts
const TOKEN_ANALYZER_ABI = TokenAnalyzerArtifact.abi;
const AUDIT_REGISTRY_ABI = AuditRegistryArtifact.abi;
const SCAM_DETECTOR_ABI = ScamDetectorArtifact.abi;

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private tokenAnalyzer: ethers.Contract;
  private auditRegistry: ethers.Contract;
  private scamDetector: ethers.Contract;

  constructor() {
    const config = environment.get();
    // Initialize provider with environment configuration
    this.provider = new ethers.JsonRpcProvider(environment.getRpcUrl());
    
    // Initialize contracts
    this.tokenAnalyzer = new ethers.Contract(
      config.tokenAnalyzerAddress,
      TOKEN_ANALYZER_ABI,
      this.provider
    );
    
    this.auditRegistry = new ethers.Contract(
      config.auditRegistryAddress,
      AUDIT_REGISTRY_ABI,
      this.provider
    );
    
    this.scamDetector = new ethers.Contract(
      config.scamDetectorAddress,
      SCAM_DETECTOR_ABI,
      this.provider
    );
  }

  async connectWallet(): Promise<void> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await provider.getSigner();
        
        // Update contracts with signer
        this.tokenAnalyzer = this.tokenAnalyzer.connect(this.signer);
        this.auditRegistry = this.auditRegistry.connect(this.signer);
        this.scamDetector = this.scamDetector.connect(this.signer);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask not found');
    }
  }

  async analyzeTokenOnChain(tokenAddress: string): Promise<any> {
    try {
      console.log('Analyzing token on-chain:', tokenAddress);
      console.log('Using RPC URL:', environment.getRpcUrl());
      console.log('Contract addresses:', this.getContractAddresses());
      
      // Declare variables outside the try block to make them accessible in the return statement
      let tokenInfo;
      let scamAnalysis;
      let isAudited = false;
      let auditRecord = null;
      
      // Get basic token info
      console.log('Fetching token info for address:', tokenAddress);
      tokenInfo = await this.tokenAnalyzer.getTokenInfo(tokenAddress);
      console.log('Token info from blockchain:', tokenInfo);
      console.log('Token name:', tokenInfo.name);
      console.log('Token symbol:', tokenInfo.symbol);
      console.log('Token decimals:', tokenInfo.decimals);
      console.log('Token totalSupply:', tokenInfo.totalSupply.toString());
      
      // Get scam analysis
      console.log('Fetching scam analysis for address:', tokenAddress);
      scamAnalysis = await this.scamDetector.getScamAnalysis(tokenAddress);
      console.log('Scam analysis from blockchain:', scamAnalysis);
      
      // Check if already audited
      console.log('Checking if token is audited:', tokenAddress);
      isAudited = await this.auditRegistry.isTokenAudited(tokenAddress);
      
      if (isAudited) {
        console.log('Token is audited, fetching audit record');
        auditRecord = await this.auditRegistry.getAuditRecord(tokenAddress);
        console.log('Existing audit record:', auditRecord);
      }

      return {
        tokenInfo: {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          totalSupply: tokenInfo.totalSupply.toString(),
          owner: tokenInfo.owner,
          exists: tokenInfo.exists
        },
        scamAnalysis: {
          hasHiddenMint: scamAnalysis.hasHiddenMint,
          hasBlacklist: scamAnalysis.hasBlacklist,
          hasHighTax: scamAnalysis.hasHighTax,
          hasLiquidityDrain: scamAnalysis.hasLiquidityDrain,
          hasOwnershipIssues: scamAnalysis.hasOwnershipIssues,
          isHoneypot: scamAnalysis.isHoneypot,
          riskScore: scamAnalysis.riskScore.toString()
        },
        auditRecord,
        isAudited
      };
    } catch (error) {
      console.error('Blockchain analysis failed:', error);
      throw error;
    }
  }

  async submitAuditToBlockchain(
    tokenAddress: string,
    riskScore: number,
    isScam: boolean,
    isHoneypot: boolean,
    ipfsHash: string = ""
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const tx = await this.auditRegistry.submitAuditResult(
        tokenAddress,
        riskScore,
        isScam,
        isHoneypot,
        ipfsHash
      );

      console.log('Audit submitted to blockchain:', tx.hash);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to submit audit to blockchain:', error);
      throw error;
    }
  }

  async updateTokenMetrics(
    tokenAddress: string,
    totalTransactions: number,
    uniqueHolders: number,
    liquidityUSD: number,
    liquidityLocked: boolean
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const tx = await this.auditRegistry.updateTokenMetrics(
        tokenAddress,
        totalTransactions,
        uniqueHolders,
        liquidityUSD,
        liquidityLocked
      );

      console.log('Token metrics updated on blockchain:', tx.hash);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update token metrics:', error);
      throw error;
    }
  }

  async batchAnalyzeTokens(tokenAddresses: string[]): Promise<any[]> {
    try {
      const results = await this.tokenAnalyzer.batchAnalyze(tokenAddresses);
      return results.map((result: any) => ({
        name: result.name,
        symbol: result.symbol,
        decimals: result.decimals,
        totalSupply: result.totalSupply.toString(),
        owner: result.owner,
        exists: result.exists
      }));
    } catch (error) {
      console.error('Batch analysis failed:', error);
      throw error;
    }
  }

  getContractAddresses() {
    const config = environment.get();
    return {
      TokenAnalyzer: config.tokenAnalyzerAddress,
      AuditRegistry: config.auditRegistryAddress,
      ScamDetector: config.scamDetectorAddress,
      network: config.networkName
    };
  }
}

// Global blockchain service instance
export const blockchainService = new BlockchainService();