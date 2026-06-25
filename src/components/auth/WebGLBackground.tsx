'use client';
import { useEffect, useRef } from 'react';

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) { canvas.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'; return; }
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height); };
    resize(); window.addEventListener('resize', resize);
    const vs = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    const fs = `precision highp float; uniform vec2 uResolution; uniform float uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
      float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}return v;}
      void main(){vec2 uv=gl_FragCoord.xy/uResolution.xy;vec2 p=uv-0.5;p.x*=uResolution.x/uResolution.y;float t=uTime*0.15;vec2 q=vec2(fbm(p+t),fbm(p-t*0.7));float n=fbm(p+q*2.0+t);vec3 c1=vec3(0.05,0.07,0.2);vec3 c2=vec3(0.1,0.4,0.8);vec3 c3=vec3(0.6,0.2,0.9);vec3 c4=vec3(0.2,0.9,0.95);vec3 color=mix(c1,c2,n);color=mix(color,c3,smoothstep(0.4,0.8,n));color=mix(color,c4,pow(n,4.0)*0.6);float pulse=0.5+0.5*sin(uTime*1.2);float dist=length(p);color+=vec3(0.3,0.6,1.0)*pulse*exp(-dist*2.5)*0.4;vec2 grid=abs(fract(uv*30.0)-0.5);float gl=step(0.48,max(grid.x,grid.y));color+=vec3(0.05,0.15,0.3)*gl*0.3;float vig=1.0-smoothstep(0.5,1.2,dist);color*=vig;color*=0.95+0.05*sin(gl_FragCoord.y*1.5);gl_FragColor=vec4(color,1.0);}`;
    const compile = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'aPosition'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uResolution'); const uTime = gl.getUniformLocation(prog, 'uTime');
    const start = performance.now();
    const render = () => { const t = (performance.now() - start) / 1000; gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); rafRef.current = requestAnimationFrame(render); };
    render();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100vw', height:'100vh', zIndex:0, display:'block' }} />;
}
