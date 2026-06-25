'use client';
import { GatePalette } from './GatePalette';
import { InspectorPanel } from './InspectorPanel';
import { CircuitCanvas } from './CircuitCanvas';
import { useCircuitStore } from '@/store/circuitStore';
import { Button } from '@/components/ui/button';
import { Play, Square, StepForward, Save, Upload, Trash2 } from 'lucide-react';
import { useRef } from 'react';

export function LogicSimulator() {
  const clockRunning = useCircuitStore((s) => s.clockRunning);
  const setClockRunning = useCircuitStore((s) => s.setClockRunning);
  const toggleClock = useCircuitStore((s) => s.toggleClock);
  const circuit = useCircuitStore((s) => s.circuit);
  const loadCircuit = useCircuitStore((s) => s.loadCircuit);
  const clearCircuit = useCircuitStore((s) => s.clearCircuit);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasClock = circuit.gates.some((g) => g.type === 'CLOCK');
  const handleSave = () => { const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'circuit.json'; a.click(); URL.revokeObjectURL(url); };
  const handleLoad = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const parsed = JSON.parse(ev.target?.result as string); if (parsed.gates && parsed.wires) loadCircuit(parsed); } catch {} }; reader.readAsText(file); e.target.value = ''; };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full lg:items-start">
      <aside className="lg:w-64 lg:flex-shrink-0 order-2 lg:order-1 lg:sticky lg:top-[72px]"><div className="rounded-lg border border-border bg-card p-3 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto custom-scrollbar"><GatePalette /></div></aside>
      <main className="flex-1 order-1 lg:order-2 min-w-0 lg:w-auto"><div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2"><div className="text-sm font-semibold">Circuit Canvas</div><div className="ml-auto flex flex-wrap items-center gap-2">
          {hasClock && <><Button type="button" size="sm" variant={clockRunning ? 'default' : 'outline'} onClick={() => setClockRunning(!clockRunning)}>{clockRunning ? <Square className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}{clockRunning ? 'Stop Clock' : 'Run Clock'}</Button><Button type="button" size="sm" variant="outline" onClick={toggleClock}><StepForward className="h-3.5 w-3.5 mr-1" />Step</Button></>}
          <Button type="button" size="sm" variant="outline" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
          <Button type="button" size="sm" variant="outline" onClick={handleLoad}><Upload className="h-3.5 w-3.5 mr-1" />Load</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { if (confirm('Clear all gates and wires?')) clearCircuit(); }} className="text-destructive border-destructive/30 hover:bg-destructive/5"><Trash2 className="h-3.5 w-3.5 mr-1" />Clear</Button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
        </div></div>
        <div className="text-[11px] text-muted-foreground leading-relaxed"><span className="font-semibold">How to use:</span> Click a gate in the left palette to add it · <span className="font-semibold">drag any gate</span> to move it · click an <span className="font-semibold">output pin</span> then click an <span className="font-semibold">input pin</span> to wire them · click a wire to delete · click an Input gate to toggle · <span className="font-semibold">scroll to zoom</span> · <span className="font-semibold">drag background to pan</span>.</div>
        <div className="overflow-auto rounded-md"><CircuitCanvas width={1200} height={720} /></div>
      </div></main>
      <aside className="lg:w-72 lg:flex-shrink-0 order-3 lg:sticky lg:top-[72px]"><div className="rounded-lg border border-border bg-card p-3 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto custom-scrollbar"><InspectorPanel /></div></aside>
    </div>
  );
}
