'use client';
import { useCircuitStore } from '@/store/circuitStore';

export function CircuitDevtools() {
  const gates = useCircuitStore((s) => s.circuit.gates);
  const wires = useCircuitStore((s) => s.circuit.wires);
  const inputCount = gates.filter((g) => g.type === 'INPUT').length;
  const outputCount = gates.filter((g) => g.type === 'OUTPUT').length;
  return (
    <div className="flex items-center gap-3 font-mono text-[11px]">
      <span><span className="text-muted-foreground">gates:</span> {gates.length}</span>
      <span><span className="text-muted-foreground">wires:</span> {wires.length}</span>
      <span><span className="text-muted-foreground">in:</span> {inputCount}</span>
      <span><span className="text-muted-foreground">out:</span> {outputCount}</span>
    </div>
  );
}
