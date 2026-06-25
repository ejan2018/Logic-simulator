// Boolean expression parser — recursive descent parser with AST
// Handles: AND (·), OR (+), NOT (Ā/¬/'), XOR (⊕), NAND (⊼), NOR (⊽), XNOR (⊙)
// Variables: A-E, x, y, z (max 4 for K-map, but any for circuit)
// Parentheses: unlimited nesting
// Whole-expression bars: (A+B)̄

import { KMapSize, getKMapConfig } from './kmap';

export interface ParsedGate {
  id: string;
  type: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'INPUT';
  label?: string;
  inputs: string[];
  x: number;
  y: number;
}

export interface ParsedCircuit {
  gates: ParsedGate[];
  outputGateId: string;
  variables: string[];
  expression: string;
}

export interface TruthTableRow {
  inputs: number[];
  minterm: number;
  term: string;
  output: number;
}

export interface ParsedResult {
  variables: string[];
  expression: string;
  canonicalForm: string;
  simplifiedForm: string;
  truthTable: TruthTableRow[];
  minterms: number[];
  kmapGrid: number[][];
  circuit: ParsedCircuit;
  error?: string;
}

// ===== AST Node Types =====
interface ASTNode {
  type: 'VAR' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR';
  varName?: string;
  children?: ASTNode[];
}

// ===== Tokenizer =====
interface Token { type: string; value: string; }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  // Normalize: replace · with *, remove spaces, etc.
  const s = expr.replace(/·/g, '*').replace(/\s/g, '');

  while (i < s.length) {
    const ch = s[i];

    // Variable: A-E, x, y, z (possibly with overbar)
    if (/[A-Exyz]/.test(ch)) {
      // Check for combining overbar (U+0304 or U+0305)
      if (i + 1 < s.length && (s[i + 1] === '\u0304' || s[i + 1] === '\u0305')) {
        tokens.push({ type: 'NOT', value: '!' });
        tokens.push({ type: 'VAR', value: ch });
        i += 2;
        continue;
      }
      // Check for precomposed overbar chars
      const precomposed: Record<string, string> = {
        'Ā': 'A', 'B̄': 'B', 'C̄': 'C', 'D̄': 'D', 'Ē': 'E',
        'X̄': 'X', 'Ȳ': 'Y', 'Z̄': 'Z', 'x̄': 'x', 'ȳ': 'y', 'z̄': 'z',
      };
      if (precomposed[ch]) {
        tokens.push({ type: 'NOT', value: '!' });
        tokens.push({ type: 'VAR', value: precomposed[ch] });
        i++;
        continue;
      }
      // Check if the next two chars form a precomposed overbar (2-char sequence)
      const twoChar = s.substring(i, i + 2);
      if (precomposed[twoChar]) {
        tokens.push({ type: 'NOT', value: '!' });
        tokens.push({ type: 'VAR', value: precomposed[twoChar] });
        i += 2;
        continue;
      }
      tokens.push({ type: 'VAR', value: ch });
      i++;
      continue;
    }

    // Precomposed overbar chars (may appear as standalone)
    const precomposed: Record<string, string> = {
      'Ā': 'A', 'B̄': 'B', 'C̄': 'C', 'D̄': 'D', 'Ē': 'E',
      'X̄': 'X', 'Ȳ': 'Y', 'Z̄': 'Z', 'x̄': 'x', 'ȳ': 'y', 'z̄': 'z',
    };
    if (precomposed[ch]) {
      tokens.push({ type: 'NOT', value: '!' });
      tokens.push({ type: 'VAR', value: precomposed[ch] });
      i++;
      continue;
    }

    // Operators
    if (ch === '*') { tokens.push({ type: 'AND', value: '*' }); i++; continue; }
    if (ch === '+') { tokens.push({ type: 'OR', value: '+' }); i++; continue; }
    if (ch === '(') { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue; }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      // Check for whole-expression bar after )
      if (i + 1 < s.length && (s[i + 1] === '\u0304' || s[i + 1] === '\u0305')) {
        tokens.push({ type: 'NOT', value: '!' });
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (ch === '!') { tokens.push({ type: 'NOT', value: '!' }); i++; continue; }
    if (ch === '¬') { tokens.push({ type: 'NOT', value: '!' }); i++; continue; }
    if (ch === "'") { tokens.push({ type: 'NOT', value: '!' }); i++; continue; }
    // XOR: ⊕
    if (ch === '⊕') { tokens.push({ type: 'XOR', value: '⊕' }); i++; continue; }
    // XNOR: ⊙
    if (ch === '⊙') { tokens.push({ type: 'XNOR', value: '⊙' }); i++; continue; }
    // Multi-char operators
    if (s.substring(i, i + 2) === '⊕̄' || (s[i] === '⊕' && i + 1 < s.length && (s[i + 1] === '\u0304' || s[i + 1] === '\u0305'))) {
      tokens.push({ type: 'XNOR', value: '⊙' }); i += 2; continue;
    }

    // Skip unknown chars
    i++;
  }
  return tokens;
}

// ===== Recursive Descent Parser =====
// Grammar:
//   expr   := term (('+' | '⊕' | '⊙') term)*
//   term   := factor (('*') factor)*
//   factor := '!' factor | '(' expr ')' '!'? | VAR '!'?
class Parser {
  tokens: Token[];
  pos: number = 0;

  constructor(tokens: Token[]) { this.tokens = tokens; }

  peek(): Token | null { return this.pos < this.tokens.length ? this.tokens[this.pos] : null; }
  consume(): Token { return this.tokens[this.pos++]; }

  parseExpr(): ASTNode {
    let left = this.parseTerm();
    while (this.peek() && (this.peek()!.type === 'OR' || this.peek()!.type === 'XOR' || this.peek()!.type === 'XNOR')) {
      const op = this.consume();
      const right = this.parseTerm();
      left = { type: op.type as ASTNode['type'], children: [left, right] };
    }
    return left;
  }

  parseTerm(): ASTNode {
    let left = this.parseFactor();
    while (this.peek() && this.peek()!.type === 'AND') {
      this.consume();
      const right = this.parseFactor();
      left = { type: 'AND', children: [left, right] };
    }
    // Implicit AND: if next token is VAR or LPAREN or NOT, it's implicit AND
    while (this.peek() && (this.peek()!.type === 'VAR' || this.peek()!.type === 'LPAREN' || this.peek()!.type === 'NOT')) {
      const right = this.parseFactor();
      left = { type: 'AND', children: [left, right] };
    }
    return left;
  }

  parseFactor(): ASTNode {
    if (this.peek()!.type === 'NOT') {
      this.consume();
      const child = this.parseFactor();
      return { type: 'NOT', children: [child] };
    }
    if (this.peek()!.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpr();
      if (this.peek() && this.peek()!.type === 'RPAREN') this.consume();
      // Check for NOT after )
      if (this.peek() && this.peek()!.type === 'NOT') {
        this.consume();
        return { type: 'NOT', children: [expr] };
      }
      return expr;
    }
    if (this.peek()!.type === 'VAR') {
      const tok = this.consume();
      // Check for NOT after variable (postfix ')
      if (this.peek() && this.peek()!.type === 'NOT') {
        this.consume();
        return { type: 'NOT', children: [{ type: 'VAR', varName: tok.value }] };
      }
      return { type: 'VAR', varName: tok.value };
    }
    // Fallback
    this.consume();
    return { type: 'VAR', varName: 'A' };
  }
}

// ===== AST Evaluator =====
function evalAST(node: ASTNode, scope: Record<string, boolean>): boolean {
  switch (node.type) {
    case 'VAR': return scope[node.varName!] ?? false;
    case 'NOT': return !evalAST(node.children![0], scope);
    case 'AND': return node.children!.every(c => evalAST(c, scope));
    case 'OR': return node.children!.some(c => evalAST(c, scope));
    case 'XOR': return node.children!.filter(c => evalAST(c, scope)).length % 2 === 1;
    case 'XNOR': return node.children!.filter(c => evalAST(c, scope)).length % 2 === 0;
    case 'NAND': return !node.children!.every(c => evalAST(c, scope));
    case 'NOR': return !node.children!.some(c => evalAST(c, scope));
    default: return false;
  }
}

// ===== AST to Normalized String (for JS eval fallback) =====
function astToJS(node: ASTNode): string {
  switch (node.type) {
    case 'VAR': return `scope.${node.varName}`;
    case 'NOT': return `(!${astToJS(node.children![0])})`;
    case 'AND': return `(${node.children!.map(astToJS).join('&&')})`;
    case 'OR': return `(${node.children!.map(astToJS).join('||')})`;
    case 'XOR': return `(${node.children!.map(astToJS).join('^')})`;
    case 'XNOR': return `(!(${node.children!.map(astToJS).join('^')}))`;
    case 'NAND': return `(!(${node.children!.map(astToJS).join('&&')}))`;
    case 'NOR': return `(!(${node.children!.map(astToJS).join('||')}))`;
    default: return 'false';
  }
}

// ===== Extract variables from AST =====
function extractVarsFromAST(node: ASTNode, vars: Set<string>): void {
  if (node.type === 'VAR') { vars.add(node.varName!); return; }
  if (node.children) node.children.forEach(c => extractVarsFromAST(c, vars));
}

// ===== Convert minterm to product term =====
function mintermToTerm(minterm: number, variables: string[]): string {
  const n = variables.length;
  const bits = minterm.toString(2).padStart(n, '0');
  let term = '';
  for (let i = 0; i < n; i++) term += bits[i] === '1' ? variables[i] : variables[i] + '\u0304';
  return term;
}

// ===== K-map simplification — uses the REAL K-map engine with wrap-around =====
function simplifyFromMinterms(minterms: number[], variables: string[]): string {
  if (minterms.length === 0) return '0';
  const n = variables.length;
  const total = 1 << n;
  if (minterms.length === total) return '1';

  // Build a truth table array (1 at minterm positions, 0 elsewhere)
  const truthTable: number[] = new Array(total).fill(0);
  for (const m of minterms) truthTable[m] = 1;

  // Build the K-map grid from the truth table
  const grid = buildKMapGridFromTruthTable(truthTable, n);

  // Use the K-map engine from kmap.ts which handles wrap-around correctly
  // We need to import simplifyKMap — but since this is a standalone module,
  // let's implement the wrap-around group finding directly here.

  const gray2 = ['0', '1'];
  const gray4 = ['00', '01', '11', '10'];
  let rows: number, cols: number, rowLabels: string[], colLabels: string[];
  if (n === 2) { rows = 2; cols = 2; rowLabels = gray2; colLabels = gray2; }
  else if (n === 3) { rows = 2; cols = 4; rowLabels = gray2; colLabels = gray4; }
  else { rows = 4; cols = 4; rowLabels = gray4; colLabels = gray4; }

  // Helper: check if cell (r,c) is 1, with WRAP-AROUND
  const isOne = (r: number, c: number) => {
    const rr = ((r % rows) + rows) % rows;
    const cc = ((c % cols) + cols) % cols;
    return grid[rr]?.[cc] === 1;
  };

  // Helper: get minterm number for K-map position (r,c)
  const cellMinterm = (r: number, c: number) => parseInt(rowLabels[r] + colLabels[c], 2);

  // Helper: simplify a group of minterms into a product term
  const simplifyGroup = (cells: number[]) => {
    const bits = cells.map(m => m.toString(2).padStart(n, '0'));
    let term = '';
    for (let i = 0; i < n; i++) {
      if (bits.every(b => b[i] === bits[0][i])) {
        term += bits[0][i] === '1' ? variables[i] : variables[i] + '\u0304';
      }
    }
    return term || '1';
  };

  // Find ALL valid groups (rectangles of 1s, with wrap-around, power-of-2 sizes)
  interface Group { cells: number[]; size: number; term: string; }
  const allGroups: Group[] = [];
  const seen = new Set<string>();

  // Try all possible rectangle dimensions (h x w where h*w is a power of 2)
  const dims: { h: number; w: number }[] = [];
  for (const h of [1, 2, 4]) {
    for (const w of [1, 2, 4]) {
      if (h <= rows && w <= cols && [1, 2, 4, 8, 16].includes(h * w)) {
        dims.push({ h, w });
      }
    }
  }

  // Sort by size descending (try largest groups first)
  dims.sort((a, b) => (b.h * b.w) - (a.h * a.w));

  for (let r0 = 0; r0 < rows; r0++) {
    for (let c0 = 0; c0 < cols; c0++) {
      for (const { h, w } of dims) {
        // Check if all cells in this rectangle (with wrap-around) are 1
        const cells: number[] = [];
        let allOnes = true;
        for (let dr = 0; dr < h && allOnes; dr++) {
          for (let dc = 0; dc < w && allOnes; dc++) {
            const r = r0 + dr;
            const c = c0 + dc;
            if (!isOne(r, c)) { allOnes = false; break; }
            const rr = ((r % rows) + rows) % rows;
            const cc = ((c % cols) + cols) % cols;
            cells.push(cellMinterm(rr, cc));
          }
        }
        if (!allOnes) continue;

        // Deduplicate by sorted cell list
        cells.sort((a, b) => a - b);
        const key = cells.join(',');
        if (seen.has(key)) continue;
        seen.add(key);

        // Only keep maximal groups (not subsets of larger groups)
        const isSubset = allGroups.some(g =>
          g.cells.length > cells.length &&
          cells.every(c => g.cells.includes(c))
        );
        if (!isSubset) {
          allGroups.push({ cells, size: cells.length, term: simplifyGroup(cells) });
        }
      }
    }
  }

  // Greedy set cover: pick groups covering the most uncovered minterms
  const remaining = new Set(minterms);
  const chosen: Group[] = [];

  while (remaining.size > 0) {
    let best: Group | null = null;
    let bestCovered = 0;
    for (const g of allGroups) {
      const covered = g.cells.filter(c => remaining.has(c)).length;
      if (covered > bestCovered || (covered === bestCovered && best && g.size > best.size)) {
        bestCovered = covered;
        best = g;
      }
    }
    if (!best || bestCovered === 0) break;
    chosen.push(best);
    for (const c of best.cells) remaining.delete(c);
  }

  if (chosen.length === 0) return '0';

  // Deduplicate terms
  const termSet = new Set<string>();
  const terms = chosen.filter(g => {
    if (termSet.has(g.term)) return false;
    termSet.add(g.term);
    return true;
  }).map(g => g.term);

  return terms.join(' + ');
}

// Build K-map grid from truth table (same as in kmap.ts but standalone)
function buildKMapGridFromTruthTable(truthTable: number[], numVars: number): number[][] {
  const gray2 = ['0', '1'];
  const gray4 = ['00', '01', '11', '10'];
  let rows: number, cols: number, rowLabels: string[], colLabels: string[];
  if (numVars === 2) { rows = 2; cols = 2; rowLabels = gray2; colLabels = gray2; }
  else if (numVars === 3) { rows = 2; cols = 4; rowLabels = gray2; colLabels = gray4; }
  else { rows = 4; cols = 4; rowLabels = gray4; colLabels = gray4; }
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const m = parseInt(rowLabels[r] + colLabels[c], 2);
      row.push(truthTable[m] ?? 0);
    }
    grid.push(row);
  }
  return grid;
}

// ===== Build K-map grid =====
function buildKMapGrid(minterms: number[], numVars: number): number[][] {
  const size = numVars as KMapSize;
  const gray2 = ['0', '1']; const gray4 = ['00', '01', '11', '10'];
  let rows: number, cols: number, rowLabels: string[], colLabels: string[];
  if (size === 2) { rows = 2; cols = 2; rowLabels = gray2; colLabels = gray2; }
  else if (size === 3) { rows = 2; cols = 4; rowLabels = gray2; colLabels = gray4; }
  else { rows = 4; cols = 4; rowLabels = gray4; colLabels = gray4; }
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) { const row: number[] = []; for (let c = 0; c < cols; c++) { row.push(minterms.includes(parseInt(rowLabels[r] + colLabels[c], 2)) ? 1 : 0); } grid.push(row); }
  return grid;
}

// ===== Build circuit from AST (recursive, handles any nesting) =====
let circuitGateId = 0;
function buildCircuitFromAST(node: ASTNode, variables: string[], depth: number): { gateId: string; gates: ParsedGate[]; y: number } {
  const gates: ParsedGate[] = [];
  const SPACING_X = 150;
  const SPACING_Y = 90;

  if (node.type === 'VAR') {
    // Find or create input gate
    const existing = gates.find(g => g.type === 'INPUT' && g.label === node.varName);
    if (existing) return { gateId: existing.id, gates, y: existing.y };
    const id = `g${circuitGateId++}`;
    const y = 40 + variables.indexOf(node.varName!) * SPACING_Y;
    gates.push({ id, type: 'INPUT', label: node.varName, inputs: [], x: 40, y });
    return { gateId: id, gates, y };
  }

  if (node.type === 'NOT') {
    const child = buildCircuitFromAST(node.children![0], variables, depth + 1);
    gates.push(...child.gates);
    const id = `g${circuitGateId++}`;
    const x = 40 + (depth + 1) * SPACING_X;
    gates.push({ id, type: 'NOT', label: 'NOT', inputs: [child.gateId], x, y: child.y });
    return { gateId: id, gates, y: child.y };
  }

  // AND, OR, XOR, XNOR, NAND, NOR — binary or multi-input gates
  const childResults = node.children!.map((child, i) => buildCircuitFromAST(child, variables, depth + 1));
  childResults.forEach(r => gates.push(...r.gates));

  const id = `g${circuitGateId++}`;
  const x = 40 + (depth + 1) * SPACING_X;
  const avgY = childResults.reduce((sum, r) => sum + r.y, 0) / childResults.length;
  const gateType = node.type as 'AND' | 'OR' | 'XOR' | 'XNOR' | 'NAND' | 'NOR';
  gates.push({ id, type: gateType, inputs: childResults.map(r => r.gateId), x, y: avgY });
  return { gateId: id, gates, y: avgY };
}

// Collect all unique input gates from the AST
function collectInputGates(node: ASTNode, variables: string[], gates: ParsedGate[], yPos: Record<string, number>): void {
  if (node.type === 'VAR') {
    if (!gates.find(g => g.type === 'INPUT' && g.label === node.varName)) {
      const id = `g${circuitGateId++}`;
      const y = 40 + variables.indexOf(node.varName!) * 90;
      gates.push({ id, type: 'INPUT', label: node.varName, inputs: [], x: 40, y });
      yPos[node.varName!] = y;
    }
    return;
  }
  if (node.children) node.children.forEach(c => collectInputGates(c, variables, gates, yPos));
}

// ===== Main parse function =====
export function parseBooleanExpression(expr: string): ParsedResult {
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) {
      return { variables: [], expression: expr, canonicalForm: '', simplifiedForm: '', truthTable: [], minterms: [], kmapGrid: [], circuit: { gates: [], outputGateId: '', variables: [], expression: expr }, error: 'Empty expression.' };
    }

    const parser = new Parser(tokens);
    const ast = parser.parseExpr();

    // Extract variables
    const varSet = new Set<string>();
    extractVarsFromAST(ast, varSet);
    const variables = [...varSet].sort();

    if (variables.length === 0) {
      return { variables: [], expression: expr, canonicalForm: '', simplifiedForm: '', truthTable: [], minterms: [], kmapGrid: [], circuit: { gates: [], outputGateId: '', variables: [], expression: expr }, error: 'No variables found. Use A, B, C, D, x, y, or z.' };
    }
    if (variables.length > 4) {
      return { variables, expression: expr, canonicalForm: '', simplifiedForm: '', truthTable: [], minterms: [], kmapGrid: [], circuit: { gates: [], outputGateId: '', variables: [], expression: expr }, error: 'Maximum 4 variables supported for K-map (but circuit will still work).' };
    }

    const n = variables.length;
    const total = 1 << n;
    const jsExpr = astToJS(ast);
    const truthTable: TruthTableRow[] = [];
    const minterms: number[] = [];

    for (let combo = 0; combo < total; combo++) {
      const scope: Record<string, boolean> = {};
      for (let i = 0; i < n; i++) scope[variables[i]] = ((combo >> (n - 1 - i)) & 1) === 1;
      const output = evalAST(ast, scope) ? 1 : 0;
      const bits = combo.toString(2).padStart(n, '0').split('').map(Number);
      const term = mintermToTerm(combo, variables);
      truthTable.push({ inputs: bits, minterm: combo, term, output });
      if (output === 1) minterms.push(combo);
    }

    const canonicalForm = minterms.length > 0 ? minterms.map(m => mintermToTerm(m, variables)).join(' + ') : '0';
    const simplifiedForm = simplifyFromMinterms(minterms, variables);
    const kmapGrid = buildKMapGrid(minterms, n);

    // Build circuit from AST
    circuitGateId = 0;
    const allGates: ParsedGate[] = [];
    const yPos: Record<string, number> = {};
    collectInputGates(ast, variables, allGates, yPos);

    const result = buildCircuitFromAST(ast, variables, 0);
    // Merge: add only non-input gates from result
    for (const g of result.gates) {
      if (!allGates.find(ag => ag.id === g.id)) allGates.push(g);
    }

    return {
      variables,
      expression: expr,
      canonicalForm,
      simplifiedForm,
      truthTable,
      minterms,
      kmapGrid,
      circuit: { gates: allGates, outputGateId: result.gateId, variables, expression: expr },
    };
  } catch (e) {
    return { variables: [], expression: expr, canonicalForm: '', simplifiedForm: '', truthTable: [], minterms: [], kmapGrid: [], circuit: { gates: [], outputGateId: '', variables: [], expression: expr }, error: 'Could not parse expression. Check syntax.' };
  }
}

// Example expressions — including hardest ones
export const EXAMPLE_EXPRESSIONS = [
  'A·B + B̄·C',
  'x̄·y·z + x̄·y·z̄ + x·y·z + x·ȳ·z',
  '(A+B)·(Ā+B)',
  'A·B·C + Ā·(C+B)',
  '(Ā+B)·B̄ + (Ā+C)',
  'x + y + z + x̄·y + x·y·z',
  '(A+B)·(Ā+C)·(B̄+D)',
  'A⊕B',
  '(A·B)̄ + (C·D)̄',
  '(A+B+C)·(Ā+B̄+C̄)',
];
