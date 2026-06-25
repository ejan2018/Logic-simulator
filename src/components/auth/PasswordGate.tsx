'use client';
import { useEffect, useRef, useState } from 'react';
import { WebGLBackground } from './WebGLBackground';
import { useAuthStore } from '@/store/authStore';
import { GlitchText } from '@/components/ui/glitch-text';

const PASSWORD_LENGTH = 4;

export function PasswordGate() {
  const authenticate = useAuthStore((s) => s.authenticate);
  const attempts = useAuthStore((s) => s.attempts);
  const [values, setValues] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const valuesRef = useRef(values);
  useEffect(() => { valuesRef.current = values; }, [values]);
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const submitWith = (vals: string[]) => { const code = vals.join(''); if (code.length === PASSWORD_LENGTH) { const ok = authenticate(code); if (!ok) { setError(true); setShake(true); setTimeout(() => setShake(false), 500); setTimeout(() => { setValues(['','','','']); inputRefs.current[0]?.focus(); }, 400); } } };
  const updateValue = (idx: number, val: string) => { const char = val.toUpperCase().slice(-1); if (!/[A-Z0-9]/.test(char)) return; setError(false); const cv = valuesRef.current; const nv = [...cv]; nv[idx] = char; setValues(nv); if (idx < PASSWORD_LENGTH - 1) inputRefs.current[idx + 1]?.focus(); else setTimeout(() => submitWith(nv), 100); };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Backspace' && !values[idx] && idx > 0) { e.preventDefault(); const nv = [...values]; nv[idx - 1] = ''; setValues(nv); inputRefs.current[idx - 1]?.focus(); } else if (e.key === 'Enter') { e.preventDefault(); submitWith(values); } else if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); inputRefs.current[idx - 1]?.focus(); } else if (e.key === 'ArrowRight' && idx < PASSWORD_LENGTH - 1) { e.preventDefault(); inputRefs.current[idx + 1]?.focus(); } };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      <WebGLBackground />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)', zIndex:1 }} />
      <div style={{ position:'relative', zIndex:2, padding:'3rem 3rem 2.5rem', borderRadius:20, background:'rgba(15, 23, 42, 0.55)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'1px solid rgba(99, 102, 241, 0.3)', boxShadow:'0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)', textAlign:'center', minWidth:340, animation: shake ? 'shake 0.4s ease-in-out' : 'fadeUp 0.6s ease-out' }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}`}</style>
        <div style={{ width:220, height:110, margin:'0 auto 1rem', display:'flex', alignItems:'center', justifyContent:'center' }}><img src="/logo.svg" alt="Logic Simulator Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} /></div>
        <h1 style={{ color:'white', fontSize:22, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}><GlitchText text="LOGIC SIMULATOR" className="text-lg sm:text-xl" /></h1>
        <p style={{ color:'rgba(199, 210, 254, 0.85)', fontSize:13, marginTop:6, marginBottom:28 }}>Enter the 4-character access code to continue</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:24 }}>
          {values.map((v, i) => <input key={i} ref={(el) => { inputRefs.current[i] = el; }} value={v} onChange={(e) => updateValue(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} maxLength={1} type="text" inputMode="text" autoCapitalize="characters" autoComplete="off" style={{ width:56, height:72, fontSize:32, fontWeight:700, textAlign:'center', background: error ? 'rgba(239, 68, 68, 0.12)' : v ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.06)', border: `2px solid ${error ? 'rgba(239, 68, 68, 0.7)' : v ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.18)'}`, borderRadius:12, color:'white', outline:'none', transition:'all 0.2s ease', caretColor:'#a5b4fc', fontFamily:'ui-monospace, "SF Mono", monospace' }} onFocus={(e) => e.target.select()} />)}
        </div>
        <div style={{ height:20, fontSize:12, color: error ? '#fca5a5' : 'rgba(199, 210, 254, 0.6)', marginBottom:16 }}>{error ? `Incorrect code — attempt #${attempts}` : 'Hint: 4 letters, all uppercase'}</div>
        <button type="button" onClick={() => submitWith(values)} style={{ width:'100%', padding:'12px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', transition:'transform 0.15s ease, box-shadow 0.15s ease', boxShadow:'0 6px 20px rgba(99, 102, 241, 0.4)' }}>Unlock →</button>
        <div style={{ marginTop:22, fontSize:11, color:'rgba(199, 210, 254, 0.4)', letterSpacing:'0.05em' }}>LOGIC SIMULATOR · BUILT BY AALIYAN · WEBGL POWERED</div>
      </div>
    </div>
  );
}
