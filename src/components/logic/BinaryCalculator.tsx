'use client';

import { useMemo, useState } from 'react';
import {
  BINARY_OPERATIONS,
  BinaryOperationInfo,
  applyBinaryOp,
  describeResult,
  parseValue,
  BitOp,
} from '@/lib/logic/binaryCalc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Base = 2 | 8 | 10 | 16;

const BASE_LABELS: Record<Base, string> = {
  2: 'Binary',
  8: 'Octal',
  10: 'Decimal',
  16: 'Hex',
};

function ResultRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} break-all text-right`}>{value}</span>
    </div>
  );
}

export function BinaryCalculator() {
  const [inputA, setInputA] = useState('1010');
  const [inputB, setInputB] = useState('0011');
  const [baseA, setBaseA] = useState<Base>(2);
  const [baseB, setBaseB] = useState<Base>(2);
  const [bits, setBits] = useState(8);
  const [selectedOp, setSelectedOp] = useState<BitOp>('AND');

  const valueA = useMemo(() => parseValue(inputA, baseA), [inputA, baseA]);
  const valueB = useMemo(() => parseValue(inputB, baseB), [inputB, baseB]);

  const op = useMemo(
    () => BINARY_OPERATIONS.find((o) => o.op === selectedOp) as BinaryOperationInfo,
    [selectedOp],
  );

  const result = useMemo(() => {
    if (valueA === null) return null;
    if (!op.unary && valueB === null) return null;
    const a = valueA;
    const b = valueB ?? 0n;
    const out = applyBinaryOp(a, b, op.op, bits);
    return describeResult(out, bits);
  }, [valueA, valueB, op, bits]);

  const aDisplay = valueA !== null ? describeResult(valueA, bits) : null;
  const bDisplay = valueB !== null ? describeResult(valueB, bits) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      {/* Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operand A */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Operand A</Label>
                <Select
                  value={String(baseA)}
                  onValueChange={(v) => setBaseA(Number(v) as Base)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BASE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-xs">
                        {l} (base {v})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                className={`font-mono ${valueA === null ? 'border-destructive' : ''}`}
                placeholder="Enter value"
              />
              {aDisplay && (
                <div className="rounded-md border border-border bg-muted/30 p-2 flex flex-col gap-0.5">
                  <ResultRow label="Bin" value={aDisplay.binary} />
                  <ResultRow label="Dec" value={aDisplay.decimal} />
                  <ResultRow label="Hex" value={aDisplay.hex} />
                  <ResultRow label="Oct" value={aDisplay.octal} />
                </div>
              )}
              {valueA === null && (
                <div className="text-[11px] text-destructive">
                  Invalid value for base {baseA}
                </div>
              )}
            </div>

            {/* Operand B */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Operand B {op.unary && <span className="text-muted-foreground">(not used)</span>}</Label>
                <Select
                  value={String(baseB)}
                  onValueChange={(v) => setBaseB(Number(v) as Base)}
                  disabled={op.unary}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BASE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-xs">
                        {l} (base {v})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                className="font-mono"
                placeholder="Enter value"
                disabled={op.unary}
              />
              {bDisplay && !op.unary && (
                <div className="rounded-md border border-border bg-muted/30 p-2 flex flex-col gap-0.5">
                  <ResultRow label="Bin" value={bDisplay.binary} />
                  <ResultRow label="Dec" value={bDisplay.decimal} />
                  <ResultRow label="Hex" value={bDisplay.hex} />
                  <ResultRow label="Oct" value={bDisplay.octal} />
                </div>
              )}
              {valueB === null && !op.unary && (
                <div className="text-[11px] text-destructive">
                  Invalid value for base {baseB}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Bit width */}
          <div className="flex items-center gap-3">
            <Label className="text-xs">Bit width</Label>
            <Select value={String(bits)} onValueChange={(v) => setBits(Number(v))}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[4, 8, 16, 32, 64].map((b) => (
                  <SelectItem key={b} value={String(b)} className="text-xs">
                    {b}-bit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operations */}
          <div>
            <Label className="text-xs mb-2 block">Operation</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BINARY_OPERATIONS.map((o) => (
                <Button
                  key={o.op}
                  type="button"
                  size="sm"
                  variant={selectedOp === o.op ? 'default' : 'outline'}
                  onClick={() => setSelectedOp(o.op)}
                  className="text-xs h-9"
                  title={o.description}
                >
                  {o.label}
                </Button>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">{op.description}</div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-sm text-muted-foreground italic">Enter valid operands to compute.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Visual binary with bit indices */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">
                  Binary ({result.bits} bits)
                </div>
                <div className="font-mono text-sm break-all rounded-md bg-muted/40 p-2 border border-border">
                  {result.binary}
                </div>
                {/* Per-bit visualization */}
                <div className="flex flex-wrap gap-0.5 mt-1.5">
                  {result.binary.split('').map((bit, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono font-semibold rounded ${
                        bit === '1'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {bit}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <ResultRow label="Decimal" value={result.decimal} />
              <ResultRow label="Hex" value={result.hex} />
              <ResultRow label="Octal" value={result.octal} />
              <ResultRow label="Bits" value={String(result.bits)} />

              <Separator />

              {/* Expression summary */}
              <div className="text-xs">
                <div className="font-mono break-words rounded-md bg-muted/40 p-2 border border-border">
                  {op.unary ? (
                    <>
                      <span className="text-muted-foreground">{op.label}</span>
                      {' = '}
                      <span className="font-semibold">{result.binary}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">{aDisplay?.binary ?? '?'}</span>
                      <span className="mx-1 font-semibold text-primary">{op.symbol}</span>
                      <span className="text-muted-foreground">{bDisplay?.binary ?? '?'}</span>
                      <span className="mx-1">=</span>
                      <span className="font-semibold">{result.binary}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
