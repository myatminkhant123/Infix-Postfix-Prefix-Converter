import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  infixToPostfix, infixToPrefix,
  postfixToInfix, postfixToPrefix,
  prefixToInfix, prefixToPostfix,
  evaluatePostfix, evaluatePrefix
} from './logic/algorithms';
import { HistoryRecord, AlgorithmResult } from './types';


type OperationType =
  | 'infixToPostfix' | 'infixToPrefix'
  | 'postfixToInfix' | 'postfixToPrefix'
  | 'prefixToInfix' | 'prefixToPostfix'
  | 'evaluatePostfix' | 'evaluatePrefix';

const formatText = (text: string) => {
  const cleanText = text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim();

  return cleanText.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    return <p key={i} className="mb-2">{trimmed}</p>;
  });
};

const App: React.FC = () => {
  const [operation, setOperation] = useState<OperationType>('infixToPostfix');
  const [inputExpr, setInputExpr] = useState('A+B*C');
  const [results, setResults] = useState<AlgorithmResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Visualization State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'table' | 'code'>('visualizer');
  const timerRef = useRef<number | null>(null);




  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const saved = localStorage.getItem('dsa_lab_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dsa_lab_history', JSON.stringify(history));
  }, [history]);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Autoplay Logic
  useEffect(() => {
    if (isPlaying && results) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= results.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, results]);

  const handleProcess = async () => {
    let data: AlgorithmResult;
    switch (operation) {
      case 'infixToPostfix': data = infixToPostfix(inputExpr); break;
      case 'infixToPrefix': data = infixToPrefix(inputExpr); break;
      case 'postfixToInfix': data = postfixToInfix(inputExpr); break;
      case 'postfixToPrefix': data = postfixToPrefix(inputExpr); break;
      case 'prefixToInfix': data = prefixToInfix(inputExpr); break;
      case 'prefixToPostfix': data = prefixToPostfix(inputExpr); break;
      case 'evaluatePostfix': data = evaluatePostfix(inputExpr); break;
      case 'evaluatePrefix': data = evaluatePrefix(inputExpr); break;
      default: return;
    }

    setResults(data);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    const analysis = await analyzeWithAI(data, operation);

    const newRecord: HistoryRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      operation,
      input: inputExpr,
      result: data.result,
      data: data,
      aiAnalysis: analysis
    };

    setHistory(prev => [newRecord, ...prev].slice(0, 20));
  };

  const analyzeWithAI = async (data: any, opType: OperationType): Promise<string> => {
    setIsAnalyzing(true);
    let analysisText = "";

    const apiKeys = (process.env.API_KEY || "").split(',').map(k => k.trim()).filter(k => k);

    if (apiKeys.length === 0) {
      analysisText = "Mentor Alert: No API Keys configured!";
      setAiAnalysis(analysisText);
      setIsAnalyzing(false);
      return analysisText;
    }

    try {
      const prompt = `
        Explain this DSA algorithm: ${opType}.
        Input: ${inputExpr}, Result: ${data.result}.
        Explain stack LIFO behavior simply for beginners. O(n) complexity. 
        Encourage students. No Markdown characters.
      `;

      const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
      let success = false;

      // Retry Loop: Try every key with every model until one works
      outerLoop:
      for (const key of apiKeys) {
        console.log(`Trying API Key: ${key.substring(0, 5)}...`);
        const genAI = new GoogleGenerativeAI(key);

        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            analysisText = response.text();

            if (analysisText) {
              success = true;
              console.log(`Success with Key: ${key.substring(0, 5)}... and Model: ${modelName}`);
              break outerLoop;
            }
          } catch (innerError: any) {
            console.warn(`Failed - Key: ${key.substring(0, 5)}... | Model: ${modelName}`, innerError.message);
            continue;
          }
        }
      }

      if (!success) {
        throw new Error(`All ${apiKeys.length} API keys and ${modelsToTry.length} models failed.`);
      }

      setAiAnalysis(analysisText || 'Analysis unavailable.');
    } catch (e: any) {
      console.error("AI Error Details:", e);
      if (e.message?.includes('503') || e.message?.includes('overloaded')) {
        analysisText = "System Busy: The AI server is overloaded. Please try again in a moment.";
      } else if (e.message?.includes('404') || e.message?.includes('not found')) {
        analysisText = "Action Required: The API Key is valid, but the 'Google Generative AI API' is not enabled or supported in your region. Please go to Google AI Studio > Get API Key and ensure a project is linked.";
      } else {
        if (e.message?.includes("All") && e.message?.includes("failed")) {
          analysisText = "Configuration Error: All API Keys failed (404/Restricted). Please ensure the 'Generative Language API' is ENABLED in your Google Cloud Console for these keys.";
        } else {
          analysisText = `Connection Issue: ${e.message ? e.message.substring(0, 80) : 'Check console'}...`;
        }
      }
      setAiAnalysis(analysisText);
    } finally {
      setIsAnalyzing(false);
    }
    return analysisText;
  };

  const restoreSession = (record: HistoryRecord) => {
    setOperation(record.operation as OperationType);
    setInputExpr(record.input);
    setResults(record.data);
    setAiAnalysis(record.aiAnalysis || '');
    setCurrentStepIdx(record.data.steps.length - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isEvaluation = operation.startsWith('evaluate');
  const currentStep = results?.steps[currentStepIdx];




  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark font-mono bg-[#0a0a0a] text-green-400 selection:bg-green-900 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-indigo-100'}`}>

      {/* Header */}
      <header className="bg-white dark:bg-[#0f0f0f] border-b border-slate-200 dark:border-green-900/30 sticky top-0 z-50 transition-colors">
        <div className="w-full px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${theme === 'dark' ? 'bg-green-600 shadow-green-900/50' : 'bg-indigo-600 shadow-indigo-200'}`}>
              <i className="fas fa-microchip"></i>
            </div>
            {/* Theme Toggle Button (Mobile Position adjusted if needed, currently inline) */}
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-green-500 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 text-center flex items-center gap-3">
            <i className="fas fa-code text-sm opacity-50"></i>
            Infix-Postfix-Prefix-Converter
            <i className="fas fa-code text-sm opacity-50"></i>
          </h1>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-green-900/20 text-slate-600 dark:text-green-400 flex items-center justify-center hover:scale-110 transition border border-transparent dark:border-green-800/50"
              title="Toggle Theme"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[9px] font-bold text-slate-400 dark:text-green-700 uppercase tracking-tighter">System Status</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-green-400">Online</span>
                <span className="w-2 h-2 bg-emerald-500 dark:bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* Left: Controls & History */}
        <aside className="lg:w-80 shrink-0 space-y-8">
          <section className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(0,255,65,0.05)] border border-slate-200 dark:border-green-900/30 space-y-6 transition-colors">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-green-700">Laboratory Tools</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as OperationType)}
                className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-green-900 p-3 rounded-xl font-bold text-sm focus:border-indigo-500 dark:focus:border-green-500 outline-none transition dark:text-green-400"
              >
                <optgroup label="Conversion Logic" className="dark:bg-black">
                  <option value="infixToPostfix">Infix → Postfix</option>
                  <option value="infixToPrefix">Infix → Prefix</option>
                  <option value="postfixToInfix">Postfix → Infix</option>
                  <option value="prefixToInfix">Prefix → Infix</option>
                </optgroup>
                <optgroup label="Mathematical Eval" className="dark:bg-black">
                  <option value="evaluatePostfix">Evaluate Postfix</option>
                  <option value="evaluatePrefix">Evaluate Prefix</option>
                </optgroup>
              </select>

              <div className="relative group">
                <input
                  type="text"
                  value={inputExpr}
                  onChange={(e) => setInputExpr(e.target.value)}
                  className="w-full bg-indigo-50/30 dark:bg-green-900/10 border-2 border-indigo-100/50 dark:border-green-900/50 p-4 rounded-xl text-xl font-mono font-black focus:border-indigo-500 dark:focus:border-green-500 outline-none transition text-indigo-900 dark:text-green-300 pr-12 placeholder:text-slate-300 dark:placeholder:text-green-900"
                  placeholder="e.g. A+B*C"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 dark:text-green-800">
                  <i className="fas fa-keyboard"></i>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={isAnalyzing}
                className={`w-full font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-green-600 text-black hover:bg-green-500 shadow-green-900/30' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-play-circle'}`}></i>
                <span>Process Expression</span>
              </button>
            </div>
          </section>

          <div className="bg-white dark:bg-[#111] rounded-3xl border border-slate-200 dark:border-green-900/30 overflow-hidden flex flex-col h-[400px] transition-colors">
            <div className="p-4 border-b dark:border-green-900/20 bg-slate-50 dark:bg-[#0a0a0a] flex justify-between items-center transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-green-700">Recent Labs</span>
              <i className="fas fa-history text-slate-300 dark:text-green-900"></i>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {history.map(record => (
                <button
                  key={record.id}
                  onClick={() => restoreSession(record)}
                  className="w-full text-left p-3 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-green-800 hover:bg-indigo-50/50 dark:hover:bg-green-900/20 transition group"
                >
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 dark:text-green-600 uppercase mb-1">
                    <span>{record.operation.replace(/([A-Z])/g, ' $1')}</span>
                    <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-green-300 truncate">{record.input}</div>
                </button>
              ))}
              {history.length === 0 && <div className="h-full flex items-center justify-center opacity-20 dark:opacity-50 text-slate-400 dark:text-green-800"><i className="fas fa-database text-4xl"></i></div>}
            </div>
          </div>
        </aside>

        {/* Right: Main Visualization */}
        <div className="flex-grow space-y-6">
          <div className="bg-white dark:bg-[#111] rounded-[2rem] shadow-xl dark:shadow-[0_0_30px_rgba(0,255,65,0.05)] border border-slate-200 dark:border-green-900/30 overflow-hidden flex flex-col transition-colors">
            {/* Tabs */}
            <div className="flex border-b dark:border-green-900/30">
              {['visualizer', 'table', 'code'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                    ? (theme === 'dark' ? 'text-green-400 border-b-2 border-green-500 bg-green-900/10' : 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30')
                    : 'text-slate-400 dark:text-green-800 hover:text-slate-600 dark:hover:text-green-500 hover:bg-slate-50 dark:hover:bg-green-900/5'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={`p-8 flex-grow min-h-[500px] ${theme === 'dark' && 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]'}`}>
              {results ? (
                <>
                  {activeTab === 'visualizer' && (
                    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-500">
                      {/* Token Scrubber */}
                      <div className="bg-slate-50 dark:bg-black/30 p-6 rounded-2xl border border-slate-100 dark:border-green-900/30 backdrop-blur-sm">
                        <div className="flex justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-400 dark:text-green-700 uppercase tracking-widest">Active Token</span>
                          <span className="text-[10px] font-black text-indigo-500 dark:text-green-400 uppercase tracking-widest">Step {currentStepIdx + 1} of {results.steps.length}</span>
                        </div>
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                          {inputExpr.split('').map((char, i) => (
                            <div
                              key={i}
                              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-lg font-mono font-black transition-all duration-300 border ${currentStep?.token === char
                                ? (theme === 'dark' ? 'bg-green-600 text-black border-green-500 scale-110 shadow-lg shadow-green-900/50' : 'bg-indigo-600 text-white scale-110 shadow-lg')
                                : 'bg-white dark:bg-[#151515] text-slate-300 dark:text-green-900 border-slate-100 dark:border-green-900/30'
                                }`}
                            >
                              {char}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition ${theme === 'dark' ? 'bg-green-600 text-black' : 'bg-indigo-600 text-white'}`}>
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <input
                            type="range"
                            min="0" max={results.steps.length - 1}
                            value={currentStepIdx}
                            onChange={(e) => setCurrentStepIdx(parseInt(e.target.value))}
                            className={`flex-grow h-2 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'bg-green-900/50 accent-green-500' : 'bg-slate-200 accent-indigo-600'}`}
                          />
                        </div>
                      </div>

                      {/* Visual Stack Representation */}
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-green-700 uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-layer-group"></i> Stack Well (LIFO)
                          </h4>
                          <div className="relative h-64 w-40 mx-auto border-x-4 border-b-4 border-slate-200 dark:border-green-900/50 rounded-b-3xl bg-slate-50/50 dark:bg-black/20 flex flex-col-reverse p-3 gap-2 overflow-hidden shadow-inner dark:shadow-none">
                            {currentStep?.stack.map((item, i) => (
                              <div
                                key={i}
                                className={`w-full py-2 rounded-lg text-center font-mono font-black border shadow-sm animate-in slide-in-from-top-4 duration-300 ${theme === 'dark'
                                  ? 'bg-[#111] text-green-400 border-green-900/50'
                                  : 'bg-white text-indigo-600 border-indigo-100'
                                  }`}
                              >
                                {item}
                              </div>
                            ))}
                            {(!currentStep?.stack || currentStep.stack.length === 0) && (
                              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase text-slate-400 dark:text-green-800">Empty</div>
                            )}
                          </div>
                        </div>
                        <div className={`${theme === 'dark' ? 'bg-[#050505] border border-green-900/50' : 'bg-indigo-900'} rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center`}>
                          <div className={`absolute -right-8 -bottom-8 opacity-10 text-9xl transform rotate-12 ${theme === 'dark' ? 'text-green-500' : ''}`}><i className="fas fa-terminal"></i></div>
                          <span className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-green-700' : 'text-indigo-400'}`}>Current Logic</span>
                          <p className={`text-xl font-medium leading-snug ${theme === 'dark' ? 'text-green-400 font-mono' : ''}`}>
                            {currentStep?.action}
                          </p>
                          <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-green-900/50' : 'border-indigo-800/50'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-green-700' : 'text-indigo-400'}`}>Partial Result</span>
                            <div className="font-mono text-2xl font-black text-emerald-400">
                              {isEvaluation ? (currentStep as any).stack.slice(-1)[0] || '0' : (currentStep as any).output || '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'table' && (
                    <div className="animate-in fade-in duration-300 max-h-[600px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#1a1a1a] sticky top-0">
                          <tr>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 dark:text-green-700">Token</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 dark:text-green-700">Stack</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 dark:text-green-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-green-900/20">
                          {results.steps.map((s, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-green-900/10 transition ${idx === currentStepIdx ? (theme === 'dark' ? 'bg-green-900/20' : 'bg-indigo-50/50') : ''}`}>
                              <td className={`p-4 font-mono font-black ${theme === 'dark' ? 'text-green-400' : 'text-indigo-600'}`}>{s.token}</td>
                              <td className="p-4 font-mono text-xs dark:text-slate-300">{s.stack.join(' | ')}</td>
                              <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">{s.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'code' && (
                    <div className="animate-in fade-in duration-300 bg-slate-900 dark:bg-[#050505] dark:border dark:border-green-900/30 rounded-2xl p-6 relative">
                      <div className="absolute top-4 right-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">TS Implementation</div>
                      <pre className="text-emerald-400 dark:text-green-400 font-mono text-xs leading-relaxed overflow-x-auto">
                        {`/** 
 * Educational Implementation of ${operation}
 * Time: O(n) | Space: O(n) 
 */
function solve(expr) {
  const stack = [];
  const tokens = expr.split('');
  
  tokens.forEach(token => {
    if (isOperand(token)) {
      // Process operands
    } else if (isOperator(token)) {
      // Logic for precedence check
      while (stack.length && ...) {
        output += stack.pop();
      }
      stack.push(token);
    }
  });
  
  return stack.reverse().join('');
}`}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-green-900/20 text-green-500' : 'bg-slate-50 text-slate-400'}`}>
                    <i className="fas fa-flask text-4xl"></i>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-[11px] dark:text-green-500">Ready for experiment</p>
                    <p className="text-xs dark:text-green-700">Input an expression and click "Process"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Mentor Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 rounded-3xl p-8 border shadow-sm transition-colors ${theme === 'dark' ? 'bg-[#111] border-green-900/30' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <i className="fas fa-robot"></i>
                </div>
                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-green-700">AI Mentor Insights</h3>
              </div>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 min-h-[100px]">
                {isAnalyzing ? (
                  <div className={`flex gap-2 items-center font-bold text-xs animate-pulse ${theme === 'dark' ? 'text-green-400' : 'text-indigo-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-indigo-400'}`}></span>
                    Mentor is thinking...
                  </div>
                ) : aiAnalysis ? formatText(aiAnalysis) : "Waiting for results to analyze..."}
              </div>
            </div>

            <div className={`rounded-3xl p-8 text-white relative overflow-hidden ${theme === 'dark' ? 'bg-[#050505] border border-green-900/50' : 'bg-slate-900'}`}>
              <div className={`absolute -right-4 -bottom-4 opacity-5 text-7xl ${theme === 'dark' ? 'text-green-500' : ''}`}><i className="fas fa-chart-line"></i></div>
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-6">Complexity Report</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Time</span>
                  <div className={`text-3xl font-black ${theme === 'dark' ? 'text-green-400' : 'text-indigo-400'}`}>O(N)</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Space</span>
                  <div className={`text-3xl font-black ${theme === 'dark' ? 'text-green-600' : 'text-emerald-400'}`}>O(N)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={`py-10 text-center border-t transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-green-900/20' : 'bg-white border-slate-100'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-green-900' : 'text-slate-300'}`}>Algorithm Mastery Lab • 2025</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#15803d' : '#e2e8f0'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${theme === 'dark' ? '#0a0a0a' : 'transparent'}; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; width: 18px;
          border-radius: 50%;
          background: ${theme === 'dark' ? '#22c55e' : '#4f46e5'};
          cursor: pointer;
          box-shadow: 0 0 10px ${theme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(79, 70, 229, 0.4)'};
          border: 3px solid ${theme === 'dark' ? '#000' : 'white'};
        }
      `}</style>
    </div>
  );
};

export default App;
