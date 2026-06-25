import { Circuit, Gate, GateType, SignalValue } from './types';
import { GATE_DEFINITIONS, getGateInputs } from './gates';

const INPUT_TYPES = ['INPUT', 'TOGGLE_SWITCH', 'PUSH_BUTTON', 'JOYSTICK', 'KEYBOARD'];
const OUTPUT_TYPES = ['OUTPUT', 'BULB', 'PROBE', 'SEVEN_SEGMENT', 'HEX_DIGIT', 'DOT_MATRIX', 'TTY'];

function getSourceValue(gate: Gate, clockTick: SignalValue): SignalValue {
  switch (gate.type) {
    case 'INPUT': case 'TOGGLE_SWITCH': return gate.inputValue ?? 0;
    case 'PUSH_BUTTON': return gate.isPressed ? 1 : 0;
    case 'HIGH': case 'VCC': return 1;
    case 'LOW': case 'GROUND': return 0;
    case 'CLOCK': return clockTick;
    case 'CONSTANT': return (gate.constantValue ?? 1) !== 0 ? 1 : 0;
    case 'JOYSTICK': case 'KEYBOARD': return gate.inputValue ?? 0;
    default: return 0;
  }
}

export function simulate(circuit: Circuit, options: { clockTick?: SignalValue; maxIterations?: number; prevClockTick?: SignalValue } = {}): Map<string, SignalValue> {
  const { clockTick = 1, maxIterations = 1000, prevClockTick = 0 } = options;
  const values = new Map<string, SignalValue>();
  const inputSources = new Map<string, string>();
  for (const wire of circuit.wires) inputSources.set(`${wire.toGateId}:${wire.toPinIndex}`, wire.fromGateId);

  for (const gate of circuit.gates) {
    const def = GATE_DEFINITIONS[gate.type];
    if (def.isSource) values.set(gate.id, getSourceValue(gate, clockTick));
  }

  let changed = true; let iterations = 0;
  while (changed && iterations < maxIterations) {
    changed = false; iterations++;
    for (const gate of circuit.gates) {
      const def = GATE_DEFINITIONS[gate.type];
      if (def.isSource) continue;
      if (def.isClocked) {
        const out = gate.storedValue ?? 0;
        if (values.get(gate.id) !== out) { values.set(gate.id, out); changed = true; }
        continue;
      }
      const inputCount = getGateInputs(gate);
      const inputValues: SignalValue[] = [];
      for (let pin = 0; pin < inputCount; pin++) {
        const srcId = inputSources.get(`${gate.id}:${pin}`);
        inputValues.push(srcId ? (values.get(srcId) ?? 0) : 0);
      }
      const newOutput = def.evaluate(inputValues, gate);
      if (values.get(gate.id) !== newOutput) { values.set(gate.id, newOutput); changed = true; }
    }
  }

  const clockRose = prevClockTick === 0 && clockTick === 1;
  if (clockRose) {
    for (const gate of circuit.gates) {
      const def = GATE_DEFINITIONS[gate.type];
      if (!def.isClocked) continue;
      updateClockedGate(gate, circuit, values);
    }
  }
  return values;
}

function updateClockedGate(gate: Gate, circuit: Circuit, values: Map<string, SignalValue>) {
  const inputSources = new Map<string, string>();
  for (const wire of circuit.wires) inputSources.set(`${wire.toGateId}:${wire.toPinIndex}`, wire.fromGateId);
  const getInput = (pin: number): SignalValue => {
    const src = inputSources.get(`${gate.id}:${pin}`);
    return src ? (values.get(src) ?? 0) : 0;
  };
  switch (gate.type) {
    case 'D_FLIP_FLOP': gate.storedValue = getInput(0); break;
    case 'T_FLIP_FLOP': if (getInput(0) === 1) gate.storedValue = (gate.storedValue ?? 0) === 1 ? 0 : 1; break;
    case 'JK_FLIP_FLOP': {
      const j = getInput(0), k = getInput(1);
      if (j === 1 && k === 1) gate.storedValue = (gate.storedValue ?? 0) === 1 ? 0 : 1;
      else if (j === 1) gate.storedValue = 1;
      else if (k === 1) gate.storedValue = 0;
      break;
    }
    case 'SR_FLIP_FLOP': {
      const s = getInput(0), r = getInput(1);
      if (s === 1) gate.storedValue = 1;
      else if (r === 1) gate.storedValue = 0;
      break;
    }
    case 'REGISTER': gate.storedValue = getInput(0); break;
    case 'COUNTER': gate.storedValue = ((gate.storedValue ?? 0) + 1) % 2; break;
    case 'SHIFT_REGISTER': gate.storedValue = getInput(0); break;
    case 'RANDOM': gate.storedValue = Math.random() > 0.5 ? 1 : 0; break;
    case 'RAM': gate.storedValue = getInput(0); break;
  }
}

export function generateTruthTable(circuit: Circuit) {
  const inputGates = circuit.gates.filter((g) => INPUT_TYPES.includes(g.type));
  const outputGates = circuit.gates.filter((g) => OUTPUT_TYPES.includes(g.type));
  const inputLabels = inputGates.map((g, i) => g.label || `IN${i + 1}`);
  const outputLabels = outputGates.map((g, i) => g.label || `OUT${i + 1}`);
  const rows: SignalValue[][] = [];
  const n = inputGates.length;

  if (n === 0) {
    const values = simulate({ ...circuit, gates: circuit.gates.map((g) => INPUT_TYPES.includes(g.type) ? { ...g, inputValue: 0 as SignalValue, isPressed: false } : g) }, { clockTick: 0 });
    rows.push([...outputGates.map((g) => values.get(g.id) ?? 0)]);
    return { inputLabels, outputLabels, rows, inputGateIds: inputGates.map((g) => g.id), outputGateIds: outputGates.map((g) => g.id) };
  }

  const total = 1 << n;
  for (let combo = 0; combo < total; combo++) {
    const newGates: Gate[] = circuit.gates.map((g) => {
      if (INPUT_TYPES.includes(g.type)) {
        const idx = inputGates.findIndex((ig) => ig.id === g.id);
        if (idx === -1) return g;
        const bit = (combo >> (n - 1 - idx)) & 1;
        if (g.type === 'PUSH_BUTTON') return { ...g, isPressed: bit === 1 };
        return { ...g, inputValue: (bit === 1 ? 1 : 0) as SignalValue };
      }
      return g;
    });
    const values = simulate({ ...circuit, gates: newGates }, { clockTick: 0 });
    const inValues = inputGates.map((_, idx) => ((combo >> (n - 1 - idx)) & 1 === 1 ? 1 : 0) as SignalValue);
    rows.push([...inValues, ...outputGates.map((g) => values.get(g.id) ?? 0)]);
  }
  return { inputLabels, outputLabels, rows, inputGateIds: inputGates.map((g) => g.id), outputGateIds: outputGates.map((g) => g.id) };
}

export function deriveBooleanExpression(circuit: Circuit, outputGateId: string): string {
  const inputSources = new Map<string, string>();
  for (const wire of circuit.wires) inputSources.set(`${wire.toGateId}:${wire.toPinIndex}`, wire.fromGateId);
  const gateById = new Map<string, Gate>();
  for (const g of circuit.gates) gateById.set(g.id, g);
  const visiting = new Set<string>();

  const exprFor = (gateId: string, depth: number): string => {
    if (depth > 20) return '?';
    const gate = gateById.get(gateId);
    if (!gate) return '?';
    if (INPUT_TYPES.includes(gate.type)) return gate.label || 'IN';
    if (gate.type === 'HIGH' || gate.type === 'VCC') return '1';
    if (gate.type === 'LOW' || gate.type === 'GROUND') return '0';
    if (gate.type === 'CLOCK') return 'CLK';
    if (gate.type === 'CONSTANT') return String(gate.constantValue ?? 1);
    if (OUTPUT_TYPES.includes(gate.type)) {
      const src = inputSources.get(`${gate.id}:0`);
      return src ? exprFor(src, depth + 1) : '?';
    }
    if (visiting.has(gateId)) return '(loop)';
    visiting.add(gateId);
    const def = GATE_DEFINITIONS[gate.type];
    const inputCount = def.inputs === -1 ? (gate.inputCount ?? def.defaultInputs ?? 2) : def.inputs;
    const inputIds: string[] = [];
    for (let pin = 0; pin < inputCount; pin++) {
      const src = inputSources.get(`${gate.id}:${pin}`);
      inputIds.push(src ? exprFor(src, depth + 1) : '0');
    }
    visiting.delete(gateId);
    switch (gate.type) {
      case 'NOT': return `NOT ${inputIds[0]}`;
      case 'BUFFER': case 'PIN': case 'TUNNEL': case 'PULL_UP': case 'PULL_DOWN': case 'BIT_EXTENDER': return inputIds[0];
      case 'AND': return `(${inputIds.join(' AND ')})`;
      case 'OR': return `(${inputIds.join(' OR ')})`;
      case 'NAND': return `(${inputIds.join(' NAND ')})`;
      case 'NOR': return `(${inputIds.join(' NOR ')})`;
      case 'XOR': return `(${inputIds.join(' XOR ')})`;
      case 'XNOR': return `(${inputIds.join(' XNOR ')})`;
      case 'MUX': return `MUX(${inputIds.join(',')})`;
      case 'ADDER': return `Adder(${inputIds[0]},${inputIds[1]},${inputIds[2]})`;
      case 'D_FLIP_FLOP': return `D_FF(Q=${gate.storedValue ?? 0})`;
      default: return def.label;
    }
  };
  return exprFor(outputGateId, 0);
}

export { GATE_DEFINITIONS };
export type { GateType };
