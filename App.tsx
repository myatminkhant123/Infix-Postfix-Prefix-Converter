
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Visualization State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'table' | 'code'>('visualizer');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dsa_lab_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dsa_lab_history', JSON.stringify(history));
  }, [history]);

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
    
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      analysisText = "Mentor Alert: The API_KEY is missing. Check your configuration!";
      setAiAnalysis(analysisText);
      setIsAnalyzing(false);
      return analysisText;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Explain this DSA algorithm: ${opType}.
        Input: ${inputExpr}, Result: ${data.result}.
        Explain stack LIFO behavior simply for beginners. O(n) complexity. 
        Encourage students. No Markdown characters.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      analysisText = response.text || 'Analysis unavailable.';
      setAiAnalysis(analysisText);
    } catch (e: any) {
      analysisText = `AI Error: ${e.message}`;
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-microchip"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">
                DSA Lab <span className="text-indigo-600">Pro</span>
              </h1>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Stack Visualizer</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>AI Mentorship</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">System Status</span>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-emerald-600">Processing Engine Online</span>
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* Left: Controls & History */}
        <aside className="lg:w-80 shrink-0 space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laboratory Tools</label>
              <select 
                value={operation}
                onChange={(e) => setOperation(e.target.value as OperationType)}
                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold text-sm focus:border-indigo-500 outline-none transition"
              >
                <optgroup label="Conversion Logic">
                  <option value="infixToPostfix">Infix → Postfix</option>
                  <option value="infixToPrefix">Infix → Prefix</option>
                  <option value="postfixToInfix">Postfix → Infix</option>
                  <option value="prefixToInfix">Prefix → Infix</option>
                </optgroup>
                <optgroup label="Mathematical Eval">
                  <option value="evaluatePostfix">Evaluate Postfix</option>
                  <option value="evaluatePrefix">Evaluate Prefix</option>
                </optgroup>
              </select>
              
              <div className="relative group">
                <input 
                  type="text"
                  value={inputExpr}
                  onChange={(e) => setInputExpr(e.target.value)}
                  className="w-full bg-indigo-50/30 border-2 border-indigo-100/50 p-4 rounded-xl text-xl font-mono font-black focus:border-indigo-500 outline-none transition text-indigo-900 pr-12"
                  placeholder="e.g. A+B*C"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200">
                  <i className="fas fa-keyboard"></i>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={isAnalyzing}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-play-circle'}`}></i>
                <span>Process Expression</span>
              </button>
            </div>
          </section>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col h-[400px]">
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Labs</span>
                <i className="fas fa-history text-slate-300"></i>
             </div>
             <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {history.map(record => (
                  <button
                    key={record.id}
                    onClick={() => restoreSession(record)}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 transition group"
                  >
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase mb-1">
                      <span>{record.operation.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{new Date(record.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 truncate">{record.input}</div>
                  </button>
                ))}
                {history.length === 0 && <div className="h-full flex items-center justify-center opacity-20"><i className="fas fa-database text-4xl"></i></div>}
             </div>
          </div>
        </aside>

        {/* Right: Main Visualization */}
        <div className="flex-grow space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
              {['visualizer', 'table', 'code'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-8 flex-grow min-h-[500px]">
              {results ? (
                <>
                  {activeTab === 'visualizer' && (
                    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-500">
                      {/* Token Scrubber */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                         <div className="flex justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Token</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Step {currentStepIdx + 1} of {results.steps.length}</span>
                         </div>
                         <div className="flex gap-2 mb-6">
                            {inputExpr.split('').map((char, i) => (
                              <div 
                                key={i}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg font-mono font-black transition-all duration-300 ${currentStep?.token === char ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}
                              >
                                {char}
                              </div>
                            ))}
                         </div>
                         <div className="flex items-center gap-4">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition">
                              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <input 
                              type="range" 
                              min="0" max={results.steps.length - 1} 
                              value={currentStepIdx} 
                              onChange={(e) => setCurrentStepIdx(parseInt(e.target.value))}
                              className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                         </div>
                      </div>

                      {/* Visual Stack Representation */}
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <i className="fas fa-layer-group"></i> Stack Well (LIFO)
                            </h4>
                            <div className="relative h-64 w-40 mx-auto border-x-4 border-b-4 border-slate-200 rounded-b-3xl bg-slate-50/50 flex flex-col-reverse p-3 gap-2 overflow-hidden shadow-inner">
                               {currentStep?.stack.map((item, i) => (
                                 <div 
                                  key={i} 
                                  className="w-full bg-white border border-indigo-100 py-2 rounded-lg text-center font-mono font-black text-indigo-600 shadow-sm animate-in slide-in-from-top-4 duration-300"
                                 >
                                   {item}
                                 </div>
                               ))}
                               {(!currentStep?.stack || currentStep.stack.length === 0) && (
                                 <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase">Empty</div>
                               )}
                            </div>
                         </div>
                         <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute -right-8 -bottom-8 opacity-10 text-9xl transform rotate-12"><i className="fas fa-terminal"></i></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Current Logic</span>
                            <p className="text-xl font-medium leading-snug">
                              {currentStep?.action}
                            </p>
                            <div className="mt-8 pt-8 border-t border-indigo-800/50">
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Partial Result</span>
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
                          <thead className="bg-slate-50 sticky top-0">
                             <tr>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400">Token</th>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400">Stack</th>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {results.steps.map((s, idx) => (
                               <tr key={idx} className={`hover:bg-slate-50 transition ${idx === currentStepIdx ? 'bg-indigo-50/50' : ''}`}>
                                  <td className="p-4 font-mono font-black text-indigo-600">{s.token}</td>
                                  <td className="p-4 font-mono text-xs">{s.stack.join(' | ')}</td>
                                  <td className="p-4 text-xs font-medium text-slate-500">{s.action}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  )}

                  {activeTab === 'code' && (
                    <div className="animate-in fade-in duration-300 bg-slate-900 rounded-2xl p-6 relative">
                       <div className="absolute top-4 right-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">TS Implementation</div>
                       <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
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
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                     <i className="fas fa-flask text-4xl"></i>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-widest text-[11px]">Ready for experiment</p>
                     <p className="text-xs">Input an expression and click "Process"</p>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Mentor Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <i className="fas fa-robot"></i>
                  </div>
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">AI Mentor Insights</h3>
               </div>
               <div className="text-sm leading-relaxed text-slate-600 min-h-[100px]">
                  {isAnalyzing ? (
                    <div className="flex gap-2 items-center text-indigo-400 font-bold text-xs animate-pulse">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                      Mentor is thinking...
                    </div>
                  ) : aiAnalysis ? formatText(aiAnalysis) : "Waiting for results to analyze..."}
               </div>
            </div>
            
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-5 text-7xl"><i className="fas fa-chart-line"></i></div>
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-6">Complexity Report</h3>
               <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Time</span>
                    <div className="text-3xl font-black text-indigo-400">O(N)</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Space</span>
                    <div className="text-3xl font-black text-emerald-400">O(N)</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t border-slate-100 bg-white">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Algorithm Mastery Lab • 2025</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; width: 18px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
          border: 3px solid white;
        }
      `}</style>
    </div>
  );
};

export default App;
