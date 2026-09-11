
import type { CellState } from "./types";

export const board: CellState[] = Array.from({length: 81}, () => ({
    value: null, given: false, notes: new Set()
}));

export function loadBoard(puzzle: string) {
    if (puzzle.length !== 81) return false;
    for (let i = 0; i < 81; i++) {
        if (puzzle[i] === '.' || puzzle[i] === '0') continue;

        const cell = board[i];
        if (!cell) continue;
        board[i]!.value = Number(puzzle[i]);
        board[i]!.given = true;
        board[i]!.notes = new Set();
    }
    return true;
}

export function setCellValue(i: number, value: number) {
    if (!board[i] || board[i].given) return;
    board[i].value = value;
    board[i].notes.clear();
}

export function toggleNote(i: number, n: number) {
    if (!board[i] || board[i].given) return;
    if (board[i].value !== null) board[i].value = null;
    const notes = board[i].notes;
    notes.has(n) ? notes.delete(n) : notes.add(n);
}

export function clearCell(i: number) {
    if (!board[i] || board[i].given) return;
    board[i].value = null;
    board[i].notes.clear();
}


function cellPeers(i: number): number[] {
    const row = Math.floor(i / 9);
    const col = i % 9;

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    const peers = new Set<number>();

    for (let c = 0; c < 9; c++) peers.add(row * 9 + c);
    for (let r = 0; r < 9; r++) peers.add(r * 9 + col);
    for (let sy = 0; sy < 3; sy++)
        for (let sx = 0; sx < 3; sx++)
            peers.add((boxRow + sy) * 9 + (boxCol + sx));

    peers.delete(i);
    return [...peers];
}

const peerCache: number[][] = Array.from({ length: 81 }, (_, i) => cellPeers(i));

export function getConflicts(): Set<number> {
    const conflicts = new Set<number>();
    for (let i = 0; i < 81; i++) {
        const cell = board[i];
        if (!cell || cell.value === null) continue;
        for (const p of peerCache[i]) {
            const peer = board[p];
            if (peer && peer.value === cell.value) {
                conflicts.add(i);
                conflicts.add(p);
            }
        }
    }
    return conflicts;
}

export function clearBoard() {
    for (let i = 0; i < 81; i++)
        clearCell(i);
}

export function isSolved(): boolean {
    return board.every(cell => cell.value !== null) && getConflicts().size === 0;
}

