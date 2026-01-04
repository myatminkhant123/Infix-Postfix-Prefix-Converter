
export const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3
};

export const ASSOCIATIVITY: Record<string, 'L' | 'R'> = {
  '+': 'L',
  '-': 'L',
  '*': 'L',
  '/': 'L',
  '^': 'R'
};

export const isOperator = (c: string) => /^[+\-*/^]$/.test(c);
export const isOperand = (c: string) => /^[a-zA-Z0-9]$/.test(c);
