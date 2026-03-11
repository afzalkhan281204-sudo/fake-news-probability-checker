/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  BarChart3, 
  Zap, 
  Type, 
  MessageSquareWarning,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

type RiskLevel = 'Low' | 'Medium' | 'High';

interface AnalysisResult {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  findings: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    icon: React.ReactNode;
  }[];
}

const CLICKBAIT_WORDS = [
  'SHOCKING', 'UNBELIEVABLE', 'MUST SEE', 'YOU WON\'T BELIEVE', 'AMAZING', 
  'SECRET', 'HIDDEN', 'TRUTH', 'FINALLY REVEALED', 'URGENT', 'BREAKING',
  'SCANDAL', 'MIRACLE', 'CURE', 'INSTANT', 'GUARANTEED', 'WARNING'
];

const EMOTIONAL_WORDS = [
  'OUTRAGE', 'HORRIBLE', 'TERRIBLE', 'DISASTER', 'CHAOS', 'FEAR', 'PANIC',
  'HATE', 'ANGRY', 'FURIOUS', 'DEVASTATING', 'HEARTBREAKING', 'TRAGEDY'
];

// --- Helper Functions ---

const analyzeHeadline = (headline: string): AnalysisResult => {
  if (!headline.trim()) {
    return { score: 0, riskLevel: 'Low', findings: [] };
  }

  const findings: AnalysisResult['findings'] = [];
  let score = 0;

  // 1. Suspicious Capitalization
  const words = headline.split(/\s+/);
  const allCapsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && !/^[0-9]+$/.test(w));
  if (allCapsWords.length > 0) {
    const severity = allCapsWords.length > 2 ? 'high' : 'medium';
    score += severity === 'high' ? 25 : 15;
    findings.push({
      title: 'Suspicious Capitalization',
      description: `Found ${allCapsWords.length} word(s) in ALL CAPS. This is often used to grab attention aggressively.`,
      severity,
      icon: <Type className="w-4 h-4" />
    });
  }

  // 2. Excessive Punctuation
  const excessivePunctuation = (headline.match(/[!?]{2,}/g) || []).length;
  if (excessivePunctuation > 0) {
    score += 20;
    findings.push({
      title: 'Excessive Punctuation',
      description: 'Multiple exclamation or question marks detected. This is a common trait of sensationalist content.',
      severity: 'medium',
      icon: <AlertCircle className="w-4 h-4" />
    });
  }

  // 3. Clickbait & Emotional Words
  const upperHeadline = headline.toUpperCase();
  const foundClickbait = CLICKBAIT_WORDS.filter(word => upperHeadline.includes(word));
  const foundEmotional = EMOTIONAL_WORDS.filter(word => upperHeadline.includes(word));

  if (foundClickbait.length > 0) {
    score += Math.min(foundClickbait.length * 10, 30);
    findings.push({
      title: 'Clickbait Language',
      description: `Detected phrases like: ${foundClickbait.slice(0, 3).join(', ')}. These are designed to manipulate curiosity.`,
      severity: foundClickbait.length > 2 ? 'high' : 'medium',
      icon: <Zap className="w-4 h-4" />
    });
  }

  if (foundEmotional.length > 0) {
    score += Math.min(foundEmotional.length * 8, 25);
    findings.push({
      title: 'Emotional Manipulation',
      description: 'Headline uses highly charged emotional language to provoke a reaction rather than inform.',
      severity: 'medium',
      icon: <MessageSquareWarning className="w-4 h-4" />
    });
  }

  // 4. Exaggerated Claims (Superlatives)
  const superlatives = (headline.match(/\b(best|worst|greatest|fastest|cheapest|easiest|only|never|always)\b/gi) || []).length;
  if (superlatives > 2) {
    score += 15;
    findings.push({
      title: 'Exaggerated Claims',
      description: 'Frequent use of superlatives suggests a lack of balanced reporting.',
      severity: 'low',
      icon: <BarChart3 className="w-4 h-4" />
    });
  }

  // Normalize score
  score = Math.min(score, 100);
  
  let riskLevel: RiskLevel = 'Low';
  if (score > 60) riskLevel = 'High';
  else if (score > 30) riskLevel = 'Medium';

  return { score, riskLevel, findings };
};

// --- Components ---

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const colors = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const icons = {
    Low: <CheckCircle2 className="w-4 h-4" />,
    Medium: <AlertCircle className="w-4 h-4" />,
    High: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${colors[level]}`}>
      {icons[level]}
      {level} Risk
    </div>
  );
};

export default function App() {
  const [headline, setHeadline] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    if (!headline.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);

    // Simulate analysis delay
    setTimeout(() => {
      const analysis = analyzeHeadline(headline);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleReset = () => {
    setHeadline('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-6"
          >
            <Search className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-slate-900 mb-3"
          >
            Fake News Probability Checker
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-lg max-w-xl mx-auto"
          >
            Enter a news headline to analyze its linguistic patterns and estimate the likelihood of it being misleading or sensationalized.
          </motion.p>
        </header>

        {/* Input Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
          <div className="relative">
            <textarea
              id="headline-input"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Paste a news headline here..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-lg"
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400">
              {headline.length} characters
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={!headline.trim() || isAnalyzing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-4 px-8 rounded-2xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing Patterns...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze Headline
                </>
              )}
            </button>
            {result && (
              <button
                id="reset-btn"
                onClick={handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-4 px-8 rounded-2xl transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={440}
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * result.score) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`${
                          result.riskLevel === 'Low' ? 'text-emerald-500' :
                          result.riskLevel === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{result.score}%</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Probability</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                      <h2 className="text-2xl font-bold">Analysis Summary</h2>
                      <div className="flex justify-center md:justify-start">
                        <RiskBadge level={result.riskLevel} />
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {result.riskLevel === 'Low' && "This headline appears to follow standard journalistic practices. It lacks common sensationalist markers."}
                      {result.riskLevel === 'Medium' && "Caution advised. This headline contains several elements often found in clickbait or biased reporting."}
                      {result.riskLevel === 'High' && "High probability of misinformation. This headline uses multiple aggressive techniques to manipulate reader perception."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.findings.length > 0 ? (
                  result.findings.map((finding, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex gap-4"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        finding.severity === 'high' ? 'bg-rose-50 text-rose-500' :
                        finding.severity === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {finding.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">{finding.title}</h3>
                        <p className="text-sm text-slate-500 leading-snug">{finding.description}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-emerald-900">No red flags detected</h3>
                      <p className="text-sm text-emerald-700">The headline doesn't contain obvious linguistic markers of fake news.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Note:</strong> This tool uses linguistic analysis to detect patterns common in misinformation. It does not fact-check the actual content or verify the truthfulness of the claims. Always verify news from multiple reputable sources.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          <p>© 2026 Fake News Probability Checker • Built for Media Literacy</p>
        </footer>
      </div>
    </div>
  );
}
