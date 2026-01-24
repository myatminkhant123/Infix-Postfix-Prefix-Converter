
/**
 * Manual Stack Implementation
 * Following DSA principles for a Last-In-First-Out (LIFO) structure.
 */
export class Stack<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  // Push element to top
  push(element: T): void {
    this.items.push(element);
  }

  // Remove and return top element
  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items.pop();
  }

  // Return top element without removing
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  // Check if stack is empty
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Size of stack
  size(): number {
    return this.items.length;
  }

  // Return items as array (for visualization)
  toArray(): T[] {
    return [...this.items];
  }
}
