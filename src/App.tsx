/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  RefreshCw,
  BrainCircuit,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type as SchemaType } from "@google/genai";

// --- Constants & Types ---

type RiskLevel = 'Low' | 'Medium' | 'High';

type IconKey = 'Search' | 'AlertTriangle' | 'CheckCircle2' | 'AlertCircle' | 'Info' | 'BarChart3' | 'Zap' | 'Type' | 'MessageSquareWarning' | 'ShieldAlert';

interface Finding {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  iconKey: IconKey;
}

interface AnalysisResult {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  findings: Finding[];
  aiReasoning?: string;
}

const ICON_MAP: Record<IconKey, React.ReactNode> = {
  Search: <Search className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
  AlertCircle: <AlertCircle className="w-4 h-4" />,
  Info: <Info className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Type: <Type className="w-4 h-4" />,
  MessageSquareWarning: <MessageSquareWarning className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
};

// --- AI Analysis Logic ---

const analyzeHeadlineWithAI = async (headline: string): Promise<AnalysisResult> => {
  if (!headline.trim()) {
    return { score: 0, riskLevel: 'Low', findings: [] };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please configure GEMINI_API_KEY.");
  }

  const genAI = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are an expert misinformation analyst and media literacy specialist. 
Analyze news headlines for linguistic markers, logical fallacies, sensationalism, and potential for misinformation.
Be critical but fair. Even if a headline is factually true, if it is framed in a highly misleading or sensationalist way, it should receive a higher risk score.
If a headline makes an extraordinary claim without context, it is high risk.
Return the analysis in a structured JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this headline: "${headline}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: {
              type: SchemaType.NUMBER,
              description: "A score from 0 to 100 representing the probability of being fake, misleading, or sensationalized. 100 is most likely fake/misleading.",
            },
            riskLevel: {
              type: SchemaType.STRING,
              description: "One of: Low, Medium, High",
            },
            findings: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  severity: { type: SchemaType.STRING, description: "low, medium, or high" },
                  iconKey: { 
                    type: SchemaType.STRING, 
                    description: "One of: AlertTriangle, AlertCircle, BarChart3, Zap, Type, MessageSquareWarning, ShieldAlert" 
                  },
                },
                required: ["title", "description", "severity", "iconKey"],
              },
            },
            aiReasoning: {
              type: SchemaType.STRING,
              description: "A brief 1-2 sentence summary of why this score was given.",
            },
          },
          required: ["score", "riskLevel", "findings", "aiReasoning"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback to a generic error result if the API fails
    return {
      score: 50,
      riskLevel: 'Medium',
      findings: [{
        title: "Analysis Interrupted",
        description: "We couldn't reach the AI analyst. This score is a placeholder.",
        severity: 'medium',
        iconKey: 'AlertCircle'
      }],
      aiReasoning: "The automated analysis encountered an error. Please try again."
    };
  }
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
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!headline.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const analysis = await analyzeHeadlineWithAI(headline);
      setResult(analysis);
    } catch (err) {
      setError("Failed to analyze headline. Please check your connection.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setHeadline('');
    setResult(null);
    setError(null);
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
            <BrainCircuit className="w-8 h-8 text-white" />
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
            Powered by Gemini AI to analyze linguistic patterns, logical fallacies, and sensationalism in news headlines.
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

          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

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
                  AI is Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze with AI
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
                      <span className="text-4xl font-bold">{Math.round(result.score)}%</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Probability</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                      <h2 className="text-2xl font-bold">AI Analysis Summary</h2>
                      <div className="flex justify-center md:justify-start">
                        <RiskBadge level={result.riskLevel} />
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic mb-4">
                      "{result.aiReasoning}"
                    </p>
                    <p className="text-slate-500 text-sm">
                      {result.riskLevel === 'Low' && "The AI found few markers of misinformation. This headline appears relatively balanced."}
                      {result.riskLevel === 'Medium' && "The AI detected some concerning patterns. Use caution and cross-reference this information."}
                      {result.riskLevel === 'High' && "The AI flagged significant issues with this headline's framing or content. High likelihood of being misleading."}
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
                        finding.severity === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        {ICON_MAP[finding.iconKey] || <AlertCircle className="w-4 h-4" />}
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
                      <p className="text-sm text-emerald-700">The AI didn't find any obvious linguistic or logical markers of fake news.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Note:</strong> This tool uses Gemini AI to analyze linguistic and logical patterns. While more advanced than simple keyword matching, it is not a definitive fact-checker. AI can make mistakes. Always verify news from multiple reputable sources.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          <p>© 2026 Fake News Probability Checker • Enhanced with Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}
