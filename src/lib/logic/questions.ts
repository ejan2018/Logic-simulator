import { simplifyKMap, truthTableToKMap, KMapSize } from './kmap';

export interface Question {
  id: string;
  type: 'design-circuit' | 'truth-table' | 'simplify-kmap' | 'identify-gate' | 'write-expression';
  section: string;
  prompt: string;
  expression?: string;
  variables?: string[];
  minterms?: number[];
  truthTable?: number[];
  expectedAnswer?: string;
  hint?: string;
  solution?: string;
  solutionSteps?: string[];
}

const ALL_VARS = ['A', 'B', 'C', 'D', 'E'];
function ri(n: number): number { return Math.floor(Math.random() * n); }
function pick<T>(arr: T[], k: number): T[] { const c=[...arr]; const o:T[]=[]; for(let i=0;i<k&&c.length>0;i++) o.push(c.splice(ri(c.length),1)[0]); return o; }

function generateExpression(numVars: number, numTerms: number): { expr: string; variables: string[] } {
  const vars = ALL_VARS.slice(0, numVars);
  const terms: string[] = [];
  for (let t = 0; t < numTerms; t++) {
    const tv = pick(vars, 1 + ri(numVars)); const tp: string[] = [];
    for (const v of vars) if (tv.includes(v)) tp.push(Math.random()>0.5?v:v+'\u0304');
    if (tp.length) terms.push(tp.join('·'));
  }
  return { expr: terms.join(' + '), variables: vars };
}

function evalExpr(expr: string, variables: string[]): number[] {
  const n = variables.length; const size = 1 << n; const result: number[] = [];
  const normalize = (s: string) => { let o=s.replace(/·/g,'&&').replace(/\+/g,'||').replace(/¬/g,'!').replace(/\s/g,''); const m={Ā:'!A',B̄:'!B',C̄:'!C',D̄:'!D',Ē:'!E'}; for(const[k,v]of Object.entries(m)) o=o.split(k).join(v); return o; };
  const norm = normalize(expr);
  for (let combo = 0; combo < size; combo++) {
    const scope: Record<string, boolean> = {};
    for (let i = 0; i < n; i++) scope[variables[i]] = ((combo>>(n-1-i))&1)===1;
    try { let js=norm; for(const v of variables) js=js.replace(new RegExp(`\\b${v}\\b`,'g'),`scope.${v}`); result.push(new Function('scope',`return (${js}) ? 1 : 0;`)(scope)); } catch { result.push(0); }
  }
  return result;
}

let qId = 0;
function nextId(): string { return `q_${Date.now().toString(36)}_${(qId++).toString(36)}`; }

export function generateQuestionSet(count: number = 6): Question[] {
  const types: Question['type'][] = ['design-circuit','truth-table','simplify-kmap','identify-gate','write-expression'];
  return Array.from({length:count},(_,i)=>{const t=types[i%types.length];switch(t){case 'design-circuit':return genDesignCircuit();case 'truth-table':return genTruthTable();case 'simplify-kmap':return genSimplifyKMap();case 'identify-gate':return genIdentifyGate();case 'write-expression':return genWriteExpression();default:return genDesignCircuit();}}).sort(()=>Math.random()-0.5);
}

// Generate a large bank of unique questions (up to 200)
export function generateQuestionBank(count: number = 200): Question[] {
  const bank: Question[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (bank.length < count && attempts < count * 5) {
    attempts++;
    const types: Question['type'][] = ['design-circuit','truth-table','simplify-kmap','identify-gate','write-expression'];
    const t = types[ri(types.length)];
    let q: Question;
    switch (t) {
      case 'design-circuit': q = genDesignCircuit(); break;
      case 'truth-table': q = genTruthTable(); break;
      case 'simplify-kmap': q = genSimplifyKMap(); break;
      case 'identify-gate': q = genIdentifyGate(); break;
      case 'write-expression': q = genWriteExpression(); break;
      default: q = genDesignCircuit();
    }
    // Deduplicate by expression
    const key = q.expression || q.id;
    if (!seen.has(key)) { seen.add(key); bank.push(q); }
  }
  return bank;
}

function genDesignCircuit(): Question {
  const n=2+ri(3), nt=2+ri(3);
  const {expr, variables} = generateExpression(n, nt);
  const tt = evalExpr(expr, variables);
  const ones = tt.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0);
  // Build the solution: canonical SOP
  const solTerms = ones.map(m => {
    const bits = m.toString(2).padStart(n, '0');
    let t = '';
    for (let i = 0; i < n; i++) t += bits[i] === '1' ? variables[i] : variables[i] + '\u0304';
    return t;
  });
  const solution = `F = ${solTerms.join(' + ')}`;
  const steps = [
    `1. Identify variables: ${variables.join(', ')}`,
    `2. The expression is: F = ${expr}`,
    `3. For each AND term, use an AND gate.`,
    `4. For complemented variables (like Ā), use a NOT gate.`,
    `5. Connect all AND gate outputs to an OR gate.`,
    `6. The OR gate output is F.`,
  ];
  return {
    id: nextId(), type: 'design-circuit',
    section: 'Design logic circuits for the following Boolean functions',
    prompt: `Design a logic circuit using basic gates (AND, OR, NOT) for the following boolean function:`,
    expression: `F(${variables.join(', ')}) = ${expr}`,
    variables,
    solution,
    solutionSteps: steps,
    hint: 'Use AND gates for products, OR gates to combine terms, NOT gates for complemented variables (e.g. Ā).',
  };
}

function genTruthTable(): Question {
  const n=2+ri(2), nt=2+ri(2);
  const {expr, variables} = generateExpression(n, nt);
  const tt = evalExpr(expr, variables);
  return {
    id: nextId(), type: 'truth-table',
    section: 'Draw the truth table for the following Boolean function',
    prompt: `Construct a complete truth table with all ${1<<n} input combinations for:`,
    expression: `F(${variables.join(', ')}) = ${expr}`,
    variables,
    truthTable: tt,
    solution: `Truth table has ${1<<n} rows. F=1 at minterms: ${tt.map((v,i)=>v===1?`m${i}`:'').filter(x=>x).join(', ')}`,
    solutionSteps: [
      `1. List all ${1<<n} combinations of ${variables.join(', ')}.`,
      `2. For each combination, evaluate F = ${expr}.`,
      `3. Mark F=1 where the expression is true.`,
    ],
    hint: `List all ${1<<n} combinations of ${variables.join(', ')} from all-0s to all-1s.`,
  };
}

function genSimplifyKMap(): Question {
  const n=2+ri(3) as 2|3|4;
  const v=ALL_VARS.slice(0,n);
  const tm=1<<n;
  const no=3+ri(Math.min(5,tm-1));
  const am=Array.from({length:tm},(_,i)=>i);
  const ones=pick(am,no).sort((a,b)=>a-b);
  const ts=ones.map(m=>{
    const b=m.toString(2).padStart(n,'0');
    let t='';
    for(let i=0;i<n;i++) t+=b[i]==='1'?v[i]:v[i]+'\u0304';
    return t;
  }).join(' + ');
  // Compute simplified expression using the K-map engine
  const tt = Array(tm).fill(0);
  for (const m of ones) tt[m] = 1;
  const grid = truthTableToKMap(n, tt);
  const sol = simplifyKMap(n, grid, v);
  const solution = sol.expression;
  return {
    id: nextId(), type: 'simplify-kmap',
    section: 'Simplify the following Boolean functions using the K-Map method',
    prompt: `Using a ${n}-variable Karnaugh map, simplify the following function:`,
    expression: `F(${v.join(', ')}) = Σm(${ones.join(', ')})\n     = ${ts}`,
    variables: v,
    minterms: ones,
    solution: `F = ${solution}`,
    solutionSteps: [
      `1. Draw a ${n}-variable K-map with Gray code labels.`,
      `2. Place 1s in cells: ${ones.map(m=>'m'+m).join(', ')}.`,
      `3. Group adjacent 1s into pairs, quads, or octets (powers of 2).`,
      `4. For each group, identify which variables stay constant.`,
      `5. Write one product term per group, then OR them together.`,
      `6. Simplified: ${solution}`,
    ],
    hint: `Place 1s in cells ${ones.map(m=>'m'+m).join(', ')}. Group them into the largest possible power-of-2 rectangles.`,
  };
}

function genIdentifyGate(): Question {
  const gs=[
    {name:'AND',desc:'Output is 1 only when ALL inputs are 1'},
    {name:'OR',desc:'Output is 1 when AT LEAST ONE input is 1'},
    {name:'NOT',desc:'Output is the inverse of the input'},
    {name:'NAND',desc:'Output is 0 only when ALL inputs are 1'},
    {name:'NOR',desc:'Output is 1 only when ALL inputs are 0'},
    {name:'XOR',desc:'Output is 1 when inputs DIFFER'},
    {name:'XNOR',desc:'Output is 1 when inputs are EQUAL'},
  ];
  const g=gs[ri(gs.length)];
  return {
    id: nextId(), type: 'identify-gate',
    section: 'Identify the logic gate',
    prompt: `Which logic gate matches this description?`,
    expression: `"${g.desc}"`,
    expectedAnswer: g.name,
    solution: `Answer: ${g.name}`,
    solutionSteps: [
      `1. Read the description carefully.`,
      `2. Match it to a gate: AND (all 1s), OR (any 1), NOT (inverse), NAND (not all 1s), NOR (all 0s), XOR (differ), XNOR (same).`,
      `3. The answer is: ${g.name}.`,
    ],
    hint: 'Think about AND, OR, NOT, NAND, NOR, XOR, XNOR.',
  };
}

function genWriteExpression(): Question {
  const n=2+ri(2);
  const v=ALL_VARS.slice(0,n);
  const tm=1<<n;
  const no=2+ri(4);
  const am=Array.from({length:tm},(_,i)=>i);
  const ones=pick(am,Math.min(no,tm)).sort((a,b)=>a-b);
  const tt:number[]=Array(tm).fill(0);
  for(const m of ones) tt[m]=1;
  const ts=ones.map(m=>{
    const b=m.toString(2).padStart(n,'0');
    let t='';
    for(let i=0;i<n;i++) t+=b[i]==='1'?v[i]:v[i]+'\u0304';
    return t;
  }).join(' + ');
  return {
    id: nextId(), type: 'write-expression',
    section: 'Write the Boolean expression from the given truth table',
    prompt: `Given the truth table below (F=1 at minterms ${ones.join(', ')}), write the canonical SOP expression:`,
    expression: `Variables: ${v.join(', ')}\nMinterms where F=1: m${ones.join(', m')}`,
    variables: v,
    truthTable: tt,
    expectedAnswer: `F = ${ts}`,
    solution: `F = ${ts}`,
    solutionSteps: [
      `1. For each minterm where F=1, write a product term.`,
      `2. In each term, include the variable as-is if its bit is 1, or complemented if 0.`,
      `3. OR all the product terms together.`,
      `4. Result: F = ${ts}`,
    ],
    hint: 'For each minterm where F=1, write a product term. Then OR all terms together.',
  };
}
