/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  PieChart, 
  Loader2, 
  FileText,
  User,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SAMPLE_PROFILES } from './lib/mockData';
import { parseTransactions, calculateMetrics, computeTrustScore } from './lib/scoring';
import { generateExplanation } from './lib/gemini';
import { TrustScoreResult } from './lib/types';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<TrustScoreResult | null>(null);
  const [history, setHistory] = useState<TrustScoreResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileLabel, setSelectedProfileLabel] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('momo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('momo_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter some transaction messages or select a sample profile to begin analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      setLoadingStep('Parsing transaction messages...');
      await new Promise(resolve => setTimeout(resolve, 800));
      const transactions = parseTransactions(inputText);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found. Please check the format of your messages.');
      }

      setLoadingStep('Calculating financial metrics...');
      await new Promise(resolve => setTimeout(resolve, 800));
      const metrics = calculateMetrics(transactions);
      const { score, rating } = computeTrustScore(metrics);

      setLoadingStep('Generating AI explanation...');
      const partialResult: TrustScoreResult = {
        score,
        rating,
        metrics,
        transactions,
      };

      const explanation = await generateExplanation(partialResult);
      
      const finalResult = {
        ...partialResult,
        explanation
      };

      setResult(finalResult);
      setHistory(prev => [finalResult, ...prev].slice(0, 5)); // Keep last 5
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setError(null);
    setSelectedProfileLabel(null);
  };

  const loadSample = (profileKey: keyof typeof SAMPLE_PROFILES) => {
    setInputText(SAMPLE_PROFILES[profileKey]);
    setResult(null);
    setError(null);
    const labels = {
      marketTrader: 'Market Trader (Strong Profile)',
      taxiDriver: 'Taxi Driver (Moderate Profile)',
      foodVendor: 'Food Vendor (Weak Profile)'
    };
    setSelectedProfileLabel(labels[profileKey]);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-black w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tighter">MoMoScore</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5 hidden sm:block">
              Turn mobile money activity into an explainable trust signal
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">How it works</a>
            <a href="#" className="hover:text-white transition-colors">For Lenders</a>
            <button className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-emerald-500 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Unlock Financial Trust with <span className="text-emerald-500">MoMoScore</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We convert your mobile money transaction history into a powerful financial identity, 
              helping informal workers access formal credit and opportunities.
            </p>

            {/* Step Flow */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
              {[
                { step: 1, label: "Paste messages" },
                { step: 2, label: "Extract data" },
                { step: 3, label: "Score behavior" },
                { step: 4, label: "View insights" }
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-500">
                    {s.step}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Input Section */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.section 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-12 mb-16"
            >
              <div className="bg-[#141417] border border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="text-emerald-500 w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-semibold">Input Transactions</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Demo uses mock SMS data only</p>
                    </div>
                  </div>
                  {inputText && (
                    <button 
                      onClick={handleReset}
                      className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="text-emerald-500 font-bold">How to start:</span> Paste your mobile money SMS messages in the box below, or click one of the <span className="text-emerald-500">test samples</span> to see how the scoring works.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quick Test Samples</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => loadSample('marketTrader')}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <User className="w-3 h-3" /> Market Trader
                      </button>
                      <button 
                        onClick={() => loadSample('taxiDriver')}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-3 h-3" /> Taxi Driver
                      </button>
                      <button 
                        onClick={() => loadSample('foodVendor')}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <PieChart className="w-3 h-3" /> Food Vendor
                      </button>
                    </div>
                  </div>
                </div>
                  {selectedProfileLabel && (
                    <div className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-md inline-block">
                      Selected: {selectedProfileLabel}
                    </div>
                  )}

                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setSelectedProfileLabel(null);
                    }}
                    placeholder="Paste your mobile money SMS messages here..."
                    className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-500/20"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {loadingStep}
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Generate MoMoScore
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-[#141417] border border-white/5 rounded-3xl p-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500 w-5 h-5" />
                    Why MoMoScore?
                  </h3>
                  <ul className="space-y-4 text-gray-400 text-sm">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span>Convert informal transaction history into a verifiable credit alternative.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span>AI-powered insights explain your financial strengths to potential lenders.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-transparent border border-white/5 rounded-3xl p-8">
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold mb-2">Hackathon Demo Mode</h3>
                    <p className="text-gray-400 text-sm">
                      Use the sample profiles to see how different business patterns affect the trust score. 
                      MoMoScore uses deterministic rules for scoring and Gemini for explainability.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="results"
              id="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8 mb-16"
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowDownLeft className="w-4 h-4 rotate-45" />
                  Run New Analysis
                </button>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                  Analysis Results
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="md:col-span-1 bg-[#141417] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Trust Score</span>
                  <div className="relative mb-4">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                      <circle
                        cx="80"
                        cy="80"
                        r="72"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={452.4}
                        strokeDashoffset={452.4 - (452.4 * result.score) / 100}
                        className={`${
                          result.rating === 'Strong' ? 'text-emerald-500' : 
                          result.rating === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                        } transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{result.score}</span>
                      <span className={`text-xs font-bold mt-1 ${
                        result.rating === 'Strong' ? 'text-emerald-500' : 
                        result.rating === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                      }`}>{result.rating.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="md:col-span-2 bg-[#141417] border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-emerald-500 w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">AI Summary</h3>
                  </div>
                  <p className="text-lg text-gray-200 leading-relaxed italic">
                    "{result.explanation?.summary}"
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141417] border border-white/5 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Inflow</span>
                  <span className="text-lg font-bold">XAF {result.metrics.totalInflow.toLocaleString()}</span>
                </div>
                <div className="bg-[#141417] border border-white/5 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Outflow</span>
                  <span className="text-lg font-bold">XAF {result.metrics.totalOutflow.toLocaleString()}</span>
                </div>
                <div className="bg-[#141417] border border-white/5 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Active Days</span>
                  <span className="text-lg font-bold">{result.metrics.activeDays}</span>
                </div>
                <div className="bg-[#141417] border border-white/5 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Consistency</span>
                  <span className="text-lg font-bold text-emerald-500">{result.metrics.activityConsistencyLevel.toUpperCase()}</span>
                </div>
              </div>

              {/* Detailed Toggle */}
              <div className="pt-4">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full py-4 border border-white/5 rounded-2xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  {showDetails ? 'Hide Detailed Report' : 'View Detailed Report'}
                  <ArrowDownLeft className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-8 overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[#141417] border border-white/5 rounded-3xl p-6">
                      <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Strengths</h4>
                      <ul className="space-y-2">
                        {result.explanation?.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-gray-400 flex gap-2">
                            <span className="text-emerald-500">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#141417] border border-white/5 rounded-3xl p-6">
                      <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-4">Risks</h4>
                      <ul className="space-y-2">
                        {result.explanation?.risks.map((r, i) => (
                          <li key={i} className="text-sm text-gray-400 flex gap-2">
                            <span className="text-red-400">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#141417] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Recommendations</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {result.explanation?.recommendations.map((rec, i) => (
                        <div key={i} className="bg-black/20 p-4 rounded-xl text-xs text-gray-400 leading-relaxed">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#141417] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Transaction History</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-white/5">
                          {result.transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-6 py-3 text-gray-500">{tx.date}</td>
                              <td className="px-6 py-3 font-medium">{tx.counterparty}</td>
                              <td className="px-6 py-3 text-right font-mono">
                                {tx.type === 'inflow' ? '+' : '-'} {tx.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <section className="max-w-4xl mx-auto mt-20 pt-20 border-t border-white/5">
            <div className="flex items-center gap-2 mb-8">
              <History className="text-emerald-500 w-5 h-5" />
              <h2 className="text-xl font-semibold">Recent Analysis History</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setResult(h);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#141417] border border-white/5 rounded-2xl p-5 text-left hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{h.transactions[0].date}</span>
                    <span className={`text-xs font-bold ${
                      h.rating === 'Strong' ? 'text-emerald-500' : 
                      h.rating === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                    }`}>{h.score}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 italic mb-3">
                    "{h.explanation?.summary}"
                  </p>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View Report <ArrowUpRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <ShieldCheck className="text-black w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">MoMoScore</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 MoMoScore. Built for the Financial Inclusion Hackathon.
          </p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className="text-emerald-500 opacity-50">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
