'use client';
import { GateSymbol, getGatePinPosition } from './GateSymbol';
import { Gate, GateType, SignalValue } from '@/lib/logic/types';
import { GATE_DEFINITIONS, GATE_WIDTH, GATE_HEIGHT } from '@/lib/logic/gates';
import { useCircuitStore } from '@/store/circuitStore';
import { useRef, useCallback } from 'react';

const DRAG_THRESHOLD = 8; // Slightly higher for touch
const CLICKABLE_TYPES = new Set(['INPUT', 'TOGGLE_SWITCH', 'PUSH_BUTTON']);

export function GateNode({ gate, value, selected }: { gate: Gate; value: SignalValue | undefined; selected: boolean }) {
  const moveGate = useCircuitStore((s) => s.moveGate);
  const selectGate = useCircuitStore((s) => s.selectGate);
  const removeGate = useCircuitStore((s) => s.removeGate);
  const startWire = useCircuitStore((s) => s.startWire);
  const pendingWire = useCircuitStore((s) => s.pendingWire);
  const completeWire = useCircuitStore((s) => s.completeWire);
  const setGateValue = useCircuitStore((s) => s.setGateValue);
  const setGatePressed = useCircuitStore((s) => s.setGatePressed);
  const zoom = useCircuitStore((s) => s.zoom);
  const pan = useCircuitStore((s) => s.pan);

  const def = GATE_DEFINITIONS[gate.type];
  const mouseDownPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pushButtonHeld = useRef<boolean>(false);
  const gateElRef = useRef<HTMLDivElement>(null);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    let container: HTMLElement | null = gateElRef.current;
    while (container) { if (container.dataset && container.dataset.canvasContainer === 'true') break; container = container.parentElement; }
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }, [zoom, pan]);

  // Unified pointer down handler — works for BOTH mouse and touch
  const handleBodyPointerDown = (e: React.PointerEvent) => {
    if (pendingWire) return;
    e.stopPropagation();
    // Don't preventDefault on touch — it breaks scrolling in some browsers.
    // We use touchAction: 'none' on the element instead.
    selectGate(gate.id);

    mouseDownPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    if (gate.type === 'PUSH_BUTTON') {
      setGatePressed(gate.id, true);
      pushButtonHeld.current = true;
    }

    const canvasCoords = screenToCanvas(e.clientX, e.clientY);
    dragOffsetRef.current = { x: canvasCoords.x - gate.x, y: canvasCoords.y - gate.y };
    isDraggingRef.current = true;

    // Use pointer events for both mouse and touch
    const onMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      ev.preventDefault();
      const coords = screenToCanvas(ev.clientX, ev.clientY);
      const nx = Math.max(0, Math.min(4000 - GATE_WIDTH, coords.x - dragOffsetRef.current.x));
      const ny = Math.max(0, Math.min(3000 - GATE_HEIGHT, coords.y - dragOffsetRef.current.y));
      moveGate(gate.id, nx, ny);
    };

    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false;
      const sp = mouseDownPos.current;
      if (sp) {
        const dist = Math.hypot(ev.clientX - sp.x, ev.clientY - sp.y);
        const elapsed = Date.now() - sp.time;
        // If it was a tap/click (small movement, short time) → toggle
        if (dist < DRAG_THRESHOLD && elapsed < 500) {
          if (gate.type === 'INPUT' || gate.type === 'TOGGLE_SWITCH') {
            setGateValue(gate.id, (gate.inputValue ?? 0) === 1 ? 0 : 1);
          }
        }
      }
      if (gate.type === 'PUSH_BUTTON' && pushButtonHeld.current) {
        setGatePressed(gate.id, false);
        pushButtonHeld.current = false;
      }
      mouseDownPos.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Output pin — start wire drawing (pointer events for touch support)
  const handleOutputPinPointerDown = (e: React.PointerEvent) => {
    if (def.isSink) return;
    e.stopPropagation();
    const pos = getGatePinPosition(gate.type, gate.x, gate.y, -1, gate);
    startWire(gate.id, pos.x, pos.y);
  };

  // Input pin — complete wire (pointer up for touch support)
  const handleInputPinPointerUp = (e: React.PointerEvent, pinIndex: number) => {
    if (!pendingWire) return;
    e.stopPropagation();
    completeWire(gate.id, pinIndex);
  };

  const outputPinPos = def.isSink ? null : getGatePinPosition(gate.type, gate.x, gate.y, -1, gate);
  const inputPinPositions: { x: number; y: number; index: number }[] = [];
  const effInputs = def.inputs === -1 ? (gate.inputCount ?? def.defaultInputs ?? 2) : def.inputs;
  for (let i = 0; i < effInputs; i++) { const pos = getGatePinPosition(gate.type, gate.x, gate.y, i, gate); inputPinPositions.push({ x: pos.x, y: pos.y, index: i }); }

  const bodyCursor = CLICKABLE_TYPES.has(gate.type) ? 'pointer' : 'grab';

  return (
    <div
      ref={gateElRef}
      data-gate-id={gate.id}
      style={{
        position: 'absolute',
        left: gate.x,
        top: gate.y,
        width: GATE_WIDTH,
        height: GATE_HEIGHT,
        cursor: bodyCursor,
        userSelect: 'none',
        touchAction: 'none', // Critical: prevents browser gestures on touch
      }}
      onPointerDown={handleBodyPointerDown}
    >
      <GateSymbol type={gate.type} value={value} label={gate.label} selected={selected} highlighted={gate.type==='CLOCK'&&value===1} gate={gate} />

      {/* Output pin — bigger touch target */}
      {outputPinPos && (
        <div
          data-pin="output"
          style={{
            position: 'absolute',
            left: outputPinPos.x - gate.x - 10,
            top: outputPinPos.y - gate.y - 10,
            width: 20,
            height: 20,
            cursor: 'crosshair',
            background: value === 1 ? '#10b981' : '#9ca3af',
            border: '2px solid #1f2937',
            borderRadius: '50%',
            zIndex: 5,
            touchAction: 'none',
          }}
          onPointerDown={handleOutputPinPointerDown}
          title="Drag from here to draw a wire"
        />
      )}

      {/* Input pins — bigger touch target */}
      {inputPinPositions.map((pin) => (
        <div
          key={pin.index}
          data-pin="input"
          style={{
            position: 'absolute',
            left: pin.x - gate.x - 9,
            top: pin.y - gate.y - 9,
            width: 18,
            height: 18,
            cursor: pendingWire ? 'cell' : 'crosshair',
            background: pendingWire ? '#fbbf24' : '#ffffff',
            border: '2px solid #1f2937',
            borderRadius: '50%',
            zIndex: 5,
            touchAction: 'none',
          }}
          onPointerUp={(e) => handleInputPinPointerUp(e, pin.index)}
          title={pendingWire ? 'Tap to connect' : 'Connect a wire here'}
        />
      ))}

      {/* Delete button — bigger touch target */}
      {selected && (
        <button
          type="button"
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            border: '2px solid white',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onClick={(e) => { e.stopPropagation(); removeGate(gate.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete gate"
        >
          ×
        </button>
      )}

      {/* Hints */}
      {gate.type === 'INPUT' && (
        <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'#6b7280', whiteSpace:'nowrap', pointerEvents:'none' }}>tap to toggle · drag to move</div>
      )}
      {gate.type === 'TOGGLE_SWITCH' && (
        <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'#6b7280', whiteSpace:'nowrap', pointerEvents:'none' }}>tap to switch · drag to move</div>
      )}
      {gate.type === 'PUSH_BUTTON' && (
        <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'#6b7280', whiteSpace:'nowrap', pointerEvents:'none' }}>hold to press · drag to move</div>
      )}
    </div>
  );
}

export { GATE_WIDTH, GATE_HEIGHT };
export type { GateType };
