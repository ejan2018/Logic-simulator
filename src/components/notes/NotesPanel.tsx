'use client';
import { useMemo, useState } from 'react';
import { GATE_NOTES, KMAP_NOTES, BOOLEAN_FUNCTION_NOTES, NoteSection, NoteBlock } from '@/lib/logic/notesData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';

type Category = 'gates' | 'kmap' | 'boolean';
const CATEGORIES = [
  { id: 'gates' as Category, label: 'Logic Gates', description: 'Notes on all 7 standard gates with truth tables for 2, 3, and 4 inputs', sections: GATE_NOTES },
  { id: 'kmap' as Category, label: 'Karnaugh Maps', description: 'How to draw, fill, and read K-maps — with worked examples', sections: KMAP_NOTES },
  { id: 'boolean' as Category, label: 'Boolean Functions', description: 'Minterms, maxterms, SOP, POS, and simplification methods', sections: BOOLEAN_FUNCTION_NOTES },
];

function renderBlock(block: NoteBlock, idx: number) {
  switch (block.type) {
    case 'paragraph': return <p key={idx} className="text-sm leading-relaxed text-foreground/90 mb-3">{block.text}</p>;
    case 'heading': return <h4 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2 flex items-center gap-2"><span className="w-1 h-4 bg-primary rounded-full" />{block.text}</h4>;
    case 'list': return <ul key={idx} className="list-disc pl-5 mb-3 space-y-1.5">{block.items.map((item, i) => <li key={i} className="text-sm text-foreground/90 leading-relaxed">{item}</li>)}</ul>;
    case 'table': return <div key={idx} className="overflow-x-auto mb-3 rounded-md border border-border"><table className="w-full text-xs"><thead className="bg-muted"><tr>{block.headers.map((h, i) => <th key={i} className="px-3 py-1.5 text-center font-semibold border-b border-border">{h}</th>)}</tr></thead><tbody>{block.rows.map((row, ri) => <tr key={ri} className={ri % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>{row.map((cell, ci) => <td key={ci} className={`px-3 py-1.5 text-center font-mono ${ci === row.length - 1 ? 'font-bold text-primary' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
    case 'example': return <div key={idx} className="rounded-md border border-primary/30 bg-primary/5 p-3 mb-3"><div className="text-xs font-semibold text-primary mb-1">📝 {block.title}</div><div className="font-mono text-sm font-bold mb-1">{block.expression}</div><div className="text-xs text-muted-foreground">{block.explanation}</div></div>;
    case 'tip': return <div key={idx} className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 mb-3 flex gap-2"><Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" /><div className="text-xs text-amber-900 dark:text-amber-200">{block.text}</div></div>;
    case 'warning': return <div key={idx} className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 mb-3 flex gap-2"><AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" /><div className="text-xs text-red-900 dark:text-red-200">{block.text}</div></div>;
    default: return null;
  }
}

export function NotesPanel() {
  const [category, setCategory] = useState<Category>('gates');
  const [search, setSearch] = useState('');
  const active = CATEGORIES.find((c) => c.id === category)!;
  const filtered = useMemo(() => { if (!search.trim()) return active.sections; const q = search.toLowerCase(); return active.sections.filter((s) => `${s.title} ${s.intro ?? ''} ${s.blocks.map((b) => JSON.stringify(b)).join(' ')}`.toLowerCase().includes(q)); }, [active, search]);
  return (
    <div className="flex flex-col gap-4 w-full">
      <Card><CardContent className="p-3 flex flex-col sm:flex-row gap-3 sm:items-end"><div className="flex-1"><Label className="text-xs">Search notes</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search across all notes…" className="mt-1" /></div><div className="flex flex-wrap gap-1.5">{CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => { setCategory(c.id); setSearch(''); }} className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${category === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent border-border'}`}>{c.label}</button>)}</div></CardContent></Card>
      <div className="text-sm text-muted-foreground px-1"><BookOpen className="inline h-4 w-4 mr-1.5 align-text-bottom" />{active.description} · {active.sections.length} sections</div>
      <div className="flex flex-col gap-3">
        <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground mb-2 font-semibold">Jump to section:</div><div className="flex flex-wrap gap-1.5">{filtered.map((s) => <a key={s.id} href={`#note-${s.id}`} className="text-xs px-2 py-1 rounded-md border border-border bg-card hover:bg-accent transition-colors">{s.icon} {s.title}</a>)}</div></CardContent></Card>
        {filtered.map((section) => <div key={section.id} id={`note-${section.id}`} className="scroll-mt-4"><Card><CardHeader className="pb-3"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center text-lg font-bold flex-shrink-0">{section.icon}</div><div className="flex-1"><CardTitle className="text-base leading-tight">{section.title}</CardTitle>{section.intro && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{section.intro}</p>}</div></div></CardHeader><CardContent>{section.blocks.map((block, idx) => renderBlock(block, idx))}</CardContent></Card></div>)}
        {filtered.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No notes match your search.</CardContent></Card>}
      </div>
    </div>
  );
}
