
import { getCursor, moveCursor, renderBoard } from "./render";
import { setCellValue, toggleNote, clearCell } from "./game";

enum Mode {
    Place = "place",
    Notes = "notes"
}

let mode: Mode = Mode.Place;

type ModeListener = (mode: Mode) => void;
let modeListeners: ModeListener[] = [];

export function getMode() { return mode; }
export function onModeChange(fn: ModeListener) { modeListeners.push(fn); }

export function toggleMode() {
    mode = mode === Mode.Place ? Mode.Notes : Mode.Place;
    modeListeners.forEach(fn => fn(mode));
}

export function applyNumber(i: number, num: number) {
    mode === Mode.Place ? setCellValue(i, num) : toggleNote(i, num);
    renderBoard();
}

export function eraseCell(i: number) {
    clearCell(i);
    renderBoard();
}

const navMap: Record<string, [number, number]> = {
    h: [0, -1], ArrowLeft: [0, -1],
    Tab: [0,1], l: [0, 1], ArrowRight: [0, 1],
    k: [-1, 0], ArrowUp: [-1, 0],
    j: [1, 0], ArrowDown: [1, 0],
};

const keypadMap: Record<string, number> = {
    q: 1, w: 2, e: 3,
    a: 4, s: 5, d: 6,
    z: 7, x: 8, c: 9,
};

function resolveNumber(key: string): number | null {
    if (/^[1-9]$/.test(key)) return Number(key);
    const mapped = keypadMap[key.toLowerCase()];
    return mapped ?? null;
}

export function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const {row, col} = getCursor();
    const i = row * 9 + col;
    if (e.key in navMap) {
        const [dr, dc] = navMap[e.key] ?? [0, 0];
        const ny = Math.min(8, Math.max(0, row + dr));
        const nx = Math.min(8, Math.max(0, col + dc));
        moveCursor(ny, nx);
        e.preventDefault();
        return;
    }

    if (e.key === ' ' || e.key === 'Escape') {
        toggleMode();
        e.preventDefault();
        return;
    }

    if (e.key.toLowerCase() === 'r') {
        eraseCell(i);
        e.preventDefault();
        return;
    }

    const num = resolveNumber(e.key);
    if (num !== null) {
        applyNumber(i, num);
        e.preventDefault();
        return;
    }

}

