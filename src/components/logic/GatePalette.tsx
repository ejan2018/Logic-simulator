'use client';
import { PALETTE_ORDER, GATE_DEFINITIONS, CATEGORY_LABELS } from '@/lib/logic/gates';
import { GateType, GateCategory } from '@/lib/logic/types';
import { useCircuitStore } from '@/store/circuitStore';
import { GateSymbol } from './GateSymbol';
import { CIRCUIT_EXAMPLES } from '@/lib/logic/booleanLaws';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const CATEGORY_ORDER: GateCategory[] = ['input','output','gate','wiring','plexer','arithmetic','memory','io'];

export function GatePalette() {
  const addGate = useCircuitStore((s) => s.addGate);
  const loadCircuit = useCircuitStore((s) => s.loadCircuit);
  const clearCircuit = useCircuitStore((s) => s.clearCircuit);
  const circuit = useCircuitStore((s) => s.circuit);
  const handleAdd = (type: GateType) => { const offset = (circuit.gates.length % 8) * 30; addGate(type, 160 + offset, 160 + offset); };
  const handleLoadExample = (id: string) => { const ex = CIRCUIT_EXAMPLES.find((e) => e.id === id); if (!ex) return; try { loadCircuit(JSON.parse(ex.circuit)); } catch {} };
  const groups: { category: GateCategory; types: GateType[] }[] = CATEGORY_ORDER.map((c) => ({ category: c, types: [] }));
  for (const type of PALETTE_ORDER) { const def = GATE_DEFINITIONS[type]; const g = groups.find((g) => g.category === def.category); if (g) g.types.push(type); }
  const nonEmpty = groups.filter((g) => g.types.length > 0);
  const defaultOpen = nonEmpty.map((g) => `palette-${g.category}`).concat(['examples']);

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
      {nonEmpty.map((group) => (
        <AccordionItem key={group.category} value={`palette-${group.category}`}>
          <AccordionTrigger className="text-sm font-semibold px-2">{CATEGORY_LABELS[group.category]} ({group.types.length})</AccordionTrigger>
          <AccordionContent className="px-2">
            <div className="grid grid-cols-2 gap-2">
              {group.types.map((type) => { const def = GATE_DEFINITIONS[type]; return (
                <button key={type} type="button" onClick={() => handleAdd(type)} className="group flex flex-col items-center gap-1 p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors cursor-pointer" title={def.description}>
                  <div className="flex items-center justify-center h-[60px]"><GateSymbol type={type} width={70} height={50} /></div>
                  <span className="text-[11px] font-medium text-center leading-tight">{def.label}</span>
                </button> ); })}
            </div>
          </AccordionContent>
        </AccordionItem> ))}
      <AccordionItem value="examples">
        <AccordionTrigger className="text-sm font-semibold px-2">Examples</AccordionTrigger>
        <AccordionContent className="px-2">
          <div className="flex flex-col gap-2">
            {CIRCUIT_EXAMPLES.map((ex) => <button key={ex.id} type="button" onClick={() => handleLoadExample(ex.id)} className="text-left p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors"><div className="text-sm font-semibold">{ex.name}</div><div className="text-[11px] text-muted-foreground">{ex.description}</div></button>)}
            <Button variant="outline" size="sm" onClick={() => clearCircuit()} className="mt-1 text-destructive border-destructive/30 hover:bg-destructive/5">Clear Canvas</Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
