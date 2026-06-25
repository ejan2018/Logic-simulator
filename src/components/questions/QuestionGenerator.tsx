'use client';
import { useState, useCallback, useMemo } from 'react';
import { generateQuestionSet, generateQuestionBank, Question } from '@/lib/logic/questions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dices, RefreshCw, Lightbulb, ChevronDown, ChevronUp, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

const TYPE_LABELS: Record<Question['type'], { label: string; color: string }> = {
  'design-circuit': { label: 'Design Circuit', color: 'bg-sky-100 text-sky-900 border-sky-200' },
  'truth-table': { label: 'Truth Table', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  'simplify-kmap': { label: 'K-Map Simplify', color: 'bg-violet-100 text-violet-900 border-violet-200' },
  'identify-gate': { label: 'Identify Gate', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  'write-expression': { label: 'Write Expression', color: 'bg-rose-100 text-rose-900 border-rose-200' },
};

function QuestionCard({ question, number }: { question: Question; number: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const ti = TYPE_LABELS[question.type];
  return (
    <Card><CardHeader className="pb-3"><div className="flex items-start gap-3 flex-wrap"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="font-mono font-bold text-sm text-muted-foreground">#{number}</span><Badge variant="outline" className={`text-[10px] ${ti.color}`}>{ti.label}</Badge></div></div><CardTitle className="text-sm font-semibold leading-snug mt-1">{question.section}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-foreground/90">{question.prompt}</p>
        {question.expression && <div className="font-mono text-sm bg-muted/40 border border-border rounded-md p-3 whitespace-pre-wrap break-words">{question.expression}</div>}
        {question.type === 'truth-table' && question.truthTable && question.variables && <TruthTablePreview truthTable={question.truthTable} variables={question.variables} />}
        {question.type === 'write-expression' && question.truthTable && question.variables && <TruthTablePreview truthTable={question.truthTable} variables={question.variables} />}

        {/* Hint */}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setShowHint((s) => !s)} className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 self-start hover:underline"><Lightbulb className="h-3.5 w-3.5" />{showHint ? 'Hide hint' : 'Show hint'}{showHint ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>
          {showHint && question.hint && <div className="text-xs p-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200">{question.hint}</div>}
        </div>

        {/* Solution */}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setShowSolution((s) => !s)} className="text-xs text-primary flex items-center gap-1 self-start hover:underline"><CheckCircle2 className="h-3.5 w-3.5" />{showSolution ? 'Hide solution' : 'Show solution'}{showSolution ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>
          {showSolution && (
            <div className="flex flex-col gap-2">
              {question.solution && (
                <div className="text-sm p-2 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5 uppercase tracking-wider">Answer</div>
                  <div className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{question.solution}</div>
                </div>
              )}
              {question.solutionSteps && question.solutionSteps.length > 0 && (
                <div className="text-xs p-2 rounded-md border border-primary/30 bg-primary/5">
                  <div className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">Solution Steps</div>
                  <div className="flex flex-col gap-1">
                    {question.solutionSteps.map((step, i) => <div key={i} className="flex gap-1.5"><ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/50" /><span className="text-foreground/80">{step}</span></div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TruthTablePreview({ truthTable, variables }: { truthTable: number[]; variables: string[] }) {
  const n = variables.length; const rows = 1 << n;
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs font-mono">
        <thead className="bg-muted"><tr>{variables.map((v) => <th key={v} className="px-2 py-1 text-center font-semibold border-b border-border">{v}</th>)}<th className="px-2 py-1 text-center font-semibold border-b border-border text-primary">F</th><th className="px-2 py-1 text-center font-semibold border-b border-border text-muted-foreground">m</th></tr></thead>
        <tbody>{Array.from({length:rows},(_,combo)=>{const bits=combo.toString(2).padStart(n,'0').split('').map(b=>parseInt(b,10));return <tr key={combo} className={combo%2===0?'bg-card':'bg-muted/30'}>{bits.map((b,i)=><td key={i} className="px-2 py-1 text-center">{b}</td>)}<td className="px-2 py-1 text-center font-bold text-primary">{truthTable[combo]}</td><td className="px-2 py-1 text-center text-muted-foreground">m{combo}</td></tr>;})}</tbody>
      </table>
    </div>
  );
}

export function QuestionGenerator() {
  const [mode, setMode] = useState<'quick' | 'bank'>('quick');
  const [questions, setQuestions] = useState<Question[]>(() => generateQuestionSet(6));
  const [bankSize, setBankSize] = useState(200);
  const [bankIndex, setBankIndex] = useState(0);
  const [bank, setBank] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const regenerate = useCallback(() => {
    setQuestions(generateQuestionSet(6));
  }, []);

  const generateBank = useCallback(() => {
    setBank(generateQuestionBank(bankSize));
    setBankIndex(0);
  }, [bankSize]);

  const filteredQuestions = useMemo(() => {
    if (mode === 'quick') return questions;
    if (!bank.length) return [];
    if (!searchTerm.trim()) return [bank[bankIndex]];
    const q = searchTerm.toLowerCase();
    return bank.filter((qn) => `${qn.section} ${qn.prompt} ${qn.expression ?? ''} ${qn.expectedAnswer ?? ''}`.toLowerCase().includes(q));
  }, [mode, questions, bank, bankIndex, searchTerm]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mode selector + controls */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-2"><Dices className="h-4 w-4 text-primary" />Practice Problem Set</div>
              <div className="text-xs text-muted-foreground mt-1">Auto-generated questions with full solutions. Choose Quick Set for 6 random questions, or Question Bank for up to 200 unique questions you can browse through.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" variant={mode === 'quick' ? 'default' : 'outline'} size="sm" onClick={() => setMode('quick')}>Quick Set (6)</Button>
            <Button type="button" variant={mode === 'bank' ? 'default' : 'outline'} size="sm" onClick={() => setMode('bank')}>Question Bank</Button>
            {mode === 'quick' && <Button type="button" onClick={regenerate} size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Generate new set</Button>}
            {mode === 'bank' && (
              <>
                <div className="flex items-center gap-1">
                  <Label className="text-xs whitespace-nowrap">Count:</Label>
                  <Input type="number" value={bankSize} onChange={(e) => setBankSize(Math.max(1, Math.min(200, Number(e.target.value))))} className="w-16 h-8 text-xs" min={1} max={200} />
                </div>
                <Button type="button" onClick={generateBank} size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Generate {bankSize} questions</Button>
              </>
            )}
          </div>
          {mode === 'bank' && bank.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBankIndex(Math.max(0, bankIndex - 1))} disabled={bankIndex === 0}>← Prev</Button>
              <span className="text-xs font-mono font-semibold">Question {bankIndex + 1} of {bank.length}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setBankIndex(Math.min(bank.length - 1, bankIndex + 1))} disabled={bankIndex === bank.length - 1}>Next →</Button>
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search questions…" className="w-40 h-8 text-xs" />
              <span className="text-[10px] text-muted-foreground">{bank.length} unique questions generated</span>
            </div>
          )}
          {mode === 'bank' && bank.length === 0 && (
            <div className="text-xs text-muted-foreground italic p-3 rounded-md border border-dashed border-border">Click "Generate {bankSize} questions" to create a bank of unique practice questions with solutions.</div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      {mode === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredQuestions.map((q, i) => <QuestionCard key={q.id} question={q} number={i + 1} />)}
        </div>
      )}
      {mode === 'bank' && filteredQuestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredQuestions.map((q, i) => <QuestionCard key={q.id} question={q} number={bankIndex + i + 1} />)}
        </div>
      )}

      {/* Tip */}
      <Card><CardContent className="p-4 text-xs text-muted-foreground"><strong className="text-foreground"><BookOpen className="inline h-3.5 w-3.5 mr-1" />How to use:</strong> Try solving each problem on paper or in the Simulator tab. For K-map problems, switch to the K-Map tab, set the matching variables, click the cells at the listed minterms, then click <strong>Solve</strong>. Click <strong>Show solution</strong> on any question to see the answer and step-by-step solution.</CardContent></Card>
    </div>
  );
}
