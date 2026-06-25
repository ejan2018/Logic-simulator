'use client';
import { create } from 'zustand';
import { Circuit, Gate, GateType, SignalValue, Wire } from '@/lib/logic/types';
import { GATE_DEFINITIONS } from '@/lib/logic/gates';
import { simulate } from '@/lib/logic/simulator';

let nextId = 1;
function genId(prefix: string): string { return `${prefix}_${Date.now().toString(36)}_${(nextId++).toString(36)}`; }

export interface PendingWire { fromGateId: string; mouseX: number; mouseY: number; }

interface CircuitState {
  circuit: Circuit;
  signalValues: Map<string, SignalValue>;
  clockTick: SignalValue;
  clockRunning: boolean;
  selectedGateId: string | null;
  pendingWire: PendingWire | null;
  draggingGate: { id: string; offsetX: number; offsetY: number } | null;
  zoom: number;
  pan: { x: number; y: number };

  addGate: (type: GateType, x?: number, y?: number, label?: string) => string;
  moveGate: (id: string, x: number, y: number) => void;
  removeGate: (id: string) => void;
  setGateValue: (id: string, value: SignalValue) => void;
  setGateLabel: (id: string, label: string) => void;
  setGatePressed: (id: string, isPressed: boolean) => void;
  setGateInputCount: (id: string, count: number) => void;
  setGateConstantValue: (id: string, value: number) => void;
  setGateStoredValue: (id: string, value: SignalValue) => void;
  setGateTunnelName: (id: string, name: string) => void;
  setGateTransistorType: (id: string, t: 'npn' | 'pnp') => void;
  setGateColor: (id: string, color: string) => void;
  startWire: (fromGateId: string, mouseX: number, mouseY: number) => void;
  updatePendingWireMouse: (mouseX: number, mouseY: number) => void;
  cancelPendingWire: () => void;
  completeWire: (toGateId: string, toPinIndex: number) => void;
  removeWire: (id: string) => void;
  selectGate: (id: string | null) => void;
  startDragGate: (id: string, offsetX: number, offsetY: number) => void;
  stopDragGate: () => void;
  runSimulation: () => void;
  toggleClock: () => void;
  setClockRunning: (running: boolean) => void;
  loadCircuit: (circuit: Circuit) => void;
  clearCircuit: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
}

function initialCircuit(): Circuit {
  return {
    gates: [
      { id: 'g_a', type: 'INPUT', x: 80, y: 80, label: 'A', inputValue: 1 },
      { id: 'g_b', type: 'INPUT', x: 80, y: 200, label: 'B', inputValue: 0 },
      { id: 'g_and', type: 'AND', x: 280, y: 140, inputCount: 2 },
      { id: 'g_out', type: 'OUTPUT', x: 460, y: 140, label: 'Q' },
    ],
    wires: [
      { id: 'w1', fromGateId: 'g_a', toGateId: 'g_and', toPinIndex: 0 },
      { id: 'w2', fromGateId: 'g_b', toGateId: 'g_and', toPinIndex: 1 },
      { id: 'w3', fromGateId: 'g_and', toGateId: 'g_out', toPinIndex: 0 },
    ],
  };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  circuit: initialCircuit(),
  signalValues: new Map(),
  clockTick: 1,
  clockRunning: false,
  selectedGateId: null,
  pendingWire: null,
  draggingGate: null,
  zoom: 1,
  pan: { x: 0, y: 0 },

  addGate: (type, x = 200, y = 200, label) => {
    const id = genId('g');
    const def = GATE_DEFINITIONS[type];
    let autoLabel = label;
    if (!autoLabel && (type === 'INPUT' || type === 'TOGGLE_SWITCH' || type === 'PUSH_BUTTON')) {
      const existing = new Set(get().circuit.gates.filter(g => ['INPUT','TOGGLE_SWITCH','PUSH_BUTTON'].includes(g.type)).map(g => g.label).filter(Boolean));
      autoLabel = 'ABCDEFGHIJKLMNOP'.split('').find(c => !existing.has(c)) ?? 'X';
    }
    const newGate: Gate = {
      id, type, x, y,
      ...((type === 'INPUT' || type === 'TOGGLE_SWITCH') ? { inputValue: 0 as SignalValue } : {}),
      ...(autoLabel ? { label: autoLabel } : {}),
      ...(def.inputs === -1 ? { inputCount: def.defaultInputs ?? 2 } : {}),
      ...(def.isClocked ? { storedValue: 0 as SignalValue } : {}),
      ...(type === 'TRANSISTOR' ? { transistorType: 'npn' as const } : {}),
      ...(type === 'CONSTANT' ? { constantValue: 1 } : {}),
      ...(type === 'BULB' ? { gateColor: '#fbbf24' } : {}),
    };
    set(state => ({ circuit: { ...state.circuit, gates: [...state.circuit.gates, newGate] } }));
    return id;
  },
  moveGate: (id, x, y) => set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, x, y } : g) } })),
  removeGate: (id) => { set(state => ({ circuit: { gates: state.circuit.gates.filter(g => g.id !== id), wires: state.circuit.wires.filter(w => w.fromGateId !== id && w.toGateId !== id) }, selectedGateId: state.selectedGateId === id ? null : state.selectedGateId })); get().runSimulation(); },
  setGateValue: (id, value) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, inputValue: value } : g) } })); get().runSimulation(); },
  setGateLabel: (id, label) => set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, label } : g) } })),
  setGatePressed: (id, isPressed) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, isPressed } : g) } })); get().runSimulation(); },
  setGateInputCount: (id, count) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, inputCount: Math.max(2, Math.min(8, count)) } : g), wires: state.circuit.wires.filter(w => w.toGateId !== id || w.toPinIndex < count) } })); get().runSimulation(); },
  setGateConstantValue: (id, value) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, constantValue: value } : g) } })); get().runSimulation(); },
  setGateStoredValue: (id, value) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, storedValue: value } : g) } })); get().runSimulation(); },
  setGateTunnelName: (id, name) => set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, tunnelName: name } : g) } })),
  setGateTransistorType: (id, t) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, transistorType: t } : g) } })); get().runSimulation(); },
  setGateColor: (id, color) => { set(state => ({ circuit: { ...state.circuit, gates: state.circuit.gates.map(g => g.id === id ? { ...g, gateColor: color } : g) } })); get().runSimulation(); },
  startWire: (fromGateId, mouseX, mouseY) => set({ pendingWire: { fromGateId, mouseX, mouseY } }),
  updatePendingWireMouse: (mouseX, mouseY) => set(state => state.pendingWire ? { pendingWire: { ...state.pendingWire, mouseX, mouseY } } : state),
  cancelPendingWire: () => set({ pendingWire: null }),
  completeWire: (toGateId, toPinIndex) => {
    const { pendingWire, circuit } = get();
    if (!pendingWire) return;
    if (pendingWire.fromGateId === toGateId) { set({ pendingWire: null }); return; }
    const targetGate = circuit.gates.find(g => g.id === toGateId);
    if (!targetGate) { set({ pendingWire: null }); return; }
    const def = GATE_DEFINITIONS[targetGate.type];
    const inputCount = def.inputs === -1 ? (targetGate.inputCount ?? def.defaultInputs ?? 2) : def.inputs;
    if (def.isSource || toPinIndex >= inputCount) { set({ pendingWire: null }); return; }
    const filteredWires = circuit.wires.filter(w => !(w.toGateId === toGateId && w.toPinIndex === toPinIndex));
    const newWire: Wire = { id: genId('w'), fromGateId: pendingWire.fromGateId, toGateId, toPinIndex };
    set({ circuit: { ...circuit, wires: [...filteredWires, newWire] }, pendingWire: null });
    get().runSimulation();
  },
  removeWire: (id) => { set(state => ({ circuit: { ...state.circuit, wires: state.circuit.wires.filter(w => w.id !== id) } })); get().runSimulation(); },
  selectGate: (id) => set({ selectedGateId: id }),
  startDragGate: (id, offsetX, offsetY) => set({ draggingGate: { id, offsetX, offsetY }, selectedGateId: id }),
  stopDragGate: () => set({ draggingGate: null }),
  runSimulation: () => { const { circuit, clockTick } = get(); set({ signalValues: simulate(circuit, { clockTick }) }); },
  toggleClock: () => { set(state => ({ clockTick: state.clockTick === 1 ? 0 : 1 })); get().runSimulation(); },
  setClockRunning: (running) => set({ clockRunning: running }),
  loadCircuit: (circuit) => { set({ circuit, selectedGateId: null, pendingWire: null, draggingGate: null }); get().runSimulation(); },
  clearCircuit: () => set({ circuit: { gates: [], wires: [] }, selectedGateId: null, pendingWire: null, draggingGate: null, signalValues: new Map() }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  zoomIn: () => set(state => ({ zoom: Math.min(3, state.zoom + 0.15) })),
  zoomOut: () => set(state => ({ zoom: Math.max(0.25, state.zoom - 0.15) })),
  resetZoom: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
  setPan: (x, y) => set({ pan: { x, y } }),
}));
