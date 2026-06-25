// Binary calculator utilities.

export type BitOp = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'NOT_A' | 'NOT_B' | 'LEFT_SHIFT' | 'RIGHT_SHIFT' | 'ADD' | 'SUBTRACT';

export interface BinaryResult {
  binary: string;
  decimal: string;
  hex: string;
  octal: string;
  bits: number;
}

export function toBinary(n: bigint, bits = 0): string {
  if (n < 0n) {
    // Two's complement representation
    const mask = (1n << BigInt(Math.max(bits, 32))) - 1n;
    const masked = n & mask;
    return masked.toString(2).padStart(Math.max(bits, 32), '0');
  }
  if (bits > 0) return n.toString(2).padStart(bits, '0');
  return n === 0n ? '0' : n.toString(2);
}

export function describeResult(n: bigint, bits = 0): BinaryResult {
  const safeBits = bits > 0 ? bits : Math.max(n.toString(2).length, 1);
  return {
    binary: toBinary(n, safeBits),
    decimal: n.toString(10),
    hex: n.toString(16).toUpperCase(),
    octal: n.toString(8),
    bits: safeBits,
  };
}

/** Parse a value string in any base (2/8/10/16) into a BigInt. */
export function parseValue(input: string, base: 2 | 8 | 10 | 16): bigint | null {
  if (!input.trim()) return null;
  const cleaned = input.trim().replace(/\s+/g, '');
  try {
    if (base === 10) {
      if (!/^-?\d+$/.test(cleaned)) return null;
      return BigInt(cleaned);
    }
    // For non-decimal bases, we only allow positive numbers (no sign handling for simplicity).
    const sign = cleaned.startsWith('-') ? -1n : 1n;
    const digits = sign === -1n ? cleaned.slice(1) : cleaned;
    const valid: Record<number, string> = { 2: '^[01]+$', 8: '^[0-7]+$', 16: '^[0-9a-fA-F]+$' };
    if (!new RegExp(valid[base]).test(digits)) return null;
    return sign * BigInt(`0${base === 16 ? 'x' : base === 8 ? 'o' : 'b'}${digits}`);
  } catch {
    return null;
  }
}

export function applyBinaryOp(a: bigint, b: bigint, op: BitOp, bits: number): bigint {
  const mask = bits > 0 ? (1n << BigInt(bits)) - 1n : null;
  const wrap = (n: bigint): bigint => {
    if (mask === null) return n;
    if (n < 0n) return ((n % (mask + 1n)) + (mask + 1n)) % (mask + 1n);
    return n & mask;
  };

  switch (op) {
    case 'AND':
      return wrap(a & b);
    case 'OR':
      return wrap(a | b);
    case 'XOR':
      return wrap(a ^ b);
    case 'NAND':
      return wrap(~(a & b));
    case 'NOR':
      return wrap(~(a | b));
    case 'XNOR':
      return wrap(~(a ^ b));
    case 'NOT_A':
      return wrap(~a);
    case 'NOT_B':
      return wrap(~b);
    case 'LEFT_SHIFT':
      return wrap(a << (b < 0n ? 0n : b));
    case 'RIGHT_SHIFT':
      return a >> (b < 0n ? 0n : b);
    case 'ADD':
      return wrap(a + b);
    case 'SUBTRACT':
      return wrap(a - b);
    default:
      return 0n;
  }
}

export interface BinaryOperationInfo {
  op: BitOp;
  symbol: string;
  label: string;
  description: string;
  unary?: boolean;
}

export const BINARY_OPERATIONS: BinaryOperationInfo[] = [
  { op: 'AND', symbol: '&', label: 'AND', description: 'Bitwise AND — 1 only where both bits are 1' },
  { op: 'OR', symbol: '|', label: 'OR', description: 'Bitwise OR — 1 where at least one bit is 1' },
  { op: 'XOR', symbol: '^', label: 'XOR', description: 'Exclusive OR — 1 where bits differ' },
  { op: 'NAND', symbol: '~&', label: 'NAND', description: 'AND then NOT' },
  { op: 'NOR', symbol: '~|', label: 'NOR', description: 'OR then NOT' },
  { op: 'XNOR', symbol: '~^', label: 'XNOR', description: 'XOR then NOT — 1 where bits match' },
  { op: 'NOT_A', symbol: '~A', label: 'NOT A', description: 'Bitwise NOT of A', unary: true },
  { op: 'NOT_B', symbol: '~B', label: 'NOT B', description: 'Bitwise NOT of B', unary: true },
  { op: 'LEFT_SHIFT', symbol: '<<', label: 'A << B', description: 'Shift A left by B bits' },
  { op: 'RIGHT_SHIFT', symbol: '>>', label: 'A >> B', description: 'Shift A right by B bits' },
  { op: 'ADD', symbol: '+', label: 'A + B', description: 'Binary addition' },
  { op: 'SUBTRACT', symbol: '-', label: 'A - B', description: 'Binary subtraction (two\'s complement)' },
];
