'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { GateNode } from './GateNode';
import { Wire } from './Wire';
import { getGatePinPosition } from './GateSymbol';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 3000;

// Helper: get pointer position from either mouse or touch event
function getPointerPos(e: PointerEvent | React.PointerEvent | Touch | { clientX: number; clientY: number }) {
  return { x: e.clientX, y: e.clientY };
}

export function CircuitCanvas({ width = 1200, height = 720 }: { width?: number; height?: number }) {
  const circuit = useCircuitStore((s) => s.circuit);
  const signalValues = useCircuitStore((s) => s.signalValues);
  const pendingWire = useCircuitStore((s) => s.pendingWire);
  const cancelPendingWire = useCircuitStore((s) => s.cancelPendingWire);
  const updatePendingWireMouse = useCircuitStore((s) => s.updatePendingWireMouse);
  const selectGate = useCircuitStore((s) => s.selectGate);
  const selectedGateId = useCircuitStore((s) => s.selectedGateId);
  const runSimulation = useCircuitStore((s) => s.runSimulation);
  const clockRunning = useCircuitStore((s) => s.clockRunning);
  const setClockRunning = useCircuitStore((s) => s.setClockRunning);
  const toggleClock = useCircuitStore((s) => s.toggleClock);
  const clockTick = useCircuitStore((s) => s.clockTick);
  const zoom = useCircuitStore((s) => s.zoom);
  const pan = useCircuitStore((s) => s.pan);
  const setZoom = useCircuitStore((s) => s.setZoom);
  const zoomIn = useCircuitStore((s) => s.zoomIn);
  const zoomOut = useCircuitStore((s) => s.zoomOut);
  const resetZoom = useCircuitStore((s) => s.resetZoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const [isPanning, setIsPanning] = useState(false);
  // Pinch-to-zoom state
  const pinchStartRef = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);

  useEffect(() => { runSimulation(); }, [circuit, runSimulation]);
  useEffect(() => { if (!clockRunning) return; const i = setInterval(() => toggleClock(), 800); return () => clearInterval(i); }, [clockRunning, toggleClock]);

  // Native non-passive wheel listener for zoom (desktop)
  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); e.stopPropagation();
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
      const wx = (mx - pan.x) / zoom; const wy = (my - pan.y) / zoom;
      const newZoom = Math.max(0.25, Math.min(3, zoom * (1 + (-e.deltaY * 0.0015))));
      useCircuitStore.getState().setPan(mx - wx * newZoom, my - wy * newZoom);
      setZoom(newZoom);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, pan, setZoom]);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  };

  // Global pointer move/up handlers for panning, pinch-zoom, and pending wire
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Handle pinch-to-zoom (two-finger)
      if (pinchStartRef.current && e.pointerType === 'touch') {
        // For touch, we handle multi-touch in the touchmove handler
        return;
      }
      if (isPanningRef.current && panStartRef.current) {
        useCircuitStore.getState().setPan(
          panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          panStartRef.current.panY + (e.clientY - panStartRef.current.y)
        );
        return;
      }
      if (pendingWire) {
        const c = toCanvasCoords(e.clientX, e.clientY);
        updatePendingWireMouse(c.x, c.y);
      }
    };
    const handlePointerUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false; panStartRef.current = null; setIsPanning(false);
        document.body.style.cursor = '';
      }
      if (pendingWire) {
        setTimeout(() => {
          if (useCircuitStore.getState().pendingWire) {
            const t = window.event?.target as HTMLElement;
            if (!t || !t.closest('[data-pin]')) cancelPendingWire();
          }
        }, 50);
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [pendingWire, updatePendingWireMouse, cancelPendingWire, zoom, pan]);

  // Touch-specific handlers for pinch-to-zoom and panning on mobile
  useEffect(() => {
    const container = containerRef.current; if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Start pinch-to-zoom
        const t1 = e.touches[0]; const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const rect = container.getBoundingClientRect();
        const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const cy = (t1.clientY + t2.clientY) / 2 - rect.top;
        pinchStartRef.current = { dist, zoom: useCircuitStore.getState().zoom, cx, cy };
        isPanningRef.current = false; // Stop panning during pinch
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const t1 = e.touches[0]; const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = newDist / pinchStartRef.current.dist;
        const newZoom = Math.max(0.25, Math.min(3, pinchStartRef.current.zoom * ratio));
        const rect = container.getBoundingClientRect();
        const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const cy = (t1.clientY + t2.clientY) / 2 - rect.top;
        // Adjust pan so the pinch center stays fixed
        const wx = (cx - pan.x) / zoom; const wy = (cy - pan.y) / zoom;
        useCircuitStore.getState().setPan(cx - wx * newZoom, cy - wy * newZoom);
        setZoom(newZoom);
        return;
      }
      // Single touch panning is handled by pointer events
      if (e.touches.length === 1 && isPanningRef.current && panStartRef.current) {
        e.preventDefault();
        const t = e.touches[0];
        useCircuitStore.getState().setPan(
          panStartRef.current.panX + (t.clientX - panStartRef.current.x),
          panStartRef.current.panY + (t.clientY - panStartRef.current.y)
        );
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartRef.current = null;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, pan, setZoom]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-gate-id]') || target.closest('[data-pin]')) return;
    e.preventDefault();
    if (pendingWire) { cancelPendingWire(); return; }
    selectGate(null);
    isPanningRef.current = true; setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    document.body.style.cursor = 'grabbing';
  };

  const gateById = useMemo(() => { const m = new Map<string, typeof circuit.gates[number]>(); for (const g of circuit.gates) m.set(g.id, g); return m; }, [circuit.gates]);
  const pendingWireStart = pendingWire ? (() => { const g = gateById.get(pendingWire.fromGateId); return g ? getGatePinPosition(g.type, g.x, g.y, -1, g) : null; })() : null;
  const contentTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return (
    <div ref={containerRef} data-canvas-container="true" onPointerDown={handleCanvasPointerDown} style={{ position:'relative', width, height, background:'#fafafa', backgroundImage:'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize:`${GRID_SIZE*zoom}px ${GRID_SIZE*zoom}px`, backgroundPosition:`${pan.x}px ${pan.y}px`, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', flexShrink:0, cursor:isPanning?'grabbing':'default', userSelect:'none', touchAction:'none' }}>
      <div style={{ position:'absolute', top:0, left:0, width:CANVAS_WIDTH, height:CANVAS_HEIGHT, transform:contentTransform, transformOrigin:'0 0', pointerEvents:'none' }}>
        <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible' }}>
          <g style={{ pointerEvents:'all' }}>
            {circuit.wires.map((wire) => { const fg = gateById.get(wire.fromGateId); const tg = gateById.get(wire.toGateId); if (!fg || !tg) return null; return <Wire key={wire.id} wire={wire} fromGate={fg} toGate={tg} signalValue={signalValues.get(wire.fromGateId)} />; })}
            {pendingWire && pendingWireStart && <path d={`M ${pendingWireStart.x} ${pendingWireStart.y} L ${pendingWire.mouseX} ${pendingWire.mouseY}`} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" fill="none" pointerEvents="none" />}
          </g>
        </svg>
        {circuit.gates.map((gate) => <div key={gate.id} style={{ pointerEvents:'auto' }}><GateNode gate={gate} value={signalValues.get(gate.id)} selected={selectedGateId === gate.id} /></div>)}
      </div>
      {circuit.gates.length === 0 && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}><div style={{ color:'#94a3b8', fontSize:16, textAlign:'center' }}><div style={{ fontWeight:600, marginBottom:4 }}>Empty canvas</div><div style={{ fontSize:13 }}>Tap a gate in the left palette to add it. Drag gates to move them.<br />Pinch to zoom · drag background to pan.</div></div></div>}
      {/* Zoom controls — bigger touch targets for mobile */}
      <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:4, alignItems:'center', background:'white', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px', fontSize:12, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', zIndex:50 }}>
        <button type="button" onClick={(e)=>{e.stopPropagation();zoomOut();}} onPointerDown={(e)=>e.stopPropagation()} title="Zoom out" style={{ width:32, height:32, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', fontSize:18, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
        <span style={{ minWidth:44, textAlign:'center', fontFamily:'ui-monospace,monospace', fontSize:11, fontWeight:600, color:'#6b7280' }}>{Math.round(zoom*100)}%</span>
        <button type="button" onClick={(e)=>{e.stopPropagation();zoomIn();}} onPointerDown={(e)=>e.stopPropagation()} title="Zoom in" style={{ width:32, height:32, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', fontSize:18, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        <button type="button" onClick={(e)=>{e.stopPropagation();resetZoom();}} onPointerDown={(e)=>e.stopPropagation()} title="Reset" style={{ width:32, height:32, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>⟲</button>
      </div>
      {circuit.gates.some((g) => g.type === 'CLOCK') && <div style={{ position:'absolute', top:60, right:12, display:'flex', gap:8, alignItems:'center', background:'white', border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 10px', fontSize:12, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', zIndex:50 }}><span style={{ fontWeight:600 }}>Clock</span><span style={{ width:10, height:10, borderRadius:'50%', background:clockTick===1?'#10b981':'#9ca3af' }} /><button type="button" onClick={()=>setClockRunning(!clockRunning)} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid #cbd5e1', background:clockRunning?'#fee2e2':'#dcfce7', cursor:'pointer', fontSize:11, fontWeight:600 }}>{clockRunning?'Stop':'Run'}</button><button type="button" onClick={toggleClock} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid #cbd5e1', background:'white', cursor:'pointer', fontSize:11, fontWeight:600 }}>Step</button></div>}
      <div style={{ position:'absolute', bottom:8, left:12, fontSize:10, color:'#9ca3af', fontFamily:'ui-monospace,monospace', pointerEvents:'none', zIndex:50 }}>Pinch to zoom · drag background to pan</div>
    </div>
  );
}
