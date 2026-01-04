
import { Stack } from './stack';
import { PRECEDENCE, ASSOCIATIVITY, isOperator, isOperand } from './constants';
import { Step, EvaluationStep } from '../types';

/**
 * Shunting-Yard Algorithm: Infix to Postfix
 */
export const infixToPostfix = (expression: string): { steps: Step[], result: string } => {
  const steps: Step[] = [];
  const stack = new Stack<string>();
  let output = "";
  const tokens = expression.replace(/\s+/g, '').split('');

  tokens.forEach(token => {
    let action = "";
    if (isOperand(token)) {
      output += token;
      action = `Operand '${token}' added to output`;
    } else if (token === '(') {
      stack.push(token);
      action = `Left paren pushed to stack`;
    } else if (token === ')') {
      action = `Right paren: popping until '('`;
      while (!stack.isEmpty() && stack.peek() !== '(') {
        output += stack.pop();
      }
      stack.pop();
    } else if (isOperator(token)) {
      while (
        !stack.isEmpty() &&
        stack.peek() !== '(' &&
        (
          PRECEDENCE[stack.peek()!] > PRECEDENCE[token] ||
          (PRECEDENCE[stack.peek()!] === PRECEDENCE[token] && ASSOCIATIVITY[token] === 'L')
        )
      ) {
        output += stack.pop();
      }
      stack.push(token);
      action = `Operator '${token}' processed (precedence check)`;
    }
    
    steps.push({ token, stack: stack.toArray(), output, action });
  });

  while (!stack.isEmpty()) {
    const op = stack.pop()!;
    output += op;
    steps.push({ token: 'EOF', stack: stack.toArray(), output, action: `Popping remaining '${op}'` });
  }

  return { steps, result: output };
};

/**
 * Infix to Prefix
 */
export const infixToPrefix = (expression: string): { steps: Step[], result: string } => {
  const reversed = expression.split('').reverse().map(c => {
    if (c === '(') return ')';
    if (c === ')') return '(';
    return c;
  }).join('');

  const { steps, result: postfixOfReversed } = infixToPostfix(reversed);
  const finalResult = postfixOfReversed.split('').reverse().join('');

  return { 
    steps: [
      { token: 'REVERSE', stack: [], output: reversed, action: 'Step 1: Reverse input and swap brackets' },
      ...steps,
      { token: 'FINAL', stack: [], output: finalResult, action: 'Step 2: Reverse postfix result to get Prefix' }
    ], 
    result: finalResult 
  };
};

/**
 * Postfix to Infix
 */
export const postfixToInfix = (expression: string): { steps: Step[], result: string } => {
  const steps: Step[] = [];
  const stack = new Stack<string>();
  const tokens = expression.replace(/\s+/g, '').split('');

  tokens.forEach(token => {
    let action = "";
    if (isOperand(token)) {
      stack.push(token);
      action = `Push operand '${token}'`;
    } else if (isOperator(token)) {
      const op2 = stack.pop();
      const op1 = stack.pop();
      const combined = `(${op1}${token}${op2})`;
      stack.push(combined);
      action = `Pop '${op2}', '${op1}'; Push '${combined}'`;
    }
    steps.push({ token, stack: stack.toArray(), output: stack.peek() || "", action });
  });

  return { steps, result: stack.peek() || "" };
};

/**
 * Prefix to Infix
 */
export const prefixToInfix = (expression: string): { steps: Step[], result: string } => {
  const steps: Step[] = [];
  const stack = new Stack<string>();
  const tokens = expression.replace(/\s+/g, '').split('').reverse();

  tokens.forEach(token => {
    let action = "";
    if (isOperand(token)) {
      stack.push(token);
      action = `Push operand '${token}'`;
    } else if (isOperator(token)) {
      const op1 = stack.pop();
      const op2 = stack.pop();
      const combined = `(${op1}${token}${op2})`;
      stack.push(combined);
      action = `Pop '${op1}', '${op2}'; Push '${combined}'`;
    }
    steps.push({ token, stack: stack.toArray(), output: stack.peek() || "", action });
  });

  return { steps, result: stack.peek() || "" };
};

/**
 * Postfix to Prefix
 */
export const postfixToPrefix = (expression: string): { steps: Step[], result: string } => {
  const steps: Step[] = [];
  const stack = new Stack<string>();
  const tokens = expression.replace(/\s+/g, '').split('');

  tokens.forEach(token => {
    let action = "";
    if (isOperand(token)) {
      stack.push(token);
      action = `Push operand '${token}'`;
    } else if (isOperator(token)) {
      const op2 = stack.pop();
      const op1 = stack.pop();
      const combined = `${token}${op1}${op2}`;
      stack.push(combined);
      action = `Pop '${op2}', '${op1}'; Push '${combined}'`;
    }
    steps.push({ token, stack: stack.toArray(), output: stack.peek() || "", action });
  });

  return { steps, result: stack.peek() || "" };
};

/**
 * Prefix to Postfix
 */
export const prefixToPostfix = (expression: string): { steps: Step[], result: string } => {
  const steps: Step[] = [];
  const stack = new Stack<string>();
  const tokens = expression.replace(/\s+/g, '').split('').reverse();

  tokens.forEach(token => {
    let action = "";
    if (isOperand(token)) {
      stack.push(token);
      action = `Push operand '${token}'`;
    } else if (isOperator(token)) {
      const op1 = stack.pop();
      const op2 = stack.pop();
      const combined = `${op1}${op2}${token}`;
      stack.push(combined);
      action = `Pop '${op1}', '${op2}'; Push '${combined}'`;
    }
    steps.push({ token, stack: stack.toArray(), output: stack.peek() || "", action });
  });

  return { steps, result: stack.peek() || "" };
};

/**
 * Postfix Evaluation
 */
export const evaluatePostfix = (expression: string): { steps: EvaluationStep[], result: number } => {
  const steps: EvaluationStep[] = [];
  const stack = new Stack<number>();
  const tokens = expression.replace(/\s+/g, '').split('');

  tokens.forEach(token => {
    let action = "";
    if (!isNaN(parseInt(token))) {
      stack.push(parseInt(token));
      action = `Push operand ${token}`;
    } else if (isOperator(token)) {
      const b = stack.pop()!;
      const a = stack.pop()!;
      let res = 0;
      switch (token) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/': res = a / b; break;
        case '^': res = Math.pow(a, b); break;
      }
      stack.push(res);
      action = `Pop ${b}, ${a}; Compute ${a}${token}${b}=${res}; Push ${res}`;
    }
    steps.push({ token, stack: stack.toArray(), action });
  });

  return { steps, result: stack.peek() || 0 };
};

/**
 * Prefix Evaluation
 */
export const evaluatePrefix = (expression: string): { steps: EvaluationStep[], result: number } => {
  const reversed = expression.replace(/\s+/g, '').split('').reverse().join('');
  const steps: EvaluationStep[] = [];
  const stack = new Stack<number>();
  
  reversed.split('').forEach(token => {
    let action = "";
    if (!isNaN(parseInt(token))) {
      stack.push(parseInt(token));
      action = `Push operand ${token}`;
    } else if (isOperator(token)) {
      const a = stack.pop()!;
      const b = stack.pop()!;
      let res = 0;
      switch (token) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/': res = a / b; break;
        case '^': res = Math.pow(a, b); break;
      }
      stack.push(res);
      action = `Pop ${a}, ${b}; Compute ${a}${token}${b}=${res}; Push ${res}`;
    }
    steps.push({ token, stack: stack.toArray(), action });
  });

  return { steps, result: stack.peek() || 0 };
};
