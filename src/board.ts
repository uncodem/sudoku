export const POPCOUNT_9BIT: number[] = Array.from({ length: 512 }, (_, i) => {
    let n = i, count = 0;
    while (n) { n &= n - 1; count++; }
    return count;
});

const ALL_CANDIDATES = 0x1ff; // 0b111111111

function computePeers(i: number): number[] {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const peers: number[] = [];

    for (let c = 0; c < 9; c++) if (c !== col) peers.push(row * 9 + c);
    for (let r = 0; r < 9; r++) if (r !== row) peers.push(r * 9 + col);

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let sy = boxRow; sy < boxRow + 3; sy++) {
        for (let sx = boxCol; sx < boxCol + 3; sx++) {
            if (sx !== col && sy !== row) peers.push(sy * 9 + sx);
        }
    }

    return peers; // always exactly 20, no dupes, by construction
}

export function hasConflict(puzzleStr: string|number[]): boolean {
    const rows: Set<string|number>[] = Array.from({ length: 9 }, () => new Set());
    const cols: Set<string|number>[] = Array.from({ length: 9 }, () => new Set());
    const boxes: Set<string|number>[] = Array.from({ length: 9 }, () => new Set());

    for (let i = 0; i < 81; i++) {
        const ch: string|number = puzzleStr[i];
        if (ch === "." || ch === "0" || ch == 0) continue;
        const row = Math.floor(i / 9);
        const col = i % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        if (rows[row].has(ch) || cols[col].has(ch) || boxes[box].has(ch)) return true;
        rows[row].add(ch);
        cols[col].add(ch);
        boxes[box].add(ch);
    }
    return false;
}

export const PEERS = Array.from(
    { length: 81 },
    (_, i) => Object.freeze(computePeers(i))
);

export class Board {
    private data: number[];
    private candidates: number[];

    constructor(cells?: number[]) {
        this.candidates = new Array(81).fill(ALL_CANDIDATES);
        if (cells) {
            if (cells.length !== 81) {
                throw new Error(`expected 81 cells got ${cells.length}`);
            }
            if (hasConflict(cells)) {
                throw new Error("conflicting values: duplicate value in a row, column, or box");
            }
            this.data = [...cells];
            this.computeCandidates();
        } else {
            this.data = new Array(81).fill(0);
        }
    }

    clone(): Board {
        const b = Object.create(Board.prototype) as Board;
        b.data = [...this.data];
        b.candidates = [...this.candidates];
        return b;
    }

    computeCandidates(): void {
        for (let i = 0; i < 81; i++) {
            this.candidates[i] = this.computeCellCandidates(i);
        }
    }

    private computeCellCandidates(i: number): number {
        if (this.data[i] !== 0) return 0;
        let taken = 0;
        for (const p of PEERS[i]) {
            const peer = this.data[p];
            if (peer > 0) taken |= 1 << (peer - 1);
        }
        return ~taken & ALL_CANDIDATES;
    }

    complete(): boolean {
        if (this.invalid()) return false;
        return this.data.every(v => v !== 0);
    }

    invalid(): boolean {
        for (let i = 0; i < 81; i++) {
            if (this.data[i] === 0 && this.candidates[i] === 0) return true;
        }
        return false;
    }

    getCandidates(i: number): number {
        return this.candidates[i];
    }

    getCell(i: number): number {
        return this.data[i];
    }

    /** Returns the list of peer indices whose candidates changed, or null if the move is illegal. */
    setCell(i: number, v: number): number[] | null {
        if (v <= 0 || v > 9) return null;
        if ((this.candidates[i] & (1 << (v - 1))) === 0) return null;

        this.data[i] = v;
        this.candidates[i] = 0;

        const mask = 1 << (v - 1);
        const changed: number[] = [];
        for (const p of PEERS[i]) {
            if ((this.candidates[p] & mask) !== 0) {
                this.candidates[p] &= ~mask;
                changed.push(p);
            }
        }
        return changed;
    }

    toString(): string {
        const hline = "+-------+-------+-------+\n";
        let ret = "";
        for (let row = 0; row < 9; row++) {
            if (row % 3 === 0) ret += hline;
            for (let box = 0; box < 3; box++) {
                ret += "| ";
                for (let c = 0; c < 3; c++) {
                    const v = this.data[row * 9 + box * 3 + c];
                    ret += (v === 0 ? "." : String(v)) + " ";
                }
            }
            ret += "|\n";
        }
        ret += hline;
        return ret;
    }

    toPuzzleString(): string {
        return Array.from({ length: 81 }, (_, i) => {
            const v = this.data[i];
            return v === 0 ? '.' : String(v);
        }).join('');
    }

    static fromString(str: string): Board|null {
        if (hasConflict(str)) return null;
        const cells = str.split('').map(c => (c === '.' ? 0 : Number(c)));
        return new Board(cells);
    }
}
