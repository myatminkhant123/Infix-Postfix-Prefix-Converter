
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
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

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('dsa_lab_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('dsa_lab_history', JSON.stringify(history));
  }, [history]);

  const handleProcess = async () => {
    let data: AlgorithmResult;
    switch(operation) {
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
    const analysis = await analyzeWithAI(data, operation);
    
    // Add to history
    const newRecord: HistoryRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      operation,
      input: inputExpr,
      result: data.result,
      data: data,
      aiAnalysis: analysis
    };
    
    setHistory(prev => [newRecord, ...prev].slice(0, 20)); // Keep last 20
  };

  const analyzeWithAI = async (data: any, opType: OperationType): Promise<string> => {
    setIsAnalyzing(true);
    let analysisText = "";
    
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      analysisText = "Mentor Alert: The API_KEY is missing. Please check your configuration!";
      setAiAnalysis(analysisText);
      setIsAnalyzing(false);
      return analysisText;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Explain the steps taken in this DSA algorithm: ${opType}.
        Input: ${inputExpr}
        Result: ${data.result}
        Focus on explaining how the stack was used (pushing operands vs popping for operators), the logic behind the specific conversion/evaluation, and the O(n) complexity.
        Address the readers as "the students" and keep it very encouraging.
        Do not use any Markdown symbols like #, *, or _ in your response.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      analysisText = response.text || 'Analysis unavailable.';
      setAiAnalysis(analysisText);
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      analysisText = `Oops! Your AI mentor hit a snag: ${e.message || 'Unknown Error'}.`;
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
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your lab history?")) {
      setHistory([]);
      localStorage.removeItem('dsa_lab_history');
    }
  };

  const isEvaluation = operation.startsWith('evaluate');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-xl p-4 md:p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
              <i className="fas fa-layer-group text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">
                Expression Lab <span className="text-indigo-200">2.0</span>
              </h1>
              <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest opacity-80">
                Advanced Stack Visualization & AI Mentorship
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter bg-black/10 px-4 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live Engine Active
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: History */}
        <aside className="lg:w-72 shrink-0 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <i className="fas fa-history text-indigo-500"></i> Lab Archive
              </h3>
              <button 
                onClick={clearHistory}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 transition uppercase tracking-tighter"
              >
                Clear
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="py-10 text-center opacity-40">
                  <i className="fas fa-flask-vial text-3xl mb-3"></i>
                  <p className="text-[10px] font-bold uppercase">No records yet</p>
                </div>
              ) : (
                history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => restoreSession(record)}
                    className="w-full text-left p-3 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-indigo-500 truncate uppercase">
                        {record.operation.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 truncate mb-1">
                      {record.input}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-300 uppercase">Res:</span>
                      <span className="text-[10px] font-black text-green-600 truncate">{record.result}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl transform rotate-12 transition group-hover:scale-110">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <i className="fas fa-lightbulb text-yellow-400"></i> Mentor Tip
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Stacks are LIFO. Remember that operator precedence determines when we pop from the stack to the output!
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow space-y-8">
          {/* Controls */}
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Algorithm</label>
              <select 
                value={operation}
                onChange={(e) => {
                  setOperation(e.target.value as OperationType);
                  if (e.target.value.includes('Postfix') || e.target.value.includes('Prefix')) {
                      if (e.target.value.startsWith('evaluate')) setInputExpr('234*+');
                      else if (e.target.value.startsWith('postfix')) setInputExpr('ABC*+');
                      else if (e.target.value.startsWith('prefix')) setInputExpr('+A*BC');
                  } else {
                      setInputExpr('A+B*C');
                  }
                }}
                className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-indigo-500 bg-slate-50/50 focus:bg-white transition font-bold text-slate-700 shadow-sm"
              >
                <optgroup label="Converters">
                  <option value="infixToPostfix">Infix → Postfix</option>
                  <option value="infixToPrefix">Infix → Prefix</option>
                  <option value="postfixToInfix">Postfix → Infix</option>
                  <option value="postfixToPrefix">Postfix → Prefix</option>
                  <option value="prefixToInfix">Prefix → Infix</option>
                  <option value="prefixToPostfix">Prefix → Postfix</option>
                </optgroup>
                <optgroup label="Evaluators">
                  <option value="evaluatePostfix">Postfix Evaluation</option>
                  <option value="evaluatePrefix">Prefix Evaluation</option>
                </optgroup>
              </select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expression Input</label>
              <div className="flex gap-4">
                <input 
                  type="text"
                  value={inputExpr}
                  onChange={(e) => setInputExpr(e.target.value)}
                  placeholder="Enter expression..."
                  className="flex-grow border-2 border-indigo-50 p-4 rounded-2xl text-2xl font-mono font-black focus:border-indigo-400 outline-none transition shadow-inner bg-indigo-50/20 text-indigo-900"
                />
                <button 
                  onClick={handleProcess}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 text-white font-black px-8 rounded-2xl hover:bg-indigo-700 active:scale-95 transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
                  <span className="hidden md:inline">Run</span>
                </button>
              </div>
            </div>
          </section>

          {/* Results Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Table Area */}
            <div className="xl:col-span-3 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
              <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <i className="fas fa-project-diagram text-indigo-500"></i> Execution Steps
                </h3>
                {results && (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Result:</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-black shadow-sm border border-green-200">
                        {results.result}
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(String(results.result))}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        title="Copy result"
                      >
                        <i className="far fa-copy"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-grow max-h-[600px] overflow-y-auto custom-scrollbar">
                {!results ? (
                  <div className="p-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fas fa-terminal text-3xl text-slate-200"></i>
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Awaiting your first lab operation...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                      <tr>
                        <th className="p-4 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">Token</th>
                        <th className="p-4 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">Stack State</th>
                        <th className="p-4 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">{isEvaluation ? 'Computed' : 'Output'}</th>
                        <th className="p-4 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">Action Logic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.steps.map((step: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-indigo-50/20 transition">
                          <td className="p-4 font-mono font-black text-indigo-600">{step.token}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {step.stack.length === 0 ? (
                                <span className="text-[9px] text-slate-300 italic">Empty</span>
                              ) : (
                                step.stack.map((s: any, i: number) => (
                                  <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${typeof s === 'number' ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-indigo-600 border-indigo-700 text-white'}`}>
                                    {s}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono font-black text-slate-600">
                            <div className="truncate max-w-[120px]">
                              {isEvaluation ? step.stack.slice(-1)[0] ?? '-' : step.output || '-'}
                            </div>
                          </td>
                          <td className="p-4 text-[11px] text-slate-500 font-medium leading-tight">
                            {step.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* AI Analysis Area */}
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col h-fit overflow-hidden">
                <div className="bg-indigo-700 p-5 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-robot text-xl"></i>
                    <h3 className="font-black text-[11px] uppercase tracking-widest">AI Mentor Analysis</h3>
                  </div>
                  {isAnalyzing && <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />}
                </div>
                
                <div className="p-8 text-sm leading-relaxed text-slate-600 min-h-[300px]">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-50 border-t-indigo-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-brain text-indigo-200 text-xl animate-pulse"></i>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-1">Synthesizing Logic</p>
                        <p className="text-xs text-slate-400">Reviewing stack frames...</p>
                      </div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="prose prose-sm prose-indigo animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {formatText(aiAnalysis)}
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                      <i className="fas fa-comment-slash text-4xl"></i>
                      <p className="text-[10px] font-black uppercase tracking-tighter">No analysis available yet</p>
                    </div>
                  )}
                </div>

                {aiAnalysis && (
                  <div className="p-6 bg-slate-50 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Time Complexity</div>
                        <div className="text-xl font-black text-indigo-600">O(N)</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Space Complexity</div>
                        <div className="text-xl font-black text-indigo-600">O(N)</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white text-slate-400 py-10 px-8 text-center border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            Professional DSA Portfolio Tool • Created for Mastery
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-indigo-600 transition"><i className="fab fa-github"></i></a>
            <a href="#" className="hover:text-indigo-600 transition"><i className="fab fa-linkedin"></i></a>
            <a href="#" className="hover:text-indigo-600 transition"><i className="fas fa-globe"></i></a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
