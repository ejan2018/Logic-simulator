'use client';
import { GateType, SignalValue, Gate } from '@/lib/logic/types';
import { GATE_DEFINITIONS, GATE_WIDTH, GATE_HEIGHT, getSevenSegmentPattern } from '@/lib/logic/gates';

export interface GatePinPosition { x: number; y: number; }

function SevenSegmentGlyph({ x, y, value, digit }: { x: number; y: number; value?: SignalValue; digit?: number }) {
  const d = digit !== undefined ? digit : value === 1 ? 8 : -1;
  const pattern = d >= 0 ? getSevenSegmentPattern(d) : [false,false,false,false,false,false,false];
  const w=20,h=32,segW=2,onColor='#ef4444',offColor='#3a3a3a';
  const seg=(lit:boolean,x1:number,y1:number,x2:number,y2:number)=>(<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lit?onColor:offColor} strokeWidth={segW} strokeLinecap="round" />);
  const left=x-w/2,top=y-h/2,right=x+w/2,bottom=y+h/2,midY=y;
  return (<g>{seg(pattern[0],left+2,top,right-2,top)}{seg(pattern[1],right,top+2,right,midY-2)}{seg(pattern[2],right,midY+2,right,bottom-2)}{seg(pattern[3],left+2,bottom,right-2,bottom)}{seg(pattern[4],left,midY+2,left,bottom-2)}{seg(pattern[5],left,top+2,left,midY-2)}{seg(pattern[6],left+2,midY,right-2,midY)}</g>);
}

export function getGatePinPosition(type: GateType, gateX: number, gateY: number, pinIndex: number, gate?: Gate): GatePinPosition {
  const def = GATE_DEFINITIONS[type];
  if (pinIndex < 0) return { x: gateX + GATE_WIDTH, y: gateY + GATE_HEIGHT / 2 };
  if ((type === 'SEVEN_SEGMENT' || type === 'HEX_DIGIT') && def.inputs === 4) {
    const positions = [0.85, 0.55, 0.35, 0.15];
    return { x: gateX, y: gateY + GATE_HEIGHT * positions[pinIndex] };
  }
  let inputCount: number;
  if (def.inputs === -1) inputCount = gate?.inputCount ?? def.defaultInputs ?? 2;
  else inputCount = def.inputs;
  if (type === 'DOT_MATRIX') { const pos = (pinIndex + 0.5) / inputCount; return { x: gateX, y: gateY + GATE_HEIGHT * pos }; }
  if (inputCount === 1) return { x: gateX, y: gateY + GATE_HEIGHT / 2 };
  const pos = (pinIndex + 1) / (inputCount + 1);
  return { x: gateX, y: gateY + GATE_HEIGHT * pos };
}

interface GateSymbolProps {
  type: GateType; value?: SignalValue; label?: string;
  width?: number; height?: number; selected?: boolean; highlighted?: boolean; gate?: Gate;
}

export function GateSymbol({ type, value, label, width = GATE_WIDTH, height = GATE_HEIGHT, selected = false, highlighted = false, gate }: GateSymbolProps) {
  const stroke = selected ? '#0ea5e9' : '#1f2937';
  const strokeWidth = selected ? 2.5 : 1.8;
  const fill = '#ffffff';
  const onColor = '#10b981';
  const commonProps = { stroke, strokeWidth, fill, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const isOn = value === 1;
  const renderLabel = (text: string, x: number, y: number, color = '#111827', size = 11) => (
    <text x={x} y={y} fontSize={size} fontWeight={600} textAnchor="middle" dominantBaseline="middle" fill={color} style={{ pointerEvents: 'none', fontFamily: 'ui-monospace, monospace' }}>{text}</text>
  );

  if (type === 'INPUT') {
    const bg = isOn ? '#10b981' : '#e5e7eb'; const fg = isOn ? '#ffffff' : '#6b7280';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={4} y={8} width={GATE_WIDTH-16} height={GATE_HEIGHT-16} rx={10} ry={10} fill={bg} stroke={stroke} strokeWidth={strokeWidth} />{renderLabel(isOn?'1':'0', GATE_WIDTH/2-4, GATE_HEIGHT/2, fg, 16)}{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'OUTPUT') {
    const ledColor = isOn ? '#22c55e' : '#cbd5e1'; const ledGlow = isOn ? 'url(#ledGlow)' : 'none';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><defs><radialGradient id="ledGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#86efac" stopOpacity="1" /><stop offset="60%" stopColor="#22c55e" stopOpacity="1" /><stop offset="100%" stopColor="#15803d" stopOpacity="1" /></radialGradient></defs><line x1={0} y1={GATE_HEIGHT/2} x2={12} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><circle cx={GATE_WIDTH/2+6} cy={GATE_HEIGHT/2} r={Math.min(GATE_WIDTH,GATE_HEIGHT)/2-10} fill={ledGlow!=='none'?ledGlow:ledColor} stroke={stroke} strokeWidth={strokeWidth} />{isOn && <circle cx={GATE_WIDTH/2+6} cy={GATE_HEIGHT/2} r={6} fill="#ffffff" opacity={0.7} />}{label && renderLabel(label, GATE_WIDTH/2+6, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'HIGH' || type === 'LOW' || type === 'VCC' || type === 'GROUND') {
    const v = type === 'HIGH' || type === 'VCC' ? 1 : 0; const bg = v ? '#10b981' : '#9ca3af';
    const dl = type === 'VCC' ? 'VCC' : type === 'GROUND' ? 'GND' : String(v);
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={8} y={10} width={GATE_WIDTH-20} height={GATE_HEIGHT-20} rx={6} ry={6} fill={bg} stroke={stroke} strokeWidth={strokeWidth} />{renderLabel(dl, GATE_WIDTH/2-2, GATE_HEIGHT/2, '#ffffff', type==='VCC'||type==='GROUND'?13:18)}</svg>);
  }
  if (type === 'TOGGLE_SWITCH') {
    const bg = isOn ? '#10b981' : '#d1d5db'; const knobX = isOn ? GATE_WIDTH-28 : 14;
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={10} y={GATE_HEIGHT/2-12} width={GATE_WIDTH-28} height={24} rx={12} ry={12} fill={bg} stroke={stroke} strokeWidth={strokeWidth} /><circle cx={knobX} cy={GATE_HEIGHT/2} r={9} fill="#ffffff" stroke={stroke} strokeWidth={1.5} />{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'PUSH_BUTTON') {
    const bg = isOn ? '#ef4444' : '#f3f4f6'; const fg = isOn ? '#ffffff' : '#6b7280';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><circle cx={GATE_WIDTH/2-4} cy={GATE_HEIGHT/2} r={20} fill={bg} stroke={stroke} strokeWidth={strokeWidth} /><circle cx={GATE_WIDTH/2-4} cy={GATE_HEIGHT/2} r={isOn?12:14} fill={isOn?'#dc2626':'#ffffff'} stroke={stroke} strokeWidth={1.2} />{renderLabel('PUSH', GATE_WIDTH/2-4, GATE_HEIGHT/2, fg, 8)}{label && renderLabel(label, GATE_WIDTH/2-4, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'BULB') {
    const color = gate?.gateColor ?? '#fbbf24';
    const gradId = `bulbGlow-${isOn?'on':'off'}-${color.replace('#','')}`;
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><defs><radialGradient id={gradId} cx="50%" cy="40%" r="60%">{isOn?<>
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" /><stop offset="35%" stopColor={color} stopOpacity="1" /><stop offset="100%" stopColor={color} stopOpacity="0.85" /></>:<>
      <stop offset="0%" stopColor="#475569" stopOpacity="1" /><stop offset="100%" stopColor="#1e293b" stopOpacity="1" /></>}</radialGradient></defs><line x1={0} y1={GATE_HEIGHT/2} x2={16} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={16} y={GATE_HEIGHT/2+4} width={14} height={12} fill="#6b7280" stroke="#374151" strokeWidth={1} /><rect x={18} y={GATE_HEIGHT/2+6} width={10} height={2} fill="#374151" /><rect x={18} y={GATE_HEIGHT/2+9} width={10} height={2} fill="#374151" /><circle cx={GATE_WIDTH/2+4} cy={GATE_HEIGHT/2-4} r={20} fill={`url(#${gradId})`} stroke={stroke} strokeWidth={strokeWidth} /><path d={`M ${GATE_WIDTH/2-4} ${GATE_HEIGHT/2+8} Q ${GATE_WIDTH/2-1} ${GATE_HEIGHT/2-2} ${GATE_WIDTH/2+4} ${GATE_HEIGHT/2+8}`} fill="none" stroke={isOn?'#ffffff':'#1f2937'} strokeWidth={1.2} />{isOn && <><circle cx={GATE_WIDTH/2+4} cy={GATE_HEIGHT/2-4} r={6} fill="#ffffff" opacity={0.55} /><circle cx={GATE_WIDTH/2+4} cy={GATE_HEIGHT/2-4} r={26} fill="none" stroke={color} strokeWidth={1} opacity={0.35} /></>}{label && renderLabel(label, GATE_WIDTH/2+4, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'PROBE') {
    const bg = isOn ? '#10b98120' : '#f3f4f6'; const fg = isOn ? '#059669' : '#6b7280';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={0} y1={GATE_HEIGHT/2} x2={12} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={12} y={8} width={GATE_WIDTH-16} height={GATE_HEIGHT-16} rx={4} ry={4} fill={bg} stroke={stroke} strokeWidth={strokeWidth} />{renderLabel(String(isOn?1:0), GATE_WIDTH/2+4, GATE_HEIGHT/2, fg, 22)}{label && renderLabel(label, GATE_WIDTH/2+4, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'SEVEN_SEGMENT' || type === 'HEX_DIGIT') {
    return (<svg width={width} height={height+20} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT+20}`}><line x1={0} y1={GATE_HEIGHT*0.85} x2={10} y2={GATE_HEIGHT*0.85} stroke="#1f2937" strokeWidth={1.8} />{renderLabel('A',5,GATE_HEIGHT*0.85+12,'#6b7280',8)}<line x1={0} y1={GATE_HEIGHT*0.55} x2={10} y2={GATE_HEIGHT*0.55} stroke="#1f2937" strokeWidth={1.8} />{renderLabel('B',5,GATE_HEIGHT*0.55+12,'#6b7280',8)}<line x1={0} y1={GATE_HEIGHT*0.35} x2={10} y2={GATE_HEIGHT*0.35} stroke="#1f2937" strokeWidth={1.8} />{renderLabel('C',5,GATE_HEIGHT*0.35+12,'#6b7280',8)}<line x1={0} y1={GATE_HEIGHT*0.15} x2={10} y2={GATE_HEIGHT*0.15} stroke="#1f2937" strokeWidth={1.8} />{renderLabel('D',5,GATE_HEIGHT*0.15+12,'#6b7280',8)}<rect x={12} y={4} width={GATE_WIDTH-16} height={GATE_HEIGHT-4} rx={4} ry={4} fill="#1e293b" stroke={stroke} strokeWidth={strokeWidth} /><SevenSegmentGlyph x={GATE_WIDTH/2+4} y={GATE_HEIGHT/2} value={value} />{label && renderLabel(label, GATE_WIDTH/2+4, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'DOT_MATRIX') {
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}>{Array.from({length:7},(_,i)=>{const pos=(i+0.5)/7;return <line key={i} x1={0} y1={GATE_HEIGHT*pos} x2={10} y2={GATE_HEIGHT*pos} stroke="#1f2937" strokeWidth={1.5} />;})}<rect x={12} y={4} width={GATE_WIDTH-16} height={GATE_HEIGHT-4} rx={4} ry={4} fill="#1e293b" stroke={stroke} strokeWidth={strokeWidth} />{Array.from({length:7},(_,row)=>Array.from({length:5},(_,col)=><circle key={`${row}-${col}`} cx={22+col*9} cy={12+row*6} r={2} fill={value===1?'#10b981':'#374151'} />))}{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'TTY') {
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={0} y1={GATE_HEIGHT/2} x2={12} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={12} y={6} width={GATE_WIDTH-16} height={GATE_HEIGHT-12} rx={4} ry={4} fill="#0f172a" stroke={stroke} strokeWidth={strokeWidth} /><text x={16} y={22} fontSize={7} fill="#10b981" style={{ pointerEvents:'none', fontFamily:'ui-monospace,monospace' }}>{gate?.ttyText?(gate.ttyText.slice(-8)):'>_'}</text><text x={16} y={36} fontSize={6} fill="#6b7280" style={{ pointerEvents:'none', fontFamily:'ui-monospace,monospace' }}>TTY</text>{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'CONSTANT') {
    const v = gate?.constantValue ?? 1; const bg = v !== 0 ? '#10b981' : '#9ca3af';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={8} y={10} width={GATE_WIDTH-20} height={GATE_HEIGHT-20} rx={6} ry={6} fill={bg} stroke={stroke} strokeWidth={strokeWidth} />{renderLabel(String(v), GATE_WIDTH/2-2, GATE_HEIGHT/2, '#ffffff', 16)}{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }
  if (type === 'CLOCK') {
    const bg = isOn ? '#10b981' : '#e5e7eb'; const fg = isOn ? '#ffffff' : '#6b7280';
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}><line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} /><rect x={4} y={8} width={GATE_WIDTH-16} height={GATE_HEIGHT-16} rx={10} ry={10} fill={bg} stroke={stroke} strokeWidth={strokeWidth} /><polyline points={`14,${GATE_HEIGHT/2+8} 22,${GATE_HEIGHT/2+8} 22,${GATE_HEIGHT/2-8} 36,${GATE_HEIGHT/2-8} 36,${GATE_HEIGHT/2+8} 50,${GATE_HEIGHT/2+8} 50,${GATE_HEIGHT/2-8} 60,${GATE_HEIGHT/2-8}`} fill="none" stroke={fg} strokeWidth={2} />{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}</svg>);
  }

  // Generic box renderer for all other gate types
  const def = GATE_DEFINITIONS[type];
  const inputCount = def.inputs === -1 ? (gate?.inputCount ?? def.defaultInputs ?? 2) : def.inputs;
  const bgColor = def.isClocked ? (isOn ? '#3b82f620' : '#f3f4f6') : (isOn ? '#10b98120' : '#f9fafb');
  const accentColor = def.isClocked ? '#3b82f6' : (isOn ? '#10b981' : '#6b7280');
  const isStandardGate = ['AND','OR','NOT','BUFFER','NAND','NOR','XOR','XNOR','PARITY_EVEN','PARITY_ODD'].includes(type);

  if (isStandardGate) {
    const bodyX=12,bodyY=5,bodyW=48,bodyH=GATE_HEIGHT-10;
    const effectiveInputs = def.inputs === -1 ? (gate?.inputCount ?? def.defaultInputs ?? 2) : def.inputs;
    const inputLines = [];
    for (let i = 0; i < effectiveInputs; i++) { const y = effectiveInputs === 1 ? GATE_HEIGHT/2 : (GATE_HEIGHT*(i+1))/(effectiveInputs+1); inputLines.push(<line key={`in-${i}`} x1={0} y1={y} x2={bodyX} y2={y} stroke="#1f2937" strokeWidth={1.8} />); }
    const outputLine = <line x1={bodyX+bodyW} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} />;
    const hasBubble = type === 'NAND' || type === 'NOR' || type === 'XNOR' || type === 'NOT';
    const hasXorCurve = type === 'XOR' || type === 'XNOR' || type === 'PARITY_EVEN' || type === 'PARITY_ODD';
    const bubbleR = 4; const bodyRight = hasBubble ? bodyX+bodyW-bubbleR*2+2 : bodyX+bodyW;
    let bodyShape: React.ReactNode = null; let extraCurve: React.ReactNode = null;
    if (type === 'AND' || type === 'NAND') {
      const path = `M ${bodyX} ${bodyY} L ${bodyX+bodyW/2} ${bodyY} A ${bodyH/2} ${bodyH/2} 0 0 1 ${bodyX+bodyW/2} ${bodyY+bodyH} L ${bodyX} ${bodyY+bodyH} Z`;
      bodyShape = <path d={path} {...commonProps} />;
    } else if (type === 'OR' || type === 'NOR') {
      const path = `M ${bodyX} ${bodyY} Q ${bodyX+bodyW*0.3} ${bodyY+bodyH/2} ${bodyX} ${bodyY+bodyH} Q ${bodyX+bodyW*0.5} ${bodyY+bodyH} ${bodyRight} ${bodyY+bodyH/2} Q ${bodyX+bodyW*0.5} ${bodyY} ${bodyX} ${bodyY} Z`;
      bodyShape = <path d={path} {...commonProps} />;
    } else if (hasXorCurve) {
      const path = `M ${bodyX+6} ${bodyY} Q ${bodyX+bodyW*0.3+6} ${bodyY+bodyH/2} ${bodyX+6} ${bodyY+bodyH} Q ${bodyX+bodyW*0.5+6} ${bodyY+bodyH} ${bodyRight} ${bodyY+bodyH/2} Q ${bodyX+bodyW*0.5+6} ${bodyY} ${bodyX+6} ${bodyY} Z`;
      bodyShape = <path d={path} {...commonProps} />;
      extraCurve = <path d={`M ${bodyX} ${bodyY} Q ${bodyX+bodyW*0.3} ${bodyY+bodyH/2} ${bodyX} ${bodyY+bodyH}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />;
    } else if (type === 'NOT') {
      const path = `M ${bodyX} ${bodyY} L ${bodyX+bodyW-bubbleR*2} ${bodyY+bodyH/2} L ${bodyX} ${bodyY+bodyH} Z`;
      bodyShape = <path d={path} {...commonProps} />;
    } else if (type === 'BUFFER') {
      const path = `M ${bodyX} ${bodyY} L ${bodyX+bodyW} ${bodyY+bodyH/2} L ${bodyX} ${bodyY+bodyH} Z`;
      bodyShape = <path d={path} {...commonProps} />;
    }
    let bubble: React.ReactNode = null;
    if (hasBubble) { bubble = <circle cx={bodyRight+bubbleR} cy={GATE_HEIGHT/2} r={bubbleR} fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />; }
    const signalDot = isOn ? <circle cx={bodyX+bodyW/2} cy={GATE_HEIGHT/2} r={3} fill={onColor} /> : null;
    return (<svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}>{inputLines}{bodyShape}{extraCurve}{bubble}{outputLine}{signalDot}{label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}{highlighted && <rect x={0} y={0} width={GATE_WIDTH} height={GATE_HEIGHT} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" />}</svg>);
  }

  // Generic box for wiring/plexer/arithmetic/memory/io
  return (
    <svg width={width} height={height} viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}>
      {Array.from({length: inputCount}, (_, i) => { const pos = inputCount === 1 ? 0.5 : (i+1)/(inputCount+1); return <line key={`in-${i}`} x1={0} y1={GATE_HEIGHT*pos} x2={10} y2={GATE_HEIGHT*pos} stroke="#1f2937" strokeWidth={1.5} />; })}
      {!def.isSink && <line x1={GATE_WIDTH-12} y1={GATE_HEIGHT/2} x2={GATE_WIDTH} y2={GATE_HEIGHT/2} stroke="#1f2937" strokeWidth={1.8} />}
      <rect x={10} y={6} width={GATE_WIDTH-18} height={GATE_HEIGHT-12} rx={def.isClocked?8:6} ry={def.isClocked?8:6} fill={bgColor} stroke={selected?'#0ea5e9':accentColor} strokeWidth={selected?2.5:1.8} />
      {def.isClocked && <path d={`M 10 ${GATE_HEIGHT/2-6} L 16 ${GATE_HEIGHT/2} L 10 ${GATE_HEIGHT/2+6}`} fill="none" stroke={accentColor} strokeWidth={1.5} />}
      {renderLabel(def.label, GATE_WIDTH/2-1, GATE_HEIGHT/2-4, '#1f2937', def.label.length>8?8:def.label.length>5?9:10)}
      {def.isClocked && gate?.storedValue !== undefined && <text x={GATE_WIDTH/2-1} y={GATE_HEIGHT/2+12} fontSize={9} fontWeight={700} textAnchor="middle" fill={isOn?'#10b981':'#9ca3af'} style={{ pointerEvents:'none', fontFamily:'ui-monospace,monospace' }}>Q={gate.storedValue}</text>}
      {def.inputs === -1 && <text x={GATE_WIDTH-16} y={14} fontSize={8} fontWeight={600} textAnchor="middle" fill="#6b7280" style={{ pointerEvents:'none', fontFamily:'ui-monospace,monospace' }}>{inputCount}in</text>}
      {isOn && !def.isSink && <circle cx={GATE_WIDTH/2-1} cy={GATE_HEIGHT-12} r={2.5} fill={onColor} />}
      {label && renderLabel(label, GATE_WIDTH/2, GATE_HEIGHT+14, '#374151', 11)}
    </svg>
  );
}
