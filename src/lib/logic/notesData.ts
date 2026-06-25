export interface NoteSection { id: string; title: string; icon: string; intro?: string; blocks: NoteBlock[]; }
export type NoteBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'example'; title: string; expression: string; explanation: string }
  | { type: 'tip'; text: string }
  | { type: 'warning'; text: string };

export const GATE_NOTES: NoteSection[] = [
  { id: 'gates-intro', title: 'Logic Gates — The Complete Reference', icon: '⚡', intro: 'Logic gates are the building blocks of every digital circuit. Each gate takes one or more binary inputs (0 or 1) and produces a single binary output.',
    blocks: [
      { type: 'heading', text: 'What is a logic gate?' },
      { type: 'paragraph', text: 'A logic gate is an electronic switch that performs a boolean function on one or more binary inputs to produce a single binary output. The two binary digits are 0 (LOW / FALSE / OFF) and 1 (HIGH / TRUE / ON). Gates are implemented using transistors and form the basis of every microprocessor, memory chip, and digital system ever built.' },
      { type: 'heading', text: 'The 7 basic gates' },
      { type: 'list', items: ['AND — output is 1 only if ALL inputs are 1','OR — output is 1 if AT LEAST ONE input is 1','NOT — output is the opposite of the input (inverter)','NAND — AND followed by NOT (universal gate)','NOR — OR followed by NOT (universal gate)','XOR — Exclusive OR: output is 1 when inputs DIFFER','XNOR — Exclusive NOR: output is 1 when inputs are THE SAME'] },
      { type: 'tip', text: 'NAND and NOR are called "universal gates" because any other gate can be built using only NANDs or only NORs.' },
    ] },
  { id: 'gate-and', title: 'AND Gate', icon: '∧', intro: 'Output is 1 only when every input is 1. Think of it as a series circuit — both switches must be closed.',
    blocks: [
      { type: 'paragraph', text: 'The AND gate is the logical equivalent of multiplication. If any single input is 0, the output is forced to 0. Boolean expression: F = A · B.' },
      { type: 'heading', text: '2-input truth table' },
      { type: 'table', headers: ['A','B','F = A·B'], rows: [['0','0','0'],['0','1','0'],['1','0','0'],['1','1','1']] },
      { type: 'heading', text: '3-input truth table' },
      { type: 'table', headers: ['A','B','C','F = A·B·C'], rows: [['0','0','0','0'],['0','0','1','0'],['0','1','0','0'],['0','1','1','0'],['1','0','0','0'],['1','0','1','0'],['1','1','0','0'],['1','1','1','1']] },
      { type: 'tip', text: 'Real-world example: a seat-belt alarm. The buzzer sounds only if (key is ON) AND (seat occupied) AND (belt unbuckled).' },
    ] },
  { id: 'gate-or', title: 'OR Gate', icon: '∨', intro: 'Output is 1 if at least one input is 1. Think of it as a parallel circuit — either switch being closed is enough.',
    blocks: [
      { type: 'paragraph', text: 'The OR gate is the logical equivalent of addition. The only way to get a 0 is if every input is 0. Boolean expression: F = A + B.' },
      { type: 'heading', text: '2-input truth table' },
      { type: 'table', headers: ['A','B','F = A+B'], rows: [['0','0','0'],['0','1','1'],['1','0','1'],['1','1','1']] },
      { type: 'heading', text: '3-input truth table' },
      { type: 'table', headers: ['A','B','C','F = A+B+C'], rows: [['0','0','0','0'],['0','0','1','1'],['0','1','0','1'],['0','1','1','1'],['1','0','0','1'],['1','0','1','1'],['1','1','0','1'],['1','1','1','1']] },
    ] },
  { id: 'gate-not', title: 'NOT Gate (Inverter)', icon: '¬', intro: 'Output is the opposite of the input. A single-input gate.',
    blocks: [
      { type: 'paragraph', text: 'The NOT gate flips the bit: 0 becomes 1 and 1 becomes 0. Boolean expression: F = Ā or F = ¬A.' },
      { type: 'table', headers: ['A','F = Ā'], rows: [['0','1'],['1','0']] },
    ] },
  { id: 'gate-nand', title: 'NAND Gate', icon: '⊼', intro: 'AND followed by NOT. Output is 0 only when ALL inputs are 1. Universal gate.',
    blocks: [
      { type: 'paragraph', text: 'NAND = NOT(AND). Boolean expression: F = (A·B)̄.' },
      { type: 'table', headers: ['A','B','F = (A·B)̄'], rows: [['0','0','1'],['0','1','1'],['1','0','1'],['1','1','0']] },
    ] },
  { id: 'gate-nor', title: 'NOR Gate', icon: '⊽', intro: 'OR followed by NOT. Output is 1 only when ALL inputs are 0. Universal gate.',
    blocks: [
      { type: 'paragraph', text: 'NOR = NOT(OR). Boolean expression: F = (A+B)̄.' },
      { type: 'table', headers: ['A','B','F = (A+B)̄'], rows: [['0','0','1'],['0','1','0'],['1','0','0'],['1','1','0']] },
    ] },
  { id: 'gate-xor', title: 'XOR Gate (Exclusive OR)', icon: '⊕', intro: 'Output is 1 when inputs DIFFER. Used in adders, parity checks, and cryptography.',
    blocks: [
      { type: 'paragraph', text: 'XOR outputs 1 if an ODD number of inputs are 1. For 2 inputs, that means "different". Boolean expression: F = A ⊕ B = A·B̄ + Ā·B.' },
      { type: 'table', headers: ['A','B','F = A ⊕ B'], rows: [['0','0','0'],['0','1','1'],['1','0','1'],['1','1','0']] },
      { type: 'tip', text: 'Note: 3-input XOR is "odd number of inputs are 1", NOT "exactly one input is 1".' },
    ] },
  { id: 'gate-xnor', title: 'XNOR Gate (Exclusive NOR)', icon: '⊙', intro: 'Output is 1 when inputs are EQUAL. The complement of XOR.',
    blocks: [
      { type: 'paragraph', text: 'XNOR outputs 1 if an EVEN number of inputs are 1. Boolean expression: F = A ⊙ B = A·B + Ā·B̄.' },
      { type: 'table', headers: ['A','B','F = A ⊙ B'], rows: [['0','0','1'],['0','1','0'],['1','0','0'],['1','1','1']] },
    ] },
  { id: 'gate-summary', title: 'Quick Reference: All Gates', icon: '📋', intro: 'Use this as a cheat sheet.',
    blocks: [
      { type: 'table', headers: ['Gate','Symbol','Expression','Output is 1 when…'], rows: [['AND','∧','A·B','both inputs are 1'],['OR','∨','A+B','any input is 1'],['NOT','¬','Ā','input is 0'],['NAND','⊼','(A·B)̄','NOT both inputs are 1'],['NOR','⊽','(A+B)̄','both inputs are 0'],['XOR','⊕','A⊕B','inputs differ'],['XNOR','⊙','A⊙B','inputs are equal']] },
    ] },
];

export const KMAP_NOTES: NoteSection[] = [
  { id: 'kmap-intro', title: 'Karnaugh Maps — A Beginner-Friendly Guide', icon: '🗺️', intro: 'A Karnaugh map (K-map) is a visual method for simplifying boolean expressions without using algebra. Invented by Maurice Karnaugh in 1953.',
    blocks: [
      { type: 'heading', text: 'Why use a K-map?' },
      { type: 'paragraph', text: 'Boolean expressions can often be simplified. For example, A·B + A·B·C can be reduced to just A·B. A K-map lets you SEE the simplification by laying out the truth table in a special grid where adjacent cells differ by only one variable.' },
      { type: 'heading', text: 'The big idea' },
      { type: 'paragraph', text: 'In a K-map, every cell represents one row of the truth table (one minterm). Cells are arranged so that moving one step in any direction changes exactly ONE variable. Adjacent cells that both contain 1 can be combined — the differing variable drops out.' },
    ] },
  { id: 'kmap-how-to-build', title: 'How to Draw a K-map (2, 3, 4 variables)', icon: '✏️',
    blocks: [
      { type: 'heading', text: 'Step 1: Count variables, choose grid size' },
      { type: 'list', items: ['2 variables (A, B) → 2×2 grid (4 cells)','3 variables (A, B, C) → 2×4 grid (8 cells)','4 variables (A, B, C, D) → 4×4 grid (16 cells)'] },
      { type: 'heading', text: 'Step 2: Label rows and columns with GRAY CODE' },
      { type: 'paragraph', text: 'Gray code is an ordering where each successive value differs by exactly one bit: 00, 01, 11, 10. Using this for rows AND columns means every adjacent pair of cells differs by exactly one variable.' },
      { type: 'heading', text: 'Step 3: Fill in 1s from the truth table' },
      { type: 'heading', text: 'Step 4: Group the 1s' },
      { type: 'warning', text: 'The K-map WRAPS AROUND. The leftmost column is adjacent to the rightmost column. The top row is adjacent to the bottom row.' },
    ] },
  { id: 'kmap-pairs', title: 'How to Make Groups (Pairs, Quads, Octets)', icon: '⬚',
    blocks: [
      { type: 'heading', text: 'Group sizes must be powers of 2' },
      { type: 'table', headers: ['Group size','Name','Variables dropped'], rows: [['1','Single','0'],['2','Pair','1'],['4','Quad','2'],['8','Octet','3'],['16','All 1s','4 (F=1)']] },
      { type: 'heading', text: 'Rules for grouping' },
      { type: 'list', items: ['✅ Groups must be RECTANGULAR','✅ Group size must be a power of 2 (1, 2, 4, 8, 16)','✅ Cells can wrap around the edges','✅ Cells can overlap','✅ Every 1 must be in at least one group','❌ Diagonal groups are NOT allowed','❌ Groups of 3, 5, 6, 7 are NOT allowed'] },
      { type: 'tip', text: 'Bigger groups = simpler expressions = fewer gates. Always prefer bigger groups!' },
    ] },
  { id: 'kmap-worked-example', title: 'Worked Example: 3-Variable K-map', icon: '🧮',
    blocks: [
      { type: 'paragraph', text: 'Problem: Simplify F(A,B,C) = Σm(1, 3, 5, 7) — the truth table has 1s at minterms 1, 3, 5, 7.' },
      { type: 'heading', text: 'Step 1: Lay out the 3-var K-map' },
      { type: 'table', headers: ['A \\ BC','00','01','11','10'], rows: [['0','m0','m1','m3','m2'],['1','m4','m5','m7','m6']] },
      { type: 'heading', text: 'Step 2: Place the 1s' },
      { type: 'table', headers: ['A \\ BC','00','01','11','10'], rows: [['0','0','1','1','0'],['1','0','1','1','0']] },
      { type: 'heading', text: 'Step 3: Identify groups' },
      { type: 'paragraph', text: 'The four 1s form a 2×2 quad in the middle two columns covering m1, m3, m5, m7.' },
      { type: 'heading', text: 'Step 4: Read the term' },
      { type: 'list', items: ['A: changes (0 and 1) → DROP A','B: changes (0 and 1) → DROP B','C: stays 1 throughout → INCLUDE C'] },
      { type: 'paragraph', text: 'The simplified term is just: C. Final answer: F = C' },
      { type: 'tip', text: 'We started with four minterms and ended with a single variable! This is the power of K-maps.' },
    ] },
];

export const BOOLEAN_FUNCTION_NOTES: NoteSection[] = [
  { id: 'bf-intro', title: 'Boolean Functions — Definition and Basics', icon: '🔢', intro: 'A boolean function is a function whose inputs and output are all boolean (0 or 1).',
    blocks: [
      { type: 'heading', text: 'Definition' },
      { type: 'paragraph', text: 'A boolean function of n variables is a mapping f: {0,1}ⁿ → {0,1}. There are 2^(2ⁿ) possible boolean functions of n variables.' },
      { type: 'table', headers: ['n','2ⁿ','2^(2ⁿ)'], rows: [['1','2','4'],['2','4','16'],['3','8','256'],['4','16','65,536']] },
    ] },
  { id: 'bf-representations', title: 'Ways to Represent a Boolean Function', icon: '📝',
    blocks: [
      { type: 'heading', text: '1. Algebraic expression' },
      { type: 'paragraph', text: 'Example: F = A·B + Ā·C. Compact but not unique.' },
      { type: 'heading', text: '2. Truth table' },
      { type: 'paragraph', text: 'Lists every input combination and the output. UNIQUE for each function.' },
      { type: 'heading', text: '3. Logic circuit' },
      { type: 'paragraph', text: 'A diagram of gates connected by wires.' },
      { type: 'heading', text: '4. Minterm / Maxterm form' },
      { type: 'paragraph', text: 'F = Σm(1, 3, 6, 7) means F is 1 at minterms 1, 3, 6, 7.' },
      { type: 'heading', text: '5. Karnaugh map' },
      { type: 'paragraph', text: 'A visual representation for easy simplification.' },
    ] },
  { id: 'bf-minterms-maxterms', title: 'Minterms and Maxterms', icon: '∑',
    blocks: [
      { type: 'heading', text: 'Minterm (product term)' },
      { type: 'paragraph', text: 'A product (AND) term in which every variable appears exactly once. A minterm evaluates to 1 for exactly ONE input combination.' },
      { type: 'list', items: ['For 2 vars: m0 = ĀB̄, m1 = ĀB, m2 = AB̄, m3 = AB','For 3 vars: m0 = ĀB̄C̄, m1 = ĀB̄C, ..., m7 = ABC'] },
      { type: 'heading', text: 'Sum of Minterms (canonical SOP)' },
      { type: 'paragraph', text: 'F = Σm(list of minterm numbers where F=1).' },
      { type: 'tip', text: 'Memory aid: MIN-terms → MINIMUM number of 1s (only one 1). MAX-terms → MAXIMUM number of 1s (only one 0).' },
    ] },
  { id: 'bf-sop-pos', title: 'Sum-of-Products (SOP) and Product-of-Sums (POS)', icon: '⚙️',
    blocks: [
      { type: 'heading', text: 'Sum of Products (SOP)' },
      { type: 'paragraph', text: 'An OR of AND-terms. Example: F = A·B + B̄·C + A·C̄. Natural output of K-map simplification.' },
      { type: 'heading', text: 'Product of Sums (POS)' },
      { type: 'paragraph', text: 'An AND of OR-terms. Example: F = (A+B)·(B̄+C)·(A+C̄). Obtained by grouping 0s in a K-map.' },
      { type: 'list', items: ['Use SOP if the truth table has fewer 1s than 0s','Use POS if the truth table has fewer 0s than 1s'] },
    ] },
  { id: 'bf-simplification', title: 'Simplifying Boolean Functions', icon: '✨',
    blocks: [
      { type: 'paragraph', text: 'Why simplify? A simpler expression needs fewer gates, fewer wires, less power, and a smaller chip.' },
      { type: 'heading', text: 'Method 1: Algebraic simplification' },
      { type: 'example', title: 'Example', expression: 'F = A·B + A·B·C', explanation: 'Factor A·B: F = A·B·(1 + C) = A·B·1 = A·B' },
      { type: 'heading', text: 'Method 2: Karnaugh maps' },
      { type: 'paragraph', text: 'Visual method, best for 2-4 variables. Faster than algebra and less error-prone.' },
      { type: 'heading', text: 'Method 3: Quine-McCluskey algorithm' },
      { type: 'paragraph', text: 'Tabular method that works for any number of variables. Used in CAD tools.' },
    ] },
  { id: 'bf-laws-recap', title: 'Boolean Laws Cheat Sheet', icon: '📋',
    blocks: [
      { type: 'table', headers: ['Law','Identity','Result'], rows: [['Identity','A + 0','A'],['Identity','A · 1','A'],['Null','A + 1','1'],['Null','A · 0','0'],['Idempotent','A + A','A'],['Complement','A + Ā','1'],['Complement','A · Ā','0'],['Involution','Ā̄','A'],['Commutative','A + B','B + A'],['Distributive','A·(B+C)','(A·B)+(A·C)'],['Absorption','A·(A+B)','A'],['De Morgan','¬(A·B)','Ā+B̄'],['De Morgan','¬(A+B)','Ā·B̄']] },
    ] },
];
