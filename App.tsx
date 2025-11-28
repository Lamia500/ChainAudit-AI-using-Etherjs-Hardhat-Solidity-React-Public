import React, { useState, useEffect } from 'react';
import { AuditHeader } from './components/AuditHeader';
import { TokenSearch } from './components/TokenSearch';
import { AuditResults } from './components/AuditResults';
import { VulnerabilityAnalysis } from './components/VulnerabilityAnalysis';
import { EnhancedAuditService } from './services/enhancedAuditService';
import { blockchainService } from './services/blockchainService';
import { ReportService } from './services/reportService';
import { vulnerabilityAnalysisService } from './services/vulnerabilityAnalysisService';
import { AuditResult } from './types/audit';
import { VulnerabilityAnalysisResult } from './services/vulnerabilityAnalysisService';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResult | null>(null);
  const [vulnerabilityResults, setVulnerabilityResults] = useState<VulnerabilityAnalysisResult | null>(null);
  const [isAnalyzingVulnerabilities, setIsAnalyzingVulnerabilities] = useState(false);
  const [error, setError] = useState('');

  const auditService = new EnhancedAuditService();
  const reportService = new ReportService();

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initialize blockchain connection
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          console.log('MetaMask detected, ready for blockchain integration');
        }
      } catch (error) {
        console.warn('Blockchain initialization failed:', error);
      }
    };
    
    initBlockchain();
  }, []);

  const handleSearch = async (contractAddress: string) => {
    setIsLoading(true);
    setError('');
    setAuditResults(null);
    setVulnerabilityResults(null);

    // Try to connect wallet for blockchain features
    try {
      await blockchainService.connectWallet();
      console.log('Wallet connected for enhanced analysis');
    } catch (error) {
      console.warn('Wallet connection failed, using standard analysis:', error);
    }

    try {
      const results = await auditService.auditToken(contractAddress);
      setAuditResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during the audit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVulnerabilityAnalysis = async (contractAddress: string) => {
    setIsAnalyzingVulnerabilities(true);
    setError('');
    
    try {
      const results = await vulnerabilityAnalysisService.analyzeVulnerabilities(contractAddress);
      setVulnerabilityResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during vulnerability analysis');
    } finally {
      setIsAnalyzingVulnerabilities(false);
    }
  };

  const handleExportReport = async () => {
    if (!auditResults) return;

    try {
      await reportService.generatePDFReport(auditResults);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <AuditHeader
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onExportReport={handleExportReport}
        isLoading={!auditResults}
        tokenInfo={auditResults ? {
          name: auditResults.tokenInfo.name,
          symbol: auditResults.tokenInfo.symbol,
          priceChange: auditResults.riskAssessment?.priceVolatility || 2.5
        } : undefined}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <TokenSearch
            onSearch={handleSearch}
            isLoading={isLoading}
            darkMode={darkMode}
          />
          
          {/* Blockchain Status Indicator */}
          <div className={`text-center text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>🔗 Enhanced with Solidity smart contracts for on-chain analysis</p>
            <p>📊 Real-time blockchain data integration</p>
          </div>

          {error && (
            <div className={`p-4 rounded-xl border border-red-200 ${
              darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {auditResults && (
            <>
              <AuditResults results={auditResults} darkMode={darkMode} />
              <div className="mt-8">
                <VulnerabilityAnalysis 
                  contractAddress={auditResults.tokenInfo.contractAddress}
                  results={vulnerabilityResults}
                  darkMode={darkMode}
                  onAnalyze={handleVulnerabilityAnalysis}
                  isAnalyzing={isAnalyzingVulnerabilities}
                  error={error}
                />
              </div>
            </>
          )}

          {!auditResults && !isLoading && !error && (
            <div className={`text-center py-12 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">Ready to Audit</h3>
                <p className="text-sm">
                  Enter a token contract address to begin comprehensive security analysis using our 
                  advanced AI-powered analysis, social sentiment monitoring, and Solidity smart contracts.
                </p>
                <div className="mt-4 text-xs space-y-1">
                  <p>✅ On-chain contract analysis</p>
                  <p>✅ AI-powered risk prediction</p>
                  <p>✅ Social sentiment analysis</p>
                  <p>✅ Professional audit reports</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 ${
          darkMode ? 'bg-blue-500' : 'bg-purple-300'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 ${
          darkMode ? 'bg-purple-500' : 'bg-blue-300'
        }`}></div>
      </div>
    </div>
  );
}

export default App;