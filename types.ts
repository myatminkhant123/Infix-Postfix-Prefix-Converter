
export type ExpressionType = 'infix' | 'postfix' | 'prefix';

export interface Step {
  token: string;
  stack: string[];
  output: string;
  action: string;
}

export interface EvaluationStep {
  token: string;
  stack: number[];
  action: string;
}

export interface AlgorithmResult {
  steps: Step[] | EvaluationStep[];
  result: string | number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  operation: string;
  input: string;
  result: string | number;
  data: AlgorithmResult;
  aiAnalysis?: string;
}
