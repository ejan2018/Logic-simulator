'use client';
import { Wire as WireType, Gate } from '@/lib/logic/types';
import { getGatePinPosition } from './GateSymbol';
import { useCircuitStore } from '@/store/circuitStore';

export function Wire({ wire, fromGate, toGate, signalValue }: { wire: WireType; fromGate: Gate; toGate: Gate; signalValue: 0 | 1 | undefined }) {
  const removeWire = useCircuitStore((s) => s.removeWire);
  const fromPos = getGatePinPosition(fromGate.type, fromGate.x, fromGate.y, -1, fromGate);
  const toPos = getGatePinPosition(toGate.type, toGate.x, toGate.y, wire.toPinIndex, toGate);
  const dx = Math.abs(toPos.x - fromPos.x);
  const cx1 = fromPos.x + dx * 0.5, cy1 = fromPos.y, cx2 = toPos.x - dx * 0.5, cy2 = toPos.y;
  const path = `M ${fromPos.x} ${fromPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toPos.x} ${toPos.y}`;
  const color = signalValue === 1 ? '#10b981' : '#9ca3af';
  const strokeWidth = signalValue === 1 ? 2.5 : 2;
  return (
    <g>
      <path d={path} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); removeWire(wire.id); }}><title>Click to delete wire</title></path>
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" pointerEvents="none" />
      <circle cx={fromPos.x} cy={fromPos.y} r={3} fill={color} pointerEvents="none" />
      <circle cx={toPos.x} cy={toPos.y} r={3} fill={color} pointerEvents="none" />
    </g>
  );
}
