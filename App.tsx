
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  infixToPostfix, infixToPrefix, 
  postfixToInfix, postfixToPrefix,
  prefixToInfix, prefixToPostfix,
  evaluatePostfix, evaluatePrefix 
} from './logic/algorithms';

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
  const [results, setResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleProcess = () => {
    let data;
    switch(operation) {
      case 'infixToPostfix': data = infixToPostfix(inputExpr); break;
      case 'infixToPrefix': data = infixToPrefix(inputExpr); break;
      case 'postfixToInfix': data = postfixToInfix(inputExpr); break;
      case 'postfixToPrefix': data = postfixToPrefix(inputExpr); break;
      case 'prefixToInfix': data = prefixToInfix(inputExpr); break;
      case 'prefixToPostfix': data = prefixToPostfix(inputExpr); break;
      case 'evaluatePostfix': data = evaluatePostfix(inputExpr); break;
      case 'evaluatePrefix': data = evaluatePrefix(inputExpr); break;
    }
    setResults(data);
    analyzeWithAI(data, operation);
  };

  const analyzeWithAI = async (data: any, opType: OperationType) => {
    setIsAnalyzing(true);
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
      setAiAnalysis(response.text || 'Analysis unavailable.');
    } catch (e) {
      setAiAnalysis('Oops! Your AI mentor hit a snag. Try processing again?');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isEvaluation = operation.startsWith('evaluate');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg p-6">
        <div className="w-full px-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <i className="fas fa-calculator text-2xl"></i>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Infix ⇄ Postfix ⇄ Prefix Master
            </h1>
            <p className="text-xs text-indigo-100 opacity-90 font-medium">
              The Ultimate DSA Expression Lab
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full p-4 md:p-6 space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-3">
            <i className="fas fa-user-graduate text-blue-500 text-xl"></i>
            <p className="text-blue-800 font-medium">
              Welcome, the students! Select an operation below to see the Power of Stacks in action.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-cog text-indigo-500"></i> Operation
            </h3>
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
              className="w-full border-2 border-gray-100 p-3 rounded-xl outline-indigo-500 bg-gray-50 focus:bg-white transition font-medium"
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

          <div className="col-span-2 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-keyboard text-indigo-500"></i> Expression Input
            </h3>
            <div className="relative">
              <input 
                type="text"
                value={inputExpr}
                onChange={(e) => setInputExpr(e.target.value)}
                className="w-full border-2 border-indigo-50 p-4 rounded-2xl text-2xl font-mono focus:border-indigo-400 outline-none transition shadow-inner bg-indigo-50/30"
              />
            </div>
            <button 
              onClick={handleProcess}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              <i className="fas fa-play"></i> Run Algorithm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-list-ol text-indigo-500"></i> Execution Steps
              </h3>
              {results && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final:</span>
                  <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black shadow-sm">
                    {results.result}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-grow max-h-[600px] overflow-y-auto custom-scrollbar">
              {!results ? (
                <div className="p-20 text-center text-gray-400">
                  <i className="fas fa-code text-5xl mb-4 block opacity-20"></i>
                  <p>Awaiting input for the {operation.replace(/([A-Z])/g, ' $1').toLowerCase()} lab...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-indigo-50/50 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="p-4 border-b text-[10px] font-black uppercase text-indigo-400 tracking-widest">Token</th>
                      <th className="p-4 border-b text-[10px] font-black uppercase text-indigo-400 tracking-widest">Stack</th>
                      <th className="p-4 border-b text-[10px] font-black uppercase text-indigo-400 tracking-widest">{isEvaluation ? 'Top Val' : 'Output'}</th>
                      <th className="p-4 border-b text-[10px] font-black uppercase text-indigo-400 tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.steps.map((step: any, idx: number) => (
                      <tr key={idx} className="group hover:bg-indigo-50/30 transition border-b border-gray-50">
                        <td className="p-4 font-mono font-black text-indigo-600">{step.token}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {step.stack.map((s: any, i: number) => (
                              <span key={i} className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold text-gray-600 truncate max-w-[150px]">
                          {isEvaluation ? step.stack.slice(-1)[0] : step.output || '-'}
                        </td>
                        <td className="p-4 text-[12px] text-gray-500 font-medium">
                          {step.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-fit lg:sticky lg:top-8 overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fas fa-brain"></i>
                <h3 className="font-bold">DSA Analysis</h3>
              </div>
              {isAnalyzing && <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />}
            </div>
            
            <div className="p-6 text-sm leading-relaxed text-gray-600 min-h-[300px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="font-bold text-gray-400">Consulting Mentor...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm prose-indigo">
                  {formatText(aiAnalysis)}
                </div>
              ) : (
                <div className="text-center py-10 opacity-30 italic">
                  Run an operation to see the analysis.
                </div>
              )}
            </div>

            {aiAnalysis && (
              <div className="p-5 bg-indigo-50 border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Algorithm Performance</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Time</div>
                    <div className="text-lg font-black text-indigo-600">O(N)</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Space</div>
                    <div className="text-lg font-black text-indigo-600">O(N)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white text-gray-400 p-8 text-center text-xs border-t border-gray-100 mt-auto">
        <p className="font-medium uppercase tracking-widest">The Expression Lab | Professional DSA Portfolio Piece</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
