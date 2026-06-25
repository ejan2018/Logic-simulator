// Core types for the logic circuit simulator

export type GateType =
  | 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'BUFFER'
  | 'INPUT' | 'OUTPUT' | 'HIGH' | 'LOW' | 'CLOCK'
  | 'PUSH_BUTTON' | 'TOGGLE_SWITCH' | 'VCC' | 'GROUND' | 'CONSTANT'
  | 'BULB' | 'SEVEN_SEGMENT' | 'PROBE' | 'HEX_DIGIT' | 'DOT_MATRIX' | 'TTY'
  | 'PIN' | 'TUNNEL' | 'PULL_UP' | 'PULL_DOWN' | 'BIT_EXTENDER'
  | 'TRANSISTOR' | 'TRANSMISSION_GATE' | 'CONTROLLED_BUFFER'
  | 'PARITY_EVEN' | 'PARITY_ODD'
  | 'MUX' | 'DEMUX' | 'DECODER' | 'PRIORITY_ENCODER' | 'BIT_SELECTOR'
  | 'ADDER' | 'SUBTRACTOR' | 'MULTIPLIER' | 'DIVIDER' | 'NEGATOR' | 'COMPARATOR' | 'SHIFTER' | 'BIT_ADDER' | 'BIT_FINDER'
  | 'D_FLIP_FLOP' | 'T_FLIP_FLOP' | 'JK_FLIP_FLOP' | 'SR_FLIP_FLOP' | 'REGISTER' | 'COUNTER' | 'SHIFT_REGISTER' | 'RANDOM' | 'RAM' | 'ROM'
  | 'JOYSTICK' | 'KEYBOARD';

export type SignalValue = 0 | 1;

export interface Gate {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputValue?: SignalValue;
  label?: string;
  isPressed?: boolean;
  inputCount?: number;
  constantValue?: number;
  storedValue?: SignalValue;
  tunnelName?: string;
  transistorType?: 'npn' | 'pnp';
  shiftAmount?: number;
  gateColor?: string;
  ttyText?: string;
}

export interface Wire {
  id: string;
  fromGateId: string;
  toGateId: string;
  toPinIndex: number;
}

export interface Circuit {
  gates: Gate[];
  wires: Wire[];
}

export type GateCategory = 'input' | 'gate' | 'output' | 'wiring' | 'plexer' | 'arithmetic' | 'memory' | 'io';

export interface GateDefinition {
  type: GateType;
  label: string;
  description: string;
  inputs: number; // -1 = configurable
  outputs: number;
  isSource: boolean;
  isSink: boolean;
  defaultInputs?: number;
  evaluate: (inputs: SignalValue[], gate?: Gate) => SignalValue;
  category: GateCategory;
  isClocked?: boolean;
}
