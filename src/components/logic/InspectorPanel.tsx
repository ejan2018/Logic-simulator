'use client';
import { useMemo } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { generateTruthTable, deriveBooleanExpression } from '@/lib/logic/simulator';
import { GATE_DEFINITIONS } from '@/lib/logic/gates';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const OUTPUT_TYPES = ['OUTPUT','BULB','PROBE','SEVEN_SEGMENT','HEX_DIGIT','DOT_MATRIX','TTY'];

// Convert minterm number to product term (e.g. minterm 5 with vars ABC = AB̄C)
function mintermToTerm(minterm: number, variables: string[]): string {
  const n = variables.length;
  const bits = minterm.toString(2).padStart(n, '0');
  let term = '';
  for (let i = 0; i < n; i++) term += bits[i] === '1' ? variables[i] : variables[i] + '\u0304';
  return term;
}

export function InspectorPanel() {
  const circuit = useCircuitStore((s) => s.circuit);
  const selectedGateId = useCircuitStore((s) => s.selectedGateId);
  const setGateLabel = useCircuitStore((s) => s.setGateLabel);
  const setGateValue = useCircuitStore((s) => s.setGateValue);
  const setGateInputCount = useCircuitStore((s) => s.setGateInputCount);
  const setGateConstantValue = useCircuitStore((s) => s.setGateConstantValue);
  const setGateStoredValue = useCircuitStore((s) => s.setGateStoredValue);
  const setGateTransistorType = useCircuitStore((s) => s.setGateTransistorType);
  const setGateColor = useCircuitStore((s) => s.setGateColor);
  const removeGate = useCircuitStore((s) => s.removeGate);
  const signalValues = useCircuitStore((s) => s.signalValues);

  const selectedGate = useMemo(() => circuit.gates.find((g) => g.id === selectedGateId) ?? null, [circuit.gates, selectedGateId]);
  const truthTable = useMemo(() => generateTruthTable(circuit), [circuit]);
  const expressions = useMemo(() => circuit.gates.filter((g) => OUTPUT_TYPES.includes(g.type)).map((g) => ({ id: g.id, label: g.label || 'OUT', expr: deriveBooleanExpression(circuit, g.id) })), [circuit]);
  const isConfigurable = selectedGate && GATE_DEFINITIONS[selectedGate.type].inputs === -1;
  const isClocked = selectedGate && GATE_DEFINITIONS[selectedGate.type].isClocked;

  return (
    <Accordion type="multiple" defaultValue={['selected','truth','expr']} className="w-full">
      <AccordionItem value="selected">
        <AccordionTrigger className="text-sm font-semibold px-2">Selected Gate</AccordionTrigger>
        <AccordionContent className="px-2">
          {!selectedGate ? <div className="text-xs text-muted-foreground italic p-2">Click a gate on the canvas to inspect or edit it.</div> : (
            <div className="flex flex-col gap-3 p-1">
              <div><div className="text-xs text-muted-foreground mb-1">Type</div><div className="text-sm font-semibold">{GATE_DEFINITIONS[selectedGate.type].label}</div><div className="text-[11px] text-muted-foreground mt-0.5">{GATE_DEFINITIONS[selectedGate.type].description}</div></div>
              <div><Label htmlFor="label" className="text-xs">Label (variable name)</Label><Input id="label" value={selectedGate.label ?? ''} onChange={(e) => setGateLabel(selectedGate.id, e.target.value)} placeholder="e.g. A, B, x, y" className="h-8 text-sm" /><div className="text-[10px] text-muted-foreground mt-1">This label shows on the canvas and in the truth table. Use any name like A, B, x, y, z, IN1, etc.</div></div>
              {isConfigurable && (<div><Label className="text-xs">Number of inputs</Label><Select value={String(selectedGate.inputCount ?? 2)} onValueChange={(v) => setGateInputCount(selectedGate.id, Number(v))}><SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent>{[2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>{n} inputs</SelectItem>)}</SelectContent></Select></div>)}
              {(selectedGate.type === 'INPUT' || selectedGate.type === 'TOGGLE_SWITCH') && (<div><Label className="text-xs">Value</Label><div className="flex gap-2 mt-1"><Button type="button" size="sm" variant={(selectedGate.inputValue ?? 0) === 0 ? 'default' : 'outline'} onClick={() => setGateValue(selectedGate.id, 0)} className="h-7">0</Button><Button type="button" size="sm" variant={(selectedGate.inputValue ?? 0) === 1 ? 'default' : 'outline'} onClick={() => setGateValue(selectedGate.id, 1)} className="h-7">1</Button></div><div className="text-[10px] text-muted-foreground mt-1">Tip: Click the gate on the canvas to toggle, or drag to move it.</div></div>)}
              {selectedGate.type === 'CONSTANT' && (<div><Label className="text-xs">Constant Value</Label><div className="flex gap-2 mt-1"><Button type="button" size="sm" variant={(selectedGate.constantValue ?? 1) === 0 ? 'default' : 'outline'} onClick={() => setGateConstantValue(selectedGate.id, 0)} className="h-7">0</Button><Button type="button" size="sm" variant={(selectedGate.constantValue ?? 1) === 1 ? 'default' : 'outline'} onClick={() => setGateConstantValue(selectedGate.id, 1)} className="h-7">1</Button></div></div>)}
              {selectedGate.type === 'TRANSISTOR' && (<div><Label className="text-xs">Transistor Type</Label><Select value={selectedGate.transistorType ?? 'npn'} onValueChange={(v) => setGateTransistorType(selectedGate.id, v as 'npn'|'pnp')}><SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="npn">NPN (active high)</SelectItem><SelectItem value="pnp">PNP (active low)</SelectItem></SelectContent></Select></div>)}
              {selectedGate.type === 'BULB' && (<div><Label className="text-xs">Bulb Glow Color</Label><div className="flex items-center gap-2 mt-1.5"><input type="color" value={selectedGate.gateColor ?? '#fbbf24'} onChange={(e) => setGateColor(selectedGate.id, e.target.value)} className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent p-0.5" title="Pick a custom color" /><div className="flex flex-wrap gap-1.5">{[{n:'Yellow',c:'#fbbf24'},{n:'Red',c:'#ef4444'},{n:'Green',c:'#10b981'},{n:'Blue',c:'#3b82f6'},{n:'Purple',c:'#8b5cf6'},{n:'Pink',c:'#ec4899'},{n:'Cyan',c:'#06b6d4'},{n:'Orange',c:'#f97316'},{n:'White',c:'#f8fafc'}].map((p) => <button key={p.c} type="button" onClick={() => setGateColor(selectedGate.id, p.c)} title={p.n} className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110" style={{ background: p.c, borderColor: (selectedGate.gateColor ?? '#fbbf24') === p.c ? '#1f2937' : 'rgba(0,0,0,0.15)' }} />)}</div></div><div className="text-[10px] text-muted-foreground mt-1.5">Pick any color — the bulb will glow that color when turned on.</div></div>)}
              {isClocked && (<div><Label className="text-xs">Stored Value (Q)</Label><div className="flex gap-2 mt-1"><Button type="button" size="sm" variant={(selectedGate.storedValue ?? 0) === 0 ? 'default' : 'outline'} onClick={() => setGateStoredValue(selectedGate.id, 0)} className="h-7">Q = 0</Button><Button type="button" size="sm" variant={(selectedGate.storedValue ?? 0) === 1 ? 'default' : 'outline'} onClick={() => setGateStoredValue(selectedGate.id, 1)} className="h-7">Q = 1</Button></div></div>)}
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Output</span><span className="font-mono font-semibold">{signalValues.get(selectedGate.id) ?? 0}</span></div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeGate(selectedGate.id)} className="text-destructive border-destructive/30 hover:bg-destructive/5"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete Gate</Button>
            </div> )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="truth">
        <AccordionTrigger className="text-sm font-semibold px-2">Truth Table{truthTable.rows.length > 0 && <span className="ml-auto text-[10px] text-muted-foreground mr-2">{truthTable.inputLabels.length} in · {truthTable.outputLabels.length} out</span>}</AccordionTrigger>
        <AccordionContent className="px-2">
          {truthTable.inputLabels.length === 0 && truthTable.outputLabels.length === 0 ? <div className="text-xs text-muted-foreground italic p-2">Add at least one Input gate and one Output gate to see a truth table.</div> : (
            <div className="flex flex-col gap-2">
              {/* Show expression above table */}
              {expressions.length > 0 && (
                <div className="text-[11px] p-2 rounded-md bg-muted/30 border border-border">
                  {expressions.map((e, i) => <div key={i} className="font-mono"><span className="text-primary font-semibold">{e.label}</span> = <span className="text-foreground/80">{e.expr}</span></div>)}
                </div>
              )}
              {/* Truth table with Working column */}
              <div className="overflow-auto max-h-72 rounded-md border border-border">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {truthTable.inputLabels.map((l, i) => <th key={`in-${i}`} className="px-2 py-1 text-center font-semibold border-b border-border">{l}</th>)}
                      <th className="px-2 py-1 text-center font-semibold border-b border-border text-muted-foreground bg-muted/60">m</th>
                      <th className="px-2 py-1 text-center font-semibold border-b border-border text-muted-foreground bg-muted/60">Working</th>
                      {truthTable.outputLabels.length > 0 && <th className="px-1 border-b border-border bg-border/30"></th>}
                      {truthTable.outputLabels.map((l, i) => <th key={`out-${i}`} className="px-2 py-1 text-center font-semibold border-b border-border text-primary">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {truthTable.rows.map((row, i) => {
                      const nIn = truthTable.inputLabels.length;
                      const inputVals = row.slice(0, nIn);
                      const outputVals = row.slice(nIn);
                      const minterm = i;
                      const term = nIn > 0 ? mintermToTerm(minterm, truthTable.inputLabels) : '';
                      const isOne = outputVals.some(v => v === 1);
                      return (
                        <tr key={i} className={isOne ? 'bg-primary/5' : 'even:bg-muted/30'}>
                          {inputVals.map((v, j) => <td key={j} className="px-2 py-1 text-center">{v}</td>)}
                          <td className="px-2 py-1 text-center text-muted-foreground">{minterm}</td>
                          <td className="px-2 py-1 text-center text-[10px] text-muted-foreground/70">{term}</td>
                          {nIn > 0 && truthTable.outputLabels.length > 0 && <td className="px-1 text-muted-foreground/40">·</td>}
                          {outputVals.map((v, j) => <td key={j} className="px-2 py-1 text-center font-bold text-primary">{v}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-muted-foreground">
                <strong>m</strong> = minterm number · <strong>Working</strong> = product term for that row
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="expr">
        <AccordionTrigger className="text-sm font-semibold px-2">Boolean Expressions</AccordionTrigger>
        <AccordionContent className="px-2">
          {expressions.length === 0 ? <div className="text-xs text-muted-foreground italic p-2">Add an Output gate to derive its boolean expression.</div> : <div className="flex flex-col gap-2 p-1">{expressions.map((e) => <div key={e.id} className="rounded-md border border-border bg-muted/30 p-2"><div className="text-[11px] font-semibold text-primary mb-0.5">{e.label} =</div><div className="text-xs font-mono break-words">{e.expr}</div></div>)}</div>}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
