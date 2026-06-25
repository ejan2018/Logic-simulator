'use client';
import { useState, useMemo } from 'react';
import { parseBooleanExpression, EXAMPLE_EXPRESSIONS } from '@/lib/logic/expressionParser';
import { EXPRESSIONS_BANK, LEVELS } from '@/lib/logic/expressionsBank';
import { FBISE_EXPRESSIONS, FBISE_CHAPTERS } from '@/lib/logic/fbiseExpressions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GATE_WIDTH, GATE_HEIGHT, getSevenSegmentPattern } from '@/lib/logic/gates';
import { ExpressionInput } from '@/components/logic/ExpressionInput';
import { Calculator, Zap, Table as TableIcon, Grid3x3, AlertCircle, ArrowRight, Lightbulb, Search, BookMarked } from 'lucide-react';

const GROUP_COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

// Draw a single gate directly in the parent SVG coordinate space
function drawGate(gate: { id: string; type: string; label?: string; inputs: string[]; x: number; y: number }, key: string): React.ReactNode {
  const { x, y, type, label } = gate;
  const W = 80, H = 60;
  const stroke = '#1f2937';
  const fill = '#ffffff';
  const labelY = y + H + 14;

  if (type === 'INPUT') {
    const labelText = label || '';
    const isConst = labelText === '0' || labelText === '1';
    const bg = isConst ? (labelText === '1' ? '#10b981' : '#9ca3af') : '#e5e7eb';
    return (
      <g key={key}>
        <line x1={x + W - 12} y1={y + H/2} x2={x + W} y2={y + H/2} stroke="#1f2937" strokeWidth={1.8} />
        <rect x={x + 4} y={y + 8} width={W - 16} height={H - 16} rx={10} ry={10} fill={bg} stroke={stroke} strokeWidth={1.8} />
        {isConst && <text x={x + W/2 - 4} y={y + H/2 + 1} fontSize={16} fontWeight={700} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" style={{ fontFamily: 'ui-monospace, monospace' }}>{labelText}</text>}
        {label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}
      </g>
    );
  }

  const bodyX = x + 12, bodyY = y + 5, bodyW = 48, bodyH = H - 10;
  const inputLines = gate.inputs.map((_, i) => {
    const count = gate.inputs.length;
    const iy = count === 1 ? y + H/2 : y + (H * (i + 1)) / (count + 1);
    return <line key={i} x1={x} y1={iy} x2={bodyX} y2={iy} stroke="#1f2937" strokeWidth={1.8} />;
  });
  const outputLine = <line x1={bodyX + bodyW} y1={y + H/2} x2={x + W} y2={y + H/2} stroke="#1f2937" strokeWidth={1.8} />;

  let bodyShape: React.ReactNode = null;
  if (type === 'AND' || type === 'NAND') {
    const path = `M ${bodyX} ${bodyY} L ${bodyX + bodyW/2} ${bodyY} A ${bodyH/2} ${bodyH/2} 0 0 1 ${bodyX + bodyW/2} ${bodyY + bodyH} L ${bodyX} ${bodyY + bodyH} Z`;
    bodyShape = <path d={path} fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />;
    if (type === 'NAND') return (<g key={key}>{inputLines}{bodyShape}<circle cx={bodyX + bodyW + 2} cy={y + H/2} r={4} fill="#ffffff" stroke={stroke} strokeWidth={1.8} />{outputLine}{label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}</g>);
  } else if (type === 'OR' || type === 'NOR') {
    const path = `M ${bodyX} ${bodyY} Q ${bodyX + bodyW*0.3} ${bodyY + bodyH/2} ${bodyX} ${bodyY + bodyH} Q ${bodyX + bodyW*0.5} ${bodyY + bodyH} ${bodyX + bodyW} ${bodyY + bodyH/2} Q ${bodyX + bodyW*0.5} ${bodyY} ${bodyX} ${bodyY} Z`;
    bodyShape = <path d={path} fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />;
    if (type === 'NOR') return (<g key={key}>{inputLines}{bodyShape}<circle cx={bodyX + bodyW + 2} cy={y + H/2} r={4} fill="#ffffff" stroke={stroke} strokeWidth={1.8} />{outputLine}{label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}</g>);
  } else if (type === 'XOR' || type === 'XNOR') {
    const path = `M ${bodyX + 6} ${bodyY} Q ${bodyX + bodyW*0.3 + 6} ${bodyY + bodyH/2} ${bodyX + 6} ${bodyY + bodyH} Q ${bodyX + bodyW*0.5 + 6} ${bodyY + bodyH} ${bodyX + bodyW} ${bodyY + bodyH/2} Q ${bodyX + bodyW*0.5 + 6} ${bodyY} ${bodyX + 6} ${bodyY} Z`;
    bodyShape = <path d={path} fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />;
    const extraCurve = <path d={`M ${bodyX} ${bodyY} Q ${bodyX + bodyW*0.3} ${bodyY + bodyH/2} ${bodyX} ${bodyY + bodyH}`} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />;
    if (type === 'XNOR') return (<g key={key}>{inputLines}{bodyShape}{extraCurve}<circle cx={bodyX + bodyW + 2} cy={y + H/2} r={4} fill="#ffffff" stroke={stroke} strokeWidth={1.8} />{outputLine}{label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}</g>);
    return (<g key={key}>{inputLines}{bodyShape}{extraCurve}{outputLine}{label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}</g>);
  } else if (type === 'NOT') {
    const path = `M ${bodyX} ${bodyY} L ${bodyX + bodyW - 8} ${bodyY + bodyH/2} L ${bodyX} ${bodyY + bodyH} Z`;
    bodyShape = <path d={path} fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />;
  }

  return (
    <g key={key}>
      {inputLines}
      {bodyShape}
      {type === 'NOT' && <circle cx={bodyX + bodyW - 4} cy={y + H/2} r={4} fill="#ffffff" stroke={stroke} strokeWidth={1.8} />}
      {outputLine}
      {label && <text x={x + W/2} y={labelY} fontSize={11} fontWeight={600} textAnchor="middle" fill="#374151" style={{ fontFamily: 'ui-monospace, monospace' }}>{label}</text>}
    </g>
  );
}

// Render the circuit diagram from parsed circuit — pure SVG, no foreignObject
function CircuitDiagram({ circuit }: { circuit: ReturnType<typeof parseBooleanExpression>['circuit'] }) {
  const gateById = new Map(circuit.gates.map(g => [g.id, g]));
  const GATE_W = 80, GATE_H = 60;
  const maxX = Math.max(...circuit.gates.map(g => g.x), 0) + GATE_W + 60;
  const maxY = Math.max(...circuit.gates.map(g => g.y), 0) + GATE_H + 40;

  return (
    <div className="overflow-auto rounded-md border border-border bg-card p-4" style={{ maxHeight: 450 }}>
      {circuit.gates.length === 0 ? (
        <div className="text-sm text-muted-foreground italic text-center py-8">No circuit to display.</div>
      ) : (
        <svg width={maxX} height={maxY} style={{ minWidth: '100%' }}>
          {/* Wires */}
          {circuit.gates.flatMap((gate) =>
            gate.inputs.map((inputId, i) => {
              const inputGate = gateById.get(inputId);
              if (!inputGate) return null;
              const fromX = inputGate.x + GATE_W;
              const fromY = inputGate.y + GATE_H / 2;
              const count = gate.inputs.length;
              const toY = count === 1 ? gate.y + GATE_H / 2 : gate.y + (GATE_H * (i + 1)) / (count + 1);
              const toX = gate.x;
              const midX = (fromX + toX) / 2;
              return (
                <path
                  key={`wire-${gate.id}-${i}`}
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              );
            })
          )}
          {/* Gates */}
          {circuit.gates.map((gate) => drawGate(gate, `gate-${gate.id}`))}
          {/* Output label */}
          {circuit.outputGateId && (() => {
            const outGate = gateById.get(circuit.outputGateId);
            if (!outGate) return null;
            return (
              <g>
                <line x1={outGate.x + GATE_W} y1={outGate.y + GATE_H/2} x2={outGate.x + GATE_W + 30} y2={outGate.y + GATE_H/2} stroke="#1f2937" strokeWidth={1.8} />
                <text x={outGate.x + GATE_W + 35} y={outGate.y + GATE_H/2 + 4} fontSize={13} fontWeight={700} fill="#0ea5e9" style={{ fontFamily: 'ui-monospace, monospace' }}>F</text>
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  );
}

// Render truth table
function TruthTableDisplay({ result }: { result: ReturnType<typeof parseBooleanExpression> }) {
  const { variables, truthTable } = result;
  return (
    <div className="overflow-auto max-h-96 rounded-md border border-border">
      <table className="w-full text-xs font-mono">
        <thead className="bg-muted sticky top-0">
          <tr>
            {variables.map((v) => <th key={v} className="px-2 py-1.5 text-center font-semibold border-b border-border">{v}</th>)}
            <th className="px-2 py-1.5 text-center font-semibold border-b border-border text-muted-foreground bg-muted/60">m</th>
            <th className="px-2 py-1.5 text-center font-semibold border-b border-border text-muted-foreground bg-muted/60">Working</th>
            <th className="px-2 py-1.5 text-center font-semibold border-b border-border text-primary">F</th>
          </tr>
        </thead>
        <tbody>
          {truthTable.map((row) => (
            <tr key={row.minterm} className={row.output === 1 ? 'bg-primary/5' : 'even:bg-muted/30'}>
              {row.inputs.map((v, i) => <td key={i} className="px-2 py-1 text-center">{v}</td>)}
              <td className="px-2 py-1 text-center text-muted-foreground">{row.minterm}</td>
              <td className="px-2 py-1 text-center text-[10px] text-muted-foreground/70">{row.term}</td>
              <td className="px-2 py-1 text-center font-bold text-primary">{row.output}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Render K-map
function KMapDisplay({ result }: { result: ReturnType<typeof parseBooleanExpression> }) {
  const { variables, kmapGrid, minterms } = result;
  const numVars = variables.length;
  const gray2 = ['0', '1'];
  const gray4 = ['00', '01', '11', '10'];
  let rowLabels: string[], colLabels: string[];
  if (numVars === 2) { rowLabels = gray2; colLabels = gray2; }
  else if (numVars === 3) { rowLabels = gray2; colLabels = gray4; }
  else { rowLabels = gray4; colLabels = gray4; }

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-block">
        <div className="grid items-end gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${colLabels.length}, minmax(48px, 1fr))` }}>
          <div className="text-[11px] text-muted-foreground text-right pr-2 font-mono">{variables.slice(0, numVars === 2 ? 1 : 2).join('')} ↓ / {variables.slice(numVars === 2 ? 1 : 2).join('')} →</div>
          {colLabels.map((c) => <div key={c} className="text-center text-xs font-mono font-semibold py-1.5 bg-muted/40 rounded">{c}</div>)}
        </div>
        {kmapGrid.map((row, r) => (
          <div key={r} className="grid items-stretch gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${colLabels.length}, minmax(48px, 1fr))` }}>
            <div className="text-center text-xs font-mono font-semibold py-2 bg-muted/40 rounded">{rowLabels[r]}</div>
            {row.map((v, c) => {
              const m = parseInt(rowLabels[r] + colLabels[c], 2);
              return (
                <div key={c} className="aspect-square min-h-[48px] flex flex-col items-center justify-center rounded-md border-2" style={{ background: v ? '#10b98120' : 'white', borderColor: v ? '#10b98180' : '#e5e7eb' }}>
                  <span className={`text-xl font-bold ${v ? 'text-primary' : 'text-muted-foreground'}`}>{v}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">m{m}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">1s at minterms: {minterms.length > 0 ? minterms.map(m => `m${m}`).join(', ') : 'none'}</div>
    </div>
  );
}

export function QuestionSolver() {
  const [expression, setExpression] = useState('A·B + B̄·C');
  const [submittedExpr, setSubmittedExpr] = useState('A·B + B̄·C');

  const result = useMemo(() => parseBooleanExpression(submittedExpr), [submittedExpr]);

  const handleSubmit = () => setSubmittedExpr(expression);
  const handleExample = (ex: string) => { setExpression(ex); setSubmittedExpr(ex); };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Input card */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Question Solver — Auto-Generate Everything</div>
              <div className="text-xs text-muted-foreground">Type any boolean expression and get the circuit diagram, truth table, and K-map automatically.</div>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <div className="flex-1"><ExpressionInput value={expression} onChange={setExpression} onSubmit={handleSubmit} placeholder="e.g. A·B + B̄·C or (A+B)̄" /></div>
            <Button type="button" onClick={handleSubmit} className="bg-primary mt-0"><Zap className="h-4 w-4 mr-1" />Solve</Button>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Use <code className="px-1 bg-muted rounded">·</code> or <code className="px-1 bg-muted rounded">*</code> for AND,
            <code className="px-1 bg-muted rounded ml-1">+</code> for OR,
            <code className="px-1 bg-muted rounded ml-1">Ā</code> or <code className="px-1 bg-muted rounded">¬A</code> for NOT.
            Variables: A, B, C, D (max 4). Try the examples below!
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_EXPRESSIONS.map((ex) => (
              <button key={ex} type="button" onClick={() => handleExample(ex)} className="text-[10px] px-2 py-1 rounded-md border border-border bg-card hover:bg-accent font-mono transition-colors">{ex}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expression Bank — 160 pre-saved expressions */}
      <ExpressionBank onPick={handleExample} />

      {/* FBISE & Cambridge Bank — 300 expressions */}
      <FBISEBank onPick={handleExample} />

      {/* Error */}
      {result.error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{result.error}</span>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!result.error && result.variables.length > 0 && (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">F({result.variables.join(', ')})</Badge>
                <span className="text-muted-foreground">=</span>
                <span className="font-mono font-semibold">{result.expression}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground font-semibold">Variables:</span> <span className="font-mono">{result.variables.join(', ')}</span></div>
                <div><span className="text-muted-foreground font-semibold">Minterms:</span> <span className="font-mono">Σm({result.minterms.join(', ')})</span></div>
                <div><span className="text-muted-foreground font-semibold">Simplified:</span> <span className="font-mono text-primary font-bold">F = {result.simplifiedForm}</span></div>
              </div>
              <div className="text-xs p-2 rounded-md bg-muted/30 border border-border">
                <span className="text-muted-foreground font-semibold">Canonical SOP:</span> <span className="font-mono">{result.canonicalForm}</span>
              </div>
            </CardContent>
          </Card>

          {/* Circuit Diagram */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Circuit Diagram (from simplified expression)</CardTitle></CardHeader>
            <CardContent>
              <CircuitDiagram circuit={result.circuit} />
              <div className="text-[10px] text-muted-foreground mt-2">This diagram is built from the <strong>simplified</strong> expression <code className="px-1 bg-muted rounded">F = {result.simplifiedForm}</code>, not the canonical SOP. This gives a cleaner circuit with fewer gates.</div>
            </CardContent>
          </Card>

          {/* Truth Table + K-Map side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TableIcon className="h-4 w-4 text-emerald-500" />Truth Table</CardTitle></CardHeader>
              <CardContent><TruthTableDisplay result={result} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Grid3x3 className="h-4 w-4 text-violet-500" />Karnaugh Map</CardTitle></CardHeader>
              <CardContent>
                <KMapDisplay result={result} />
                <div className="mt-3 p-2 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5 uppercase tracking-wider flex items-center gap-1"><Lightbulb className="h-3 w-3" />Simplified Answer</div>
                  <div className="font-mono font-bold text-emerald-900 dark:text-emerald-200">F = {result.simplifiedForm}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />How to Solve This</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 1:</strong> Identify the variables: {result.variables.join(', ')}</span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 2:</strong> Evaluate the expression for all {1 << result.variables.length} input combinations to build the truth table.</span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 3:</strong> Identify minterms where F=1: Σm({result.minterms.join(', ')})</span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 4:</strong> Place 1s in the K-map at those minterm positions.</span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 5:</strong> Group adjacent 1s into pairs, quads, or octets (powers of 2).</span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 6:</strong> Write the simplified expression: <span className="font-mono font-bold text-primary">F = {result.simplifiedForm}</span></span></div>
                <div className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 text-primary/50" /><span><strong>Step 7:</strong> Build the circuit using AND, OR, and NOT gates based on the simplified expression.</span></div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-border my-1" />;
}

// Expression Bank — searchable list of 160 pre-saved expressions
function ExpressionBank({ onPick }: { onPick: (expr: string) => void }) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    return EXPRESSIONS_BANK.filter((e) => {
      if (level !== 'All' && e.level !== level) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.expression.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q) || String(e.id).includes(q);
    });
  }, [search, level]);

  const levelColors: Record<string, string> = {
    Basic: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    Medium: 'bg-sky-100 text-sky-900 border-sky-200',
    Hard: 'bg-amber-100 text-amber-900 border-amber-200',
    Complex: 'bg-violet-100 text-violet-900 border-violet-200',
    Research: 'bg-rose-100 text-rose-900 border-rose-200',
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Expression Bank — 160 Pre-Saved Equations</div>
            <div className="text-xs text-muted-foreground">Click any expression to instantly solve it. Search by expression, description, or number.</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'} ({EXPRESSIONS_BANK.length})</Button>
        </div>
        {expanded && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search 160 expressions…" className="pl-8 h-8 text-sm" />
              </div>
              <div className="flex flex-wrap gap-1">
                {LEVELS.map((l) => (
                  <button key={l} type="button" onClick={() => setLevel(l)} className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${level === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-accent'}`}>{l}</button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{filtered.length} of {EXPRESSIONS_BANK.length}</span>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-md border border-border p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {filtered.map((e) => (
                  <button key={e.id} type="button" onClick={() => onPick(e.expression)} className="text-left p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors group">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground">#{e.id}</span>
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 ${levelColors[e.level] ?? ''}`}>{e.level}</Badge>
                    </div>
                    <div className="font-mono text-[11px] font-semibold group-hover:text-primary transition-colors">{e.expression}</div>
                    {e.description && <div className="text-[9px] text-muted-foreground mt-0.5">{e.description}</div>}
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <div className="text-xs text-muted-foreground italic text-center py-4">No expressions match your search.</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// FBISE & Cambridge Expression Bank — 300 expressions
function FBISEBank({ onPick }: { onPick: (expr: string) => void }) {
  const [search, setSearch] = useState('');
  const [chapter, setChapter] = useState('All');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    return FBISE_EXPRESSIONS.filter((e) => {
      if (chapter !== 'All' && e.chapter !== chapter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.expression.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || String(e.id).includes(q);
    });
  }, [search, chapter]);

  const chapterColors: Record<string, string> = {
    'Basic Gates': 'bg-emerald-100 text-emerald-900 border-emerald-200',
    "De Morgan's": 'bg-sky-100 text-sky-900 border-sky-200',
    'Simplification': 'bg-amber-100 text-amber-900 border-amber-200',
    'Combinational': 'bg-violet-100 text-violet-900 border-violet-200',
    'K-Map': 'bg-rose-100 text-rose-900 border-rose-200',
    'Standard Forms': 'bg-cyan-100 text-cyan-900 border-cyan-200',
    'Cambridge': 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📚</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">FBISE & Cambridge Bank — 300 Expressions</div>
            <div className="text-xs text-muted-foreground">Class 11 & FBISE 2nd Year syllabus. Covers basic gates, De Morgan's, simplification, combinational circuits, K-maps, standard forms, and Cambridge O/A level.</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'} ({FBISE_EXPRESSIONS.length})</Button>
        </div>
        {expanded && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search 300 FBISE/Cambridge expressions…" className="pl-8 h-8 text-sm" />
              </div>
              <div className="flex flex-wrap gap-1">
                {FBISE_CHAPTERS.map((c) => (
                  <button key={c} type="button" onClick={() => setChapter(c)} className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${chapter === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-accent'}`}>{c}</button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{filtered.length} of {FBISE_EXPRESSIONS.length}</span>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-md border border-border p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {filtered.map((e) => (
                  <button key={e.id} type="button" onClick={() => onPick(e.expression)} className="text-left p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors group">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground">#{e.id}</span>
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 ${chapterColors[e.chapter] ?? ''}`}>{e.chapter}</Badge>
                    </div>
                    <div className="font-mono text-[11px] font-semibold group-hover:text-primary transition-colors break-all">{e.expression}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{e.description}</div>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <div className="text-xs text-muted-foreground italic text-center py-4">No expressions match your search.</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
