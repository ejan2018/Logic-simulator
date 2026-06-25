'use client';

import { BOOLEAN_LAWS, BooleanLaw } from '@/lib/logic/booleanLaws';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORY_COLORS: Record<string, string> = {
  Identity: 'bg-amber-100 text-amber-900 border-amber-200',
  Complement: 'bg-rose-100 text-rose-900 border-rose-200',
  Idempotent: 'bg-lime-100 text-lime-900 border-lime-200',
  Commutative: 'bg-cyan-100 text-cyan-900 border-cyan-200',
  Associative: 'bg-teal-100 text-teal-900 border-teal-200',
  Distributive: 'bg-violet-100 text-violet-900 border-violet-200',
  Absorption: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
  DeMorgan: 'bg-orange-100 text-orange-900 border-orange-200',
  Involution: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  Consensus: 'bg-sky-100 text-sky-900 border-sky-200',
};

function LawCard({ law }: { law: BooleanLaw }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-base flex-1">{law.name}</CardTitle>
          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[law.category] ?? ''}`}>
            {law.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {law.identities.map((id, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 rounded-md bg-muted/30 border border-border/60"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="font-mono text-sm font-semibold">{id.expression}</code>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <code className="font-mono text-sm text-primary font-semibold">{id.simplified}</code>
            </div>
            {id.explanation && (
              <div className="text-[11px] text-muted-foreground sm:text-right sm:max-w-[40%]">
                {id.explanation}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BooleanLaws() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(BOOLEAN_LAWS.map((l) => l.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BOOLEAN_LAWS.filter((law) => {
      if (category !== 'all' && law.category !== category) return false;
      if (!q) return true;
      const haystack = `${law.name} ${law.category} ${law.identities
        .map((i) => `${i.expression} ${i.simplified} ${i.explanation ?? ''}`)
        .join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search, category]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Label className="text-xs">Search laws</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, expression, or keyword…"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    category === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent border-border'
                  }`}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick reference card */}
      <Card className="bg-muted/20">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="text-sm font-semibold">Quick Reference — Operators & Symbols</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              ['AND', '·', 'A · B'],
              ['OR', '+', 'A + B'],
              ['NOT', '¬ / overbar', '¬A'],
              ['XOR', '⊕', 'A ⊕ B'],
              ['NAND', '↑', 'A ↑ B'],
              ['NOR', '↓', 'A ↓ B'],
            ].map(([name, sym, ex]) => (
              <div key={name} className="rounded-md border border-border bg-card p-2">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-foreground">{sym}</div>
                <div className="font-mono text-[10px] mt-0.5">{ex}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Law cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((law) => (
          <LawCard key={law.id} law={law} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No laws match your search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
