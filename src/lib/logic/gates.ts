import { GateDefinition, GateType, Gate, SignalValue } from './types';

function countOnes(inputs: SignalValue[]): number {
  return inputs.filter((v) => v === 1).length;
}

function readBits(inputs: SignalValue[], start: number, count: number): number {
  let n = 0;
  for (let i = 0; i < count; i++) {
    if (inputs[start + i] === 1) n |= (1 << i);
  }
  return n;
}

export const GATE_DEFINITIONS: Record<GateType, GateDefinition> = {
  AND: { type:'AND',label:'AND',description:'Output is 1 only when all inputs are 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(i.every(v=>v===1)?1:0) },
  OR: { type:'OR',label:'OR',description:'Output is 1 when at least one input is 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(i.some(v=>v===1)?1:0) },
  NOT: { type:'NOT',label:'NOT',description:'Output is the inverse of the input',inputs:1,outputs:1,isSource:false,isSink:false,category:'gate',evaluate:(i)=>(i[0]===1?0:1) },
  BUFFER: { type:'BUFFER',label:'Buffer',description:'Passes input to output unchanged',inputs:1,outputs:1,isSource:false,isSink:false,category:'gate',evaluate:(i)=>(i[0]===1?1:0) },
  NAND: { type:'NAND',label:'NAND',description:'AND followed by NOT',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(i.every(v=>v===1)?0:1) },
  NOR: { type:'NOR',label:'NOR',description:'OR followed by NOT',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(i.some(v=>v===1)?0:1) },
  XOR: { type:'XOR',label:'XOR',description:'Output is 1 when odd number of inputs are 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(countOnes(i)%2===1?1:0) },
  XNOR: { type:'XNOR',label:'XNOR',description:'Output is 1 when even number of inputs are 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'gate',evaluate:(i)=>(countOnes(i)%2===0?1:0) },
  PARITY_EVEN: { type:'PARITY_EVEN',label:'Even Parity',description:'Output is 1 when even number of inputs are 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:3,category:'gate',evaluate:(i)=>(countOnes(i)%2===0?1:0) },
  PARITY_ODD: { type:'PARITY_ODD',label:'Odd Parity',description:'Output is 1 when odd number of inputs are 1',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:3,category:'gate',evaluate:(i)=>(countOnes(i)%2===1?1:0) },

  INPUT: { type:'INPUT',label:'Input',description:'User-controlled input switch — click to toggle',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:(i)=>(i.length>0?i[0]:0) },
  PUSH_BUTTON: { type:'PUSH_BUTTON',label:'Push Button',description:'Momentary switch — outputs 1 while held',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:(i)=>(i.length>0?i[0]:0) },
  TOGGLE_SWITCH: { type:'TOGGLE_SWITCH',label:'Toggle Switch',description:'Latching toggle switch',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:(i)=>(i.length>0?i[0]:0) },
  CLOCK: { type:'CLOCK',label:'Clock',description:'Auto-toggling clock signal',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:(i)=>(i.length>0?i[0]:0) },
  HIGH: { type:'HIGH',label:'High (1)',description:'Constant logical 1',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:()=>1 },
  LOW: { type:'LOW',label:'Low (0)',description:'Constant logical 0',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:()=>0 },
  VCC: { type:'VCC',label:'VCC',description:'Power supply — constant 1',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:()=>1 },
  GROUND: { type:'GROUND',label:'GND',description:'Ground — constant 0',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:()=>0 },
  CONSTANT: { type:'CONSTANT',label:'Constant',description:'Outputs a fixed value (set in inspector)',inputs:0,outputs:1,isSource:true,isSink:false,category:'input',evaluate:(_i,gate)=>((gate?.constantValue??1)!==0?1:0) },

  OUTPUT: { type:'OUTPUT',label:'LED',description:'LED display — lights up when signal is 1',inputs:1,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>(i[0]??0) },
  BULB: { type:'BULB',label:'Light Bulb',description:'Incandescent bulb — glows warm yellow',inputs:1,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>(i[0]??0) },
  PROBE: { type:'PROBE',label:'Probe',description:'Text readout showing 0 or 1',inputs:1,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>(i[0]??0) },
  SEVEN_SEGMENT: { type:'SEVEN_SEGMENT',label:'7-Segment',description:'4-bit binary → hex digit 0-F',inputs:4,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>{const v=(i[3]??0)*8+(i[2]??0)*4+(i[1]??0)*2+(i[0]??0);return v>0?1:0;} },
  HEX_DIGIT: { type:'HEX_DIGIT',label:'Hex Display',description:'4-bit binary → 0-F',inputs:4,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>{const v=(i[3]??0)*8+(i[2]??0)*4+(i[1]??0)*2+(i[0]??0);return v>0?1:0;} },
  DOT_MATRIX: { type:'DOT_MATRIX',label:'Dot Matrix',description:'5x7 LED matrix (7 inputs)',inputs:7,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>(i.some(v=>v===1)?1:0) },
  TTY: { type:'TTY',label:'TTY Terminal',description:'Text output',inputs:1,outputs:0,isSource:false,isSink:true,category:'output',evaluate:(i)=>(i[0]??0) },

  PIN: { type:'PIN',label:'Pin',description:'Generic pin (acts as input or output)',inputs:1,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]??0) },
  TUNNEL: { type:'TUNNEL',label:'Tunnel',description:'Wireless label connection',inputs:1,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]??0) },
  PULL_UP: { type:'PULL_UP',label:'Pull Up',description:'Pull-up resistor — defaults to 1',inputs:1,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]===1?1:1) },
  PULL_DOWN: { type:'PULL_DOWN',label:'Pull Down',description:'Pull-down resistor — defaults to 0',inputs:1,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]===1?1:0) },
  BIT_EXTENDER: { type:'BIT_EXTENDER',label:'Bit Extender',description:'Sign or zero extends a bit',inputs:1,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]??0) },
  TRANSISTOR: { type:'TRANSISTOR',label:'Transistor',description:'NPN/PNP switch — gate controls source→drain',inputs:2,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i,gate)=>{const isNpn=gate?.transistorType!=='pnp';if(isNpn)return i[0]===1?(i[1]??0):0;return i[0]===0?(i[1]??0):0;} },
  TRANSMISSION_GATE: { type:'TRANSMISSION_GATE',label:'Transmission Gate',description:'Analog pass-through controlled by gate',inputs:2,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]===1?(i[1]??0):0) },
  CONTROLLED_BUFFER: { type:'CONTROLLED_BUFFER',label:'Tri-State Buffer',description:'Buffer with enable',inputs:2,outputs:1,isSource:false,isSink:false,category:'wiring',evaluate:(i)=>(i[0]===1?(i[1]??0):0) },

  MUX: { type:'MUX',label:'Multiplexer',description:'Select 1 of N inputs based on select lines',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:4,category:'plexer',evaluate:(i,gate)=>{const total=i.length;const dataCount=gate?.inputCount??Math.floor(total/2);const selCount=total-dataCount;if(dataCount<=0)return 0;const sel=readBits(i,dataCount,selCount);return i[sel]??0;} },
  DEMUX: { type:'DEMUX',label:'Demultiplexer',description:'Routes 1 input to 1 of N outputs',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:3,category:'plexer',evaluate:(i)=>(i[0]??0) },
  DECODER: { type:'DECODER',label:'Decoder',description:'Binary to one-hot',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'plexer',evaluate:(i)=>(i.some(v=>v===1)?1:0) },
  PRIORITY_ENCODER: { type:'PRIORITY_ENCODER',label:'Priority Encoder',description:'One-hot to binary (highest index wins)',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:4,category:'plexer',evaluate:(i)=>{for(let k=i.length-1;k>=0;k--){if(i[k]===1)return 1;}return 0;} },
  BIT_SELECTOR: { type:'BIT_SELECTOR',label:'Bit Selector',description:'Extracts one bit from a multi-bit input',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:2,category:'plexer',evaluate:(i)=>{if(i.length===0)return 0;return i[0]??0;} },

  ADDER: { type:'ADDER',label:'Adder',description:'Full adder: A + B + Cin → Sum (mod 2)',inputs:3,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>((i[0]??0)+(i[1]??0)+(i[2]??0))%2 },
  SUBTRACTOR: { type:'SUBTRACTOR',label:'Subtractor',description:'Full subtractor: A − B − Bin → Diff (mod 2)',inputs:3,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>(((i[0]??0)-(i[1]??0)-(i[2]??0))+4)%2 },
  MULTIPLIER: { type:'MULTIPLIER',label:'Multiplier',description:'Multiplies two single-bit inputs (AND)',inputs:2,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>((i[0]===1&&i[1]===1)?1:0) },
  DIVIDER: { type:'DIVIDER',label:'Divider',description:'Divides A by B',inputs:2,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>(i[1]===1?(i[0]??0):0) },
  NEGATOR: { type:'NEGATOR',label:'Negator',description:'Two\'s complement negation (NOT for single bit)',inputs:1,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>(i[0]===1?0:1) },
  COMPARATOR: { type:'COMPARATOR',label:'Comparator',description:'Compares two inputs: output = 1 if A > B',inputs:2,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>((i[0]??0)>(i[1]??0)?1:0) },
  SHIFTER: { type:'SHIFTER',label:'Shifter',description:'Logical left/right bit shift',inputs:1,outputs:1,isSource:false,isSink:false,category:'arithmetic',evaluate:(i)=>(i[0]??0) },
  BIT_ADDER: { type:'BIT_ADDER',label:'Bit Adder',description:'Counts number of 1s (parity)',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:4,category:'arithmetic',evaluate:(i)=>(countOnes(i)%2) },
  BIT_FINDER: { type:'BIT_FINDER',label:'Bit Finder',description:'Finds first/last 1 in input',inputs:-1,outputs:1,isSource:false,isSink:false,defaultInputs:4,category:'arithmetic',evaluate:(i)=>(i.some(v=>v===1)?1:0) },

  D_FLIP_FLOP: { type:'D_FLIP_FLOP',label:'D Flip-Flop',description:'Clocked D flip-flop',inputs:2,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  T_FLIP_FLOP: { type:'T_FLIP_FLOP',label:'T Flip-Flop',description:'Toggle flip-flop',inputs:2,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  JK_FLIP_FLOP: { type:'JK_FLIP_FLOP',label:'JK Flip-Flop',description:'Universal JK flip-flop',inputs:3,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  SR_FLIP_FLOP: { type:'SR_FLIP_FLOP',label:'SR Flip-Flop',description:'Set-Reset flip-flop',inputs:2,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  REGISTER: { type:'REGISTER',label:'Register',description:'Multi-bit storage register',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  COUNTER: { type:'COUNTER',label:'Counter',description:'Up counter — increments on clock',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  SHIFT_REGISTER: { type:'SHIFT_REGISTER',label:'Shift Register',description:'Shifts bits on clock',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  RANDOM: { type:'RANDOM',label:'Random',description:'Generates random bit on clock',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  RAM: { type:'RAM',label:'RAM',description:'Read-write memory cell',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',isClocked:true,evaluate:(_i,gate)=>(gate?.storedValue??0) },
  ROM: { type:'ROM',label:'ROM',description:'Read-only memory',inputs:1,outputs:1,isSource:false,isSink:false,category:'memory',evaluate:(_i,gate)=>(gate?.storedValue??0) },

  JOYSTICK: { type:'JOYSTICK',label:'Joystick',description:'Directional input',inputs:0,outputs:1,isSource:true,isSink:false,category:'io',evaluate:(i)=>(i.length>0?i[0]:0) },
  KEYBOARD: { type:'KEYBOARD',label:'Keyboard',description:'Outputs keypress bits',inputs:0,outputs:1,isSource:true,isSink:false,category:'io',evaluate:(i)=>(i.length>0?i[0]:0) },
};

export const PALETTE_ORDER: GateType[] = [
  'INPUT','TOGGLE_SWITCH','PUSH_BUTTON','CLOCK','HIGH','LOW','VCC','GROUND','CONSTANT',
  'OUTPUT','BULB','SEVEN_SEGMENT','HEX_DIGIT','DOT_MATRIX','PROBE','TTY',
  'AND','OR','NOT','BUFFER','NAND','NOR','XOR','XNOR','PARITY_EVEN','PARITY_ODD',
  'PIN','TUNNEL','PULL_UP','PULL_DOWN','BIT_EXTENDER','TRANSISTOR','TRANSMISSION_GATE','CONTROLLED_BUFFER',
  'MUX','DEMUX','DECODER','PRIORITY_ENCODER','BIT_SELECTOR',
  'ADDER','SUBTRACTOR','MULTIPLIER','DIVIDER','NEGATOR','COMPARATOR','SHIFTER','BIT_ADDER','BIT_FINDER',
  'D_FLIP_FLOP','T_FLIP_FLOP','JK_FLIP_FLOP','SR_FLIP_FLOP','REGISTER','COUNTER','SHIFT_REGISTER','RANDOM','RAM','ROM',
  'JOYSTICK','KEYBOARD',
];

export const GATE_WIDTH = 80;
export const GATE_HEIGHT = 60;

export const CATEGORY_LABELS: Record<string, string> = {
  input: 'Inputs & Sources',
  gate: 'Logic Gates',
  output: 'Outputs',
  wiring: 'Wiring',
  plexer: 'Plexers',
  arithmetic: 'Arithmetic',
  memory: 'Memory',
  io: 'I/O',
};

export function getGateInputs(gate: Gate): number {
  const def = GATE_DEFINITIONS[gate.type];
  if (def.inputs === -1) return gate.inputCount ?? def.defaultInputs ?? 2;
  return def.inputs;
}

export function getSevenSegmentPattern(value: number): boolean[] {
  const patterns: boolean[][] = [
    [true,true,true,true,true,true,false],[false,true,true,false,false,false,false],
    [true,true,false,true,true,false,true],[true,true,true,true,false,false,true],
    [false,true,true,false,false,true,true],[true,false,true,true,false,true,true],
    [true,false,true,true,true,true,true],[true,true,true,false,false,false,false],
    [true,true,true,true,true,true,true],[true,true,true,true,false,true,true],
    [true,true,true,false,true,true,true],[false,false,true,true,true,true,true],
    [true,false,false,true,true,true,false],[false,true,true,true,true,false,true],
    [true,false,false,true,true,true,true],[true,false,false,false,true,true,true],
  ];
  return patterns[value] ?? patterns[0];
}
