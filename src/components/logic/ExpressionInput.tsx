'use client';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eraser, Delete } from 'lucide-react';

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxVars?: number;
}

// The combining overbar character (U+0304) — when appended after a letter or ),
// it renders as a bar over that character
const OVERBAR = '\u0304';

export function ExpressionInput({ value, onChange, onSubmit, placeholder, maxVars = 6 }: ExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barMode, setBarMode] = useState(false);

  // Support A, B, C, D AND x, y, z
  const vars = ['A', 'B', 'C', 'D', 'x', 'y', 'z'].slice(0, maxVars);

  // Insert text at cursor position
  const insert = (text: string) => {
    const input = inputRef.current;
    if (!input) { onChange(value + text); return; }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + text + value.slice(end);
    onChange(newValue);
    // Restore cursor position after the inserted text
    setTimeout(() => {
      input.focus();
      const pos = start + text.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  // Insert a variable — if barMode is on, append overbar
  const insertVar = (v: string) => {
    if (barMode) {
      insert(v + OVERBAR); // Ā
      setBarMode(false);
    } else {
      insert(v);
    }
  };

  // Insert "whole bar" — wraps selection or adds )̄ after cursor
  const insertWholeBar = () => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    if (start !== end) {
      // Wrap selection in (...)
      const selected = value.slice(start, end);
      const newValue = value.slice(0, start) + '(' + selected + ')' + OVERBAR + value.slice(end);
      onChange(newValue);
      setTimeout(() => { input.focus(); input.setSelectionRange(start + selected.length + 3, start + selected.length + 3); }, 0);
    } else {
      // Insert ()̄ and place cursor inside
      const newValue = value.slice(0, start) + '()' + OVERBAR + value.slice(end);
      onChange(newValue);
      setTimeout(() => { input.focus(); input.setSelectionRange(start + 1, start + 1); }, 0);
    }
  };

  // Backspace — remove last character (including combining chars)
  const handleBackspace = () => {
    const input = inputRef.current;
    if (!input) { onChange(value.slice(0, -1)); return; }
    const pos = input.selectionStart ?? value.length;
    if (pos === 0) return;
    // Remove the character before cursor (and any combining marks)
    let removeCount = 1;
    // If the previous char is a combining mark (U+0304 or U+0305), remove it AND the base char
    if (pos >= 2 && (value[pos - 1] === OVERBAR || value[pos - 1] === '\u0305')) {
      removeCount = 2;
    }
    const newValue = value.slice(0, pos - removeCount) + value.slice(pos);
    onChange(newValue);
    setTimeout(() => { input.focus(); input.setSelectionRange(pos - removeCount, pos - removeCount); }, 0);
  };

  const handleClear = () => { onChange(''); setTimeout(() => inputRef.current?.focus(), 0); };

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'e.g. A·B + B̄·C'}
        className="font-mono text-sm h-9"
        onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) onSubmit(); }}
      />
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-md border border-border bg-muted/30">
        {/* Variables */}
        <div className="flex gap-1">
          {vars.map((v) => (
            <button key={v} type="button" onClick={() => insertVar(v)} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono font-bold text-sm transition-colors" title={`Insert ${v}${barMode ? ' with bar' : ''}`}>{v}</button>
          ))}
        </div>
        <div className="w-px h-6 bg-border mx-1" />
        {/* Bar toggle */}
        <button type="button" onClick={() => setBarMode(!barMode)} className={`px-2 h-8 rounded-md border font-mono font-bold text-sm transition-colors ${barMode ? 'bg-violet-600 text-white border-violet-600' : 'border-border bg-card hover:bg-accent'}`} title="Toggle bar mode — next variable will have a bar">
          x̄
        </button>
        {/* Whole bar */}
        <button type="button" onClick={insertWholeBar} className="px-2 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono font-bold text-xs transition-colors" title="Insert bar over expression: (…)̄">
          (…)̄
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        {/* Operators */}
        <button type="button" onClick={() => insert('·')} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono text-sm transition-colors" title="AND">·</button>
        <button type="button" onClick={() => insert('+')} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono text-sm transition-colors" title="OR">+</button>
        <button type="button" onClick={() => insert('(')} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono text-sm transition-colors" title="Open paren">(</button>
        <button type="button" onClick={() => insert(')')} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent font-mono text-sm transition-colors" title="Close paren">)</button>
        <div className="w-px h-6 bg-border mx-1" />
        {/* Backspace + Clear */}
        <button type="button" onClick={handleBackspace} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors" title="Backspace"><Delete className="h-4 w-4" /></button>
        <button type="button" onClick={handleClear} className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors" title="Clear all"><Eraser className="h-4 w-4" /></button>
      </div>
      {/* Hint */}
      <div className="text-[10px] text-muted-foreground">
        {barMode
          ? <span className="text-violet-600 dark:text-violet-400 font-semibold">📌 Bar mode ON — click a variable to add a bar (e.g. Ā), or click (…)̄ to bar a whole expression like (A+B)̄</span>
          : <>Click <strong>x̄</strong> to toggle bar mode, or <strong>(…)̄</strong> to bar a whole expression. You can also type directly: use · for AND, + for OR, ¬A or A' for NOT.</>}
      </div>
    </div>
  );
}
