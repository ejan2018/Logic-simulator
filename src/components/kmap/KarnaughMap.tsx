'use client';
import { useMemo, useState, useCallback } from 'react';
import { KMapSize, getKMapConfig, truthTableToKMap, simplifyKMap, cellToMinterm, mintermToTerm } from '@/lib/logic/kmap';
import { parseBooleanExpression } from '@/lib/logic/expressionParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sparkles, RotateCcw, Lightbulb, Dices, ChevronLeft, ChevronRight, BookOpen, ArrowRight } from 'lucide-react';
import { ExpressionInput } from '@/components/logic/ExpressionInput';

const GROUP_COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

interface KMapProblem {
  id: number;
  size: KMapSize;
  variables: string[];
  minterms: number[];
  expression: string;
  canonicalForm: string;
  solution: string;
  solutionSteps: string[];
}

function generateKMapProblem(size: KMapSize): KMapProblem {
  const cfg = getKMapConfig(size);
  const vars = cfg.variables;
  const total = 1 << size;
  const numOnes = 2 + Math.floor(Math.random() * Math.min(6, total - 1));
  const allMinterms = Array.from({length: total}, (_, i) => i);
  const ones = allMinterms.sort(() => Math.random() - 0.5).slice(0, numOnes).sort((a, b) => a - b);
  const canonicalForm = ones.map(m => {
    const bits = m.toString(2).padStart(size, '0');
    let t = '';
    for (let i = 0; i < size; i++) t += bits[i] === '1' ? vars[i] : vars[i] + '\u0304';
    return t;
  }).join(' + ');
  // Simplify using the K-map engine
  const grid = truthTableToKMap(size, ones.length > 0 ? Array.from({length: total}, (_, i) => ones.includes(i) ? 1 : 0) : Array(total).fill(0));
  const sol = simplifyKMap(size, grid, vars);
  const steps = [
    `1. Draw a ${size}-variable K-map with Gray code labels.`,
    `2. Place 1s in cells: ${ones.map(m => 'm' + m).join(', ')}.`,
    `3. Group adjacent 1s into pairs, quads, or octets (powers of 2).`,
    `4. For each group, identify which variables stay constant.`,
    `5. Write one product term per group, then OR them together.`,
    `6. Simplified: F = ${sol.expression}`,
  ];
  return {
    id: Math.floor(Math.random() * 1000000),
    size, variables: vars, minterms: ones,
    expression: `F(${vars.join(', ')}) = Σm(${ones.join(', ')})`,
    canonicalForm,
    solution: `F = ${sol.expression}`,
    solutionSteps: steps,
  };
}

function generateKMapBank(count: number, size: KMapSize): KMapProblem[] {
  const bank: KMapProblem[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (bank.length < count && attempts < count * 5) {
    attempts++;
    const p = generateKMapProblem(size);
    const key = p.expression;
    if (!seen.has(key)) { seen.add(key); bank.push(p); }
  }
  return bank;
}

// Reference table data for 2/3/4 variables
function getReferenceTable(size: KMapSize) {
  const cfg = getKMapConfig(size);
  const total = 1 << size;
  const rows: { minterm: number; bits: string; term: string; value: string }[] = [];
  for (let m = 0; m < total; m++) {
    const bits = m.toString(2).padStart(size, '0');
    let term = '';
    for (let i = 0; i < size; i++) term += bits[i] === '1' ? cfg.variables[i] : cfg.variables[i] + '\u0304';
    rows.push({ minterm: m, bits, term, value: `${cfg.variables.join('')} = ${bits}` });
  }
  return { variables: cfg.variables, rows };
}

export function KarnaughMap() {
  const [size, setSize] = useState<KMapSize>(3);
  const [grid, setGrid] = useState<number[][]>(() => { const c = getKMapConfig(3); return Array.from({length:c.rows},()=>Array(c.cols).fill(0)); });
  const [expression, setExpression] = useState('A·B + B̄·C');
  const [showSolution, setShowSolution] = useState(false);
  const [mode, setMode] = useState<'interactive' | 'bank'>('interactive');
  const [bank, setBank] = useState<KMapProblem[]>([]);
  const [bankIndex, setBankIndex] = useState(0);
  const [showProblemSolution, setShowProblemSolution] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const cfg = useMemo(() => getKMapConfig(size), [size]);
  const refTable = useMemo(() => getReferenceTable(size), [size]);

  const handleSizeChange = (n: KMapSize) => {
    n = Number(n) as KMapSize; setSize(n);
    const nc = getKMapConfig(n);
    setGrid(Array.from({length:nc.rows},()=>Array(nc.cols).fill(0)));
    setShowSolution(false);
    setBank([]);
  };

  const toggleCell = (r: number, c: number) => {
    setGrid((g) => { const ng = g.map((row) => [...row]); ng[r][c] = ng[r][c] === 1 ? 0 : 1; return ng; });
    setShowSolution(false);
  };

  const solution = useMemo(() => showSolution ? simplifyKMap(size, grid, cfg.variables) : null, [showSolution, size, grid, cfg.variables]);

  const handleLoadFromExpression = () => {
    try {
      // Use the powerful recursive descent parser from expressionParser
      const result = parseBooleanExpression(expression);
      if (result.error || result.variables.length === 0) return;

      // If the expression has the right number of variables for this K-map, use it directly
      if (result.variables.length === size) {
        // Extract the truth table output values
        const tt = result.truthTable.map(row => row.output);
        setGrid(truthTableToKMap(size, tt));
        setShowSolution(false);
        return;
      }

      // If variable count doesn't match the K-map size, auto-adjust
      if (result.variables.length <= 4) {
        const newSize = result.variables.length as KMapSize;
        if (newSize !== size) {
          setSize(newSize);
        }
        const tt = result.truthTable.map(row => row.output);
        setGrid(truthTableToKMap(result.variables.length, tt));
        setShowSolution(false);
      }
    } catch {}
  };

  const handleRandom = useCallback(() => {
    const total = 1 << size;
    const numOnes = 2 + Math.floor(Math.random() * Math.min(6, total - 1));
    const allMinterms = Array.from({length: total}, (_, i) => i);
    const ones = allMinterms.sort(() => Math.random() - 0.5).slice(0, numOnes);
    const tt: number[] = Array(total).fill(0);
    for (const m of ones) tt[m] = 1;
    setGrid(truthTableToKMap(size, tt));
    setShowSolution(false);
  }, [size]);

  const generateBank = useCallback(() => {
    setBank(generateKMapBank(200, size));
    setBankIndex(0);
    setShowProblemSolution(false);
  }, [size]);

  const loadProblemToGrid = (problem: KMapProblem) => {
    const total = 1 << problem.size;
    const tt: number[] = Array(total).fill(0);
    for (const m of problem.minterms) tt[m] = 1;
    setGrid(truthTableToKMap(problem.size, tt));
    setShowSolution(false);
    setShowProblemSolution(false);
  };

  const currentProblem = bank.length > 0 ? bank[bankIndex] : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mode selector + controls */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-semibold">Karnaugh Map Solver</div>
            <div className="text-xs text-muted-foreground mt-0.5">Interactive mode: build your own K-map. Bank mode: 200 random problems with solutions.</div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" variant={mode === 'interactive' ? 'default' : 'outline'} size="sm" onClick={() => setMode('interactive')}>Interactive</Button>
            <Button type="button" variant={mode === 'bank' ? 'default' : 'outline'} size="sm" onClick={() => setMode('bank')}>Question Bank (200)</Button>
            <div><Select value={String(size)} onValueChange={(v) => handleSizeChange(Number(v) as KMapSize)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 variables (A,B)</SelectItem>
                <SelectItem value="3">3 variables (A,B,C)</SelectItem>
                <SelectItem value="4">4 variables (A,B,C,D)</SelectItem>
              </SelectContent>
            </Select></div>
          </div>
        </CardContent>
      </Card>

      {/* Bank mode controls */}
      {mode === 'bank' && (
        <Card>
          <CardContent className="p-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={generateBank} size="sm"><Dices className="h-3.5 w-3.5 mr-1.5" />Generate 200 Random Problems</Button>
              {bank.length > 0 && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setBankIndex(Math.max(0, bankIndex - 1)); setShowProblemSolution(false); }} disabled={bankIndex === 0}><ChevronLeft className="h-3.5 w-3.5 mr-1" />Prev</Button>
                  <span className="text-xs font-mono font-semibold">Problem {bankIndex + 1} of {bank.length}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setBankIndex(Math.min(bank.length - 1, bankIndex + 1)); setShowProblemSolution(false); }} disabled={bankIndex === bank.length - 1}>Next<ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { if (currentProblem) loadProblemToGrid(currentProblem); }}>Load to K-Map ↑</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowProblemSolution(!showProblemSolution)}><Lightbulb className="h-3.5 w-3.5 mr-1" />{showProblemSolution ? 'Hide' : 'Show'} Solution</Button>
                </>
              )}
            </div>
            {bank.length === 0 ? (
              <div className="text-xs text-muted-foreground italic p-3 rounded-md border border-dashed border-border">Click "Generate 200 Random Problems" to create a bank of {size}-variable K-map problems with full solutions.</div>
            ) : currentProblem ? (
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded-md border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px] bg-violet-100 text-violet-900 border-violet-200">{currentProblem.size}-variable</Badge><span className="text-[10px] text-muted-foreground">Problem #{bankIndex + 1}</span></div>
                  <div className="font-mono text-sm font-bold mb-1">{currentProblem.expression}</div>
                  <div className="font-mono text-xs text-muted-foreground">Canonical: {currentProblem.canonicalForm}</div>
                </div>
                {showProblemSolution && (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm p-2 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                      <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5 uppercase tracking-wider">Simplified Answer</div>
                      <div className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{currentProblem.solution}</div>
                    </div>
                    <div className="text-xs p-2 rounded-md border border-primary/30 bg-primary/5">
                      <div className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">Solution Steps</div>
                      <div className="flex flex-col gap-1">{currentProblem.solutionSteps.map((step, i) => <div key={i} className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/50" /><span className="text-foreground/80">{step}</span></div>)}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Reference table toggle */}
      <Card>
        <CardContent className="p-3">
          <button type="button" onClick={() => setShowReference(!showReference)} className="text-xs text-primary flex items-center gap-1 hover:underline">
            <BookOpen className="h-3.5 w-3.5" />{showReference ? 'Hide' : 'Show'} Reference Table (all minterms for {size} variables)
          </button>
          {showReference && (
            <div className="mt-2 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs font-mono">
                <thead className="bg-muted"><tr>
                  <th className="px-2 py-1 text-center font-semibold border-b border-border">m</th>
                  <th className="px-2 py-1 text-center font-semibold border-b border-border">{refTable.variables.join('')}</th>
                  <th className="px-2 py-1 text-center font-semibold border-b border-border">Product Term</th>
                </tr></thead>
                <tbody>
                  {refTable.rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      <td className="px-2 py-1 text-center text-muted-foreground">m{r.minterm}</td>
                      <td className="px-2 py-1 text-center">{r.bits}</td>
                      <td className="px-2 py-1 text-center font-semibold text-primary">{r.term}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground mt-1">Use this table as a hint: each minterm number maps to a specific product term. For example, m5 with variables ABC = AB̄C.</div>
        </CardContent>
      </Card>

      {/* Main K-map + solver */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">K</span>Karnaugh Map — {size} variables ({cfg.variables.join(', ')})</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <Button type="button" size="sm" onClick={handleRandom} className="bg-violet-600 hover:bg-violet-700"><Dices className="h-3.5 w-3.5 mr-1" />Random</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => { setGrid(Array.from({length:cfg.rows},()=>Array(cfg.cols).fill(0))); setShowSolution(false); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Clear</Button>
              <Button type="button" size="sm" onClick={() => setShowSolution(true)} className="bg-primary"><Lightbulb className="h-3.5 w-3.5 mr-1" />Solve</Button>
              <div className="text-[10px] text-muted-foreground ml-auto">Click cells to toggle 0/1 · Scroll to zoom</div>
            </div>
            <div className="overflow-x-auto"><div className="inline-block">
              <div className="grid items-end gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${cfg.cols}, minmax(56px, 1fr))` }}><div className="text-[11px] text-muted-foreground text-right pr-2 font-mono">{cfg.variables.slice(0, size === 2 ? 1 : 2).join('')} ↓ / {cfg.variables.slice(size === 2 ? 1 : 2).join('')} →</div>{cfg.colLabels.map((c) => <div key={c} className="text-center text-xs font-mono font-semibold py-1.5 bg-muted/40 rounded">{c}</div>)}</div>
              {cfg.rowLabels.map((rl, r) => (<div key={r} className="grid items-stretch gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${cfg.cols}, minmax(56px, 1fr))` }}><div className="text-center text-xs font-mono font-semibold py-2 bg-muted/40 rounded">{rl}</div>{cfg.colLabels.map((_, c) => { const m = cellToMinterm(size, r, c); const v = grid[r]?.[c] ?? 0; let gc = ''; let gi = -1; if (solution) for (let k = 0; k < solution.groups.length; k++) if (solution.groups[k].cells.some((cl) => cl.row === r && cl.col === c)) { gc = GROUP_COLORS[k % GROUP_COLORS.length]; gi = k; break; } return (<button key={c} type="button" onClick={() => toggleCell(r, c)} title={`Minterm m${m} = ${mintermToTerm(size, m, cfg.variables)}`} className="aspect-square min-h-[56px] flex flex-col items-center justify-center rounded-md border-2 transition-all hover:scale-[1.04] hover:z-10 relative" style={{ background: v ? (gc ? `${gc}30` : '#10b98120') : 'white', borderColor: gc || (v ? '#10b98180' : '#e5e7eb'), borderWidth: gc ? 2.5 : 1.5 }}><span className={`text-2xl font-bold ${v ? 'text-primary' : 'text-muted-foreground'}`}>{v}</span><span className="text-[9px] text-muted-foreground font-mono mt-0.5">m{m}</span>{gi >= 0 && <span className="absolute top-0.5 right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: gc }}>{gi + 1}</span>}</button>); })}</div>))}
            </div></div>
            <div className="text-[11px] text-muted-foreground">💡 Click any cell to toggle between 0 and 1. Adjacent cells (including wrap-around) differ by exactly one variable.</div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">Solver</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">
          <div><Label className="text-xs">Load from expression</Label><div className="mt-1"><ExpressionInput value={expression} onChange={setExpression} onSubmit={handleLoadFromExpression} placeholder="e.g. A·B + B̄·C" /></div><div className="text-[10px] text-muted-foreground mt-1">Use the toolbar buttons to easily type variables with bars and whole-expression bars like (A+B)̄</div></div>
          <Separator />
          {solution ? (<div className="flex flex-col gap-3"><div><div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Simplified Expression</div><div className="font-mono text-base font-bold text-primary p-3 rounded-md bg-primary/8 border border-primary/20 break-words">F = {solution.expression}</div></div><div><div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Groups ({solution.groups.length})</div><div className="flex flex-col gap-1.5">{solution.groups.map((g, i) => <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30"><span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }}>{i + 1}</span><div className="text-xs"><div className="font-mono font-semibold">{g.term || '1'}</div><div className="text-muted-foreground">Group of {g.size}</div></div></div>)}</div></div></div>) : <div className="text-xs text-muted-foreground italic">Click <strong>Solve</strong> to simplify the current K-map configuration.</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
