export type KMapSize = 2 | 3 | 4;

export interface KMapConfig { size: KMapSize; variables: string[]; rowLabels: string[]; colLabels: string[]; rows: number; cols: number; }

export function getKMapConfig(size: KMapSize, variables?: string[]): KMapConfig {
  const gray2 = ['0', '1']; const gray4 = ['00', '01', '11', '10'];
  if (size === 2) return { size, variables: variables ?? ['A','B'], rowLabels: gray2, colLabels: gray2, rows: 2, cols: 2 };
  if (size === 3) return { size, variables: variables ?? ['A','B','C'], rowLabels: gray2, colLabels: gray4, rows: 2, cols: 4 };
  return { size, variables: variables ?? ['A','B','C','D'], rowLabels: gray4, colLabels: gray4, rows: 4, cols: 4 };
}

export function cellToMinterm(size: KMapSize, row: number, col: number): number {
  const g2 = ['0','1']; const g4 = ['00','01','11','10'];
  let r: string, c: string;
  if (size === 2) { r = g2[row]; c = g2[col]; }
  else if (size === 3) { r = g2[row]; c = g4[col]; }
  else { r = g4[row]; c = g4[col]; }
  return parseInt(r + c, 2);
}

export function truthTableToKMap(size: KMapSize, truthTable: number[]): number[][] {
  const cfg = getKMapConfig(size);
  const grid: number[][] = [];
  for (let r = 0; r < cfg.rows; r++) { const row: number[] = []; for (let c = 0; c < cfg.cols; c++) row.push(truthTable[cellToMinterm(size,r,c)] ?? 0); grid.push(row); }
  return grid;
}

export function mintermToTerm(size: KMapSize, minterm: number, variables?: string[]): string {
  const cfg = getKMapConfig(size, variables);
  const bits = minterm.toString(2).padStart(size, '0');
  let term = '';
  for (let i = 0; i < size; i++) term += bits[i] === '1' ? cfg.variables[i] : cfg.variables[i] + '\u0304';
  return term;
}

export interface KMapGroup { cells: { row: number; col: number }[]; size: number; term: string; }

function simplifyGroup(minterms: number[], size: KMapSize, variables: string[]): string {
  const bits = minterms.map((m) => m.toString(2).padStart(size, '0'));
  let term = '';
  for (let i = 0; i < size; i++) {
    if (bits.every((b) => b[i] === bits[0][i])) term += bits[0][i] === '1' ? variables[i] : variables[i] + '\u0304';
  }
  return term || '1';
}

export function findKMapGroups(size: KMapSize, grid: number[][], variables?: string[]): KMapGroup[] {
  const cfg = getKMapConfig(size, variables);
  const isOne = (r: number, c: number) => { const rr = ((r%cfg.rows)+cfg.rows)%cfg.rows; const cc = ((c%cfg.cols)+cfg.cols)%cfg.cols; return grid[rr]?.[cc] === 1; };
  const groups: KMapGroup[] = [];
  const powersOf2 = [1,2,4];
  const validDims: {h:number;w:number}[] = [];
  for (const h of powersOf2) for (const w of powersOf2) { if (h>cfg.rows||w>cfg.cols) continue; if ([1,2,4,8,16].includes(h*w)) validDims.push({h,w}); }
  const seen = new Set<string>();
  for (let r0 = 0; r0 < cfg.rows; r0++) for (let c0 = 0; c0 < cfg.cols; c0++) for (const {h,w} of validDims) {
    const cells: {row:number;col:number}[] = []; let allOnes = true;
    for (let dr = 0; dr < h && allOnes; dr++) for (let dc = 0; dc < w && allOnes; dc++) {
      const r=r0+dr, c=c0+dc; if (!isOne(r,c)) { allOnes = false; break; }
      cells.push({ row: ((r%cfg.rows)+cfg.rows)%cfg.rows, col: ((c%cfg.cols)+cfg.cols)%cfg.cols });
    }
    if (!allOnes) continue;
    const key = cells.map((c)=>`${c.row},${c.col}`).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ cells, size: cells.length, term: simplifyGroup(cells.map((c)=>cellToMinterm(size,c.row,c.col)), size, cfg.variables) });
  }
  return groups.filter((g) => !groups.some((o) => o !== g && o.size > g.size && g.cells.every((c) => o.cells.some((oc) => oc.row === c.row && oc.col === c.col))));
}

export function simplifyKMap(size: KMapSize, grid: number[][], variables?: string[]): { expression: string; groups: KMapGroup[] } {
  const cfg = getKMapConfig(size, variables);
  const allGroups = findKMapGroups(size, grid, cfg.variables);
  const oneCells: {row:number;col:number}[] = [];
  for (let r = 0; r < cfg.rows; r++) for (let c = 0; c < cfg.cols; c++) if (grid[r][c] === 1) oneCells.push({row:r,col:c});
  const remaining = new Set(oneCells.map((c) => `${c.row},${c.col}`));
  const chosen: KMapGroup[] = [];
  while (remaining.size > 0) {
    let best: KMapGroup | null = null; let bestUncovered = -1;
    for (const g of allGroups) {
      const covered = g.cells.filter((c) => remaining.has(`${c.row},${c.col}`));
      if (covered.length > bestUncovered || (covered.length === bestUncovered && best && g.size > best.size)) { bestUncovered = covered.length; best = g; }
    }
    if (!best || bestUncovered <= 0) break;
    chosen.push(best);
    for (const c of best.cells) remaining.delete(`${c.row},${c.col}`);
  }
  if (chosen.length === 0) return oneCells.length === 0 ? { expression: '0', groups: [] } : { expression: '1', groups: [] };
  const seen = new Set<string>(); const terms: string[] = [];
  for (const g of chosen) if (!seen.has(g.term)) { seen.add(g.term); terms.push(g.term); }
  return { expression: terms.join(' + '), groups: chosen };
}
