
import { board, getConflicts } from "./game";

import type { CellState, CellElement } from "./types";

export const cellElements: CellElement[] = [];
let cursor = {row: 0, col: 0};
export function getCursor() { return {...cursor}; }

export function buildBoard(container: HTMLElement, onCellClick: (row: number, col: number) => void) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const i = row * 9 + col;
            const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

            const root = document.createElement('button');
            root.className = "cell";
            root.dataset.row = String(row);
            root.dataset.col = String(col);
            root.dataset.box = String(box);
            root.addEventListener("click", () => onCellClick(row, col));

            const valueElement = document.createElement('span');
            valueElement.className = "cell-value";
            root.appendChild(valueElement);

            const noteElements = Array.from({length: 9}, (_, n) => {
                const span = document.createElement("span");
                span.className = "note";
                root.appendChild(span);
                return span;
            });

            container.appendChild(root);
            cellElements.push({root, valueElement, noteElements});
        }
    }
}

export function moveCursor(ny: number, nx: number) {
    cellElements[cursor.row * 9 + cursor.col]!.root.classList.remove("selected");
    cursor = {row: ny, col: nx};
    cellElements[ny * 9 + nx]!.root.classList.add("selected");
}

export function renderCell(i: number) {
    const state = board[i];
    const element = cellElements[i];
    if (!element || !state) return;
    element.root.classList.toggle('given', state.given);
    element.root.classList.toggle('filled', state.value !== null);
    element.root.classList.toggle('empty', state.value === null);
    element.noteElements.forEach((span, n) => {
        span.textContent = state.notes.has(n + 1) ? String(n + 1) : '';
    });
    element.valueElement.textContent = state.value !== null ? String(state.value) : "";
}

export function renderBoard(conflicting: Set<number>|null = null) {
    const conflicts = conflicting ? conflicting : getConflicts();
    for (let i = 0; i < 81; i++) {
        renderCell(i);
        const element = cellElements[i];
        if (element) element.root.classList.toggle("conflict", conflicts.has(i));
    }
    moveCursor(cursor.row, cursor.col);
}
