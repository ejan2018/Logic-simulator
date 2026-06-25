// Boolean algebra laws and identities reference data.

export interface BooleanLaw {
  id: string;
  name: string;
  category: 'Identity' | 'Complement' | 'Idempotent' | 'Commutative' | 'Associative' | 'Distributive' | 'Absorption' | 'DeMorgan' | 'Involution' | 'Consensus';
  /** Array of [expression, simplified] pairs. */
  identities: { expression: string; simplified: string; explanation?: string }[];
}

export const BOOLEAN_LAWS: BooleanLaw[] = [
  {
    id: 'identity',
    name: 'Identity Law',
    category: 'Identity',
    identities: [
      { expression: 'A AND 0', simplified: '0', explanation: 'Anything AND-ed with 0 is 0' },
      { expression: 'A OR 1', simplified: '1', explanation: 'Anything OR-ed with 1 is 1' },
      { expression: 'A AND 1', simplified: 'A', explanation: 'AND-ing with 1 keeps the value' },
      { expression: 'A OR 0', simplified: 'A', explanation: 'OR-ing with 0 keeps the value' },
    ],
  },
  {
    id: 'null',
    name: 'Null (Dominance) Law',
    category: 'Identity',
    identities: [
      { expression: 'A AND 0', simplified: '0', explanation: '0 dominates AND' },
      { expression: 'A OR 1', simplified: '1', explanation: '1 dominates OR' },
    ],
  },
  {
    id: 'idempotent',
    name: 'Idempotent Law',
    category: 'Idempotent',
    identities: [
      { expression: 'A AND A', simplified: 'A', explanation: 'A AND itself is just A' },
      { expression: 'A OR A', simplified: 'A', explanation: 'A OR itself is just A' },
    ],
  },
  {
    id: 'complement',
    name: 'Complement Law',
    category: 'Complement',
    identities: [
      { expression: 'A AND NOT A', simplified: '0', explanation: 'A variable AND its complement is always 0' },
      { expression: 'A OR NOT A', simplified: '1', explanation: 'A variable OR its complement is always 1' },
    ],
  },
  {
    id: 'involution',
    name: 'Involution (Double Negation) Law',
    category: 'Involution',
    identities: [
      { expression: 'NOT (NOT A)', simplified: 'A', explanation: 'Two NOTs cancel out' },
    ],
  },
  {
    id: 'commutative',
    name: 'Commutative Law',
    category: 'Commutative',
    identities: [
      { expression: 'A AND B', simplified: 'B AND A', explanation: 'Order does not matter for AND' },
      { expression: 'A OR B', simplified: 'B OR A', explanation: 'Order does not matter for OR' },
    ],
  },
  {
    id: 'associative',
    name: 'Associative Law',
    category: 'Associative',
    identities: [
      { expression: '(A AND B) AND C', simplified: 'A AND (B AND C)', explanation: 'Grouping does not matter for AND' },
      { expression: '(A OR B) OR C', simplified: 'A OR (B OR C)', explanation: 'Grouping does not matter for OR' },
    ],
  },
  {
    id: 'distributive',
    name: 'Distributive Law',
    category: 'Distributive',
    identities: [
      { expression: 'A AND (B OR C)', simplified: '(A AND B) OR (A AND C)', explanation: 'AND distributes over OR' },
      { expression: 'A OR (B AND C)', simplified: '(A OR B) AND (A OR C)', explanation: 'OR distributes over AND' },
    ],
  },
  {
    id: 'absorption',
    name: 'Absorption Law',
    category: 'Absorption',
    identities: [
      { expression: 'A AND (A OR B)', simplified: 'A', explanation: 'A absorbs (A OR B)' },
      { expression: 'A OR (A AND B)', simplified: 'A', explanation: 'A absorbs (A AND B)' },
      { expression: 'A AND (NOT A OR B)', simplified: 'A AND B', explanation: 'Variant of absorption' },
      { expression: 'A OR (NOT A AND B)', simplified: 'A OR B', explanation: 'Variant of absorption' },
    ],
  },
  {
    id: 'demorgan',
    name: "De Morgan's Law",
    category: 'DeMorgan',
    identities: [
      { expression: 'NOT (A AND B)', simplified: '(NOT A) OR (NOT B)', explanation: 'NOT of AND becomes OR of NOTs' },
      { expression: 'NOT (A OR B)', simplified: '(NOT A) AND (NOT B)', explanation: 'NOT of OR becomes AND of NOTs' },
    ],
  },
  {
    id: 'consensus',
    name: 'Consensus Theorem',
    category: 'Consensus',
    identities: [
      { expression: '(A AND B) OR (NOT A AND C) OR (B AND C)', simplified: '(A AND B) OR (NOT A AND C)', explanation: 'The consensus term is redundant' },
      { expression: '(A OR B) AND (NOT A OR C) AND (B OR C)', simplified: '(A OR B) AND (NOT A OR C)', explanation: 'Dual of the consensus theorem' },
    ],
  },
];

/** Example circuits a user can load to explore. */
export interface CircuitExample {
  id: string;
  name: string;
  description: string;
  // Gates and wires are stored as a serialized JSON string for compactness.
  // Parsed by the store when loaded.
  circuit: string;
}

// We'll keep these short and let the store parse them.
export const CIRCUIT_EXAMPLES: CircuitExample[] = [
  {
    id: 'half-adder',
    name: 'Half Adder',
    description: 'Adds two bits: Sum = A XOR B, Carry = A AND B',
    circuit: JSON.stringify({
      gates: [
        { id: 'a', type: 'INPUT', x: 80, y: 80, label: 'A', inputValue: 0 },
        { id: 'b', type: 'INPUT', x: 80, y: 200, label: 'B', inputValue: 0 },
        { id: 'xor1', type: 'XOR', x: 280, y: 80 },
        { id: 'and1', type: 'AND', x: 280, y: 220 },
        { id: 'sum', type: 'OUTPUT', x: 480, y: 80, label: 'Sum' },
        { id: 'carry', type: 'OUTPUT', x: 480, y: 220, label: 'Carry' },
      ],
      wires: [
        { id: 'w1', fromGateId: 'a', toGateId: 'xor1', toPinIndex: 0 },
        { id: 'w2', fromGateId: 'b', toGateId: 'xor1', toPinIndex: 1 },
        { id: 'w3', fromGateId: 'a', toGateId: 'and1', toPinIndex: 0 },
        { id: 'w4', fromGateId: 'b', toGateId: 'and1', toPinIndex: 1 },
        { id: 'w5', fromGateId: 'xor1', toGateId: 'sum', toPinIndex: 0 },
        { id: 'w6', fromGateId: 'and1', toGateId: 'carry', toPinIndex: 0 },
      ],
    }),
  },
  {
    id: 'demorgan-demo',
    name: "De Morgan Demo",
    description: 'NOT(A AND B) vs (NOT A) OR (NOT B) — both outputs match',
    circuit: JSON.stringify({
      gates: [
        { id: 'a', type: 'INPUT', x: 60, y: 60, label: 'A', inputValue: 0 },
        { id: 'b', type: 'INPUT', x: 60, y: 220, label: 'B', inputValue: 0 },
        { id: 'and1', type: 'AND', x: 240, y: 120 },
        { id: 'not1', type: 'NOT', x: 360, y: 120 },
        { id: 'na', type: 'NOT', x: 240, y: 240 },
        { id: 'nb', type: 'NOT', x: 240, y: 340 },
        { id: 'or1', type: 'OR', x: 380, y: 290 },
        { id: 'o1', type: 'OUTPUT', x: 540, y: 120, label: 'NOT(A·B)' },
        { id: 'o2', type: 'OUTPUT', x: 540, y: 290, label: '¬A∨¬B' },
      ],
      wires: [
        { id: 'w1', fromGateId: 'a', toGateId: 'and1', toPinIndex: 0 },
        { id: 'w2', fromGateId: 'b', toGateId: 'and1', toPinIndex: 1 },
        { id: 'w3', fromGateId: 'and1', toGateId: 'not1', toPinIndex: 0 },
        { id: 'w4', fromGateId: 'not1', toGateId: 'o1', toPinIndex: 0 },
        { id: 'w5', fromGateId: 'a', toGateId: 'na', toPinIndex: 0 },
        { id: 'w6', fromGateId: 'b', toGateId: 'nb', toPinIndex: 0 },
        { id: 'w7', fromGateId: 'na', toGateId: 'or1', toPinIndex: 0 },
        { id: 'w8', fromGateId: 'nb', toGateId: 'or1', toPinIndex: 1 },
        { id: 'w9', fromGateId: 'or1', toGateId: 'o2', toPinIndex: 0 },
      ],
    }),
  },
  {
    id: 'sr-latch',
    name: 'SR Latch',
    description: 'Set-Reset latch using NOR gates — has memory',
    circuit: JSON.stringify({
      gates: [
        { id: 's', type: 'INPUT', x: 60, y: 60, label: 'S', inputValue: 0 },
        { id: 'r', type: 'INPUT', x: 60, y: 240, label: 'R', inputValue: 0 },
        { id: 'n1', type: 'NOR', x: 260, y: 80 },
        { id: 'n2', type: 'NOR', x: 260, y: 220 },
        { id: 'q', type: 'OUTPUT', x: 480, y: 80, label: 'Q' },
        { id: 'qb', type: 'OUTPUT', x: 480, y: 220, label: 'Q̄' },
      ],
      wires: [
        { id: 'w1', fromGateId: 's', toGateId: 'n1', toPinIndex: 0 },
        { id: 'w2', fromGateId: 'r', toGateId: 'n2', toPinIndex: 1 },
        { id: 'w3', fromGateId: 'n1', toGateId: 'n2', toPinIndex: 0 },
        { id: 'w4', fromGateId: 'n2', toGateId: 'n1', toPinIndex: 1 },
        { id: 'w5', fromGateId: 'n1', toGateId: 'q', toPinIndex: 0 },
        { id: 'w6', fromGateId: 'n2', toGateId: 'qb', toPinIndex: 0 },
      ],
    }),
  },
];
