
import { board, loadBoard, clearBoard } from "./game";
import { buildBoard, renderBoard, moveCursor, getCursor } from "./render";
import { handleKeyDown, applyNumber, toggleMode, getMode, onModeChange, eraseCell } from "./vim";
import { Board } from "./board";

// const samplePuzzle = "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......";
const boardContainer = document.querySelector<HTMLElement>("#sudoku-board");
if (!boardContainer) throw new Error("#sudoku-board not found in DOM");
buildBoard(boardContainer, (row, col) => moveCursor(row, col));

let solution: Board|null = null;

const worker = new Worker("/worker.js");
worker.postMessage({ command: "generate", targetClues: 30 });
worker.onmessage = (e) => {
    if (e.data.type === "generated") {
        clearBoard();
        loadBoard(e.data.puzzle);
        solution = Board.fromString(e.data.solution);
        renderBoard();
    } else if (e.data.type === "solved") {
        const propSolution = e.data.solution;
        if (!propSolution) {
            alert("Invalid board, no solution provided.");
        } else {
            solution = Board.fromString(propSolution);
        }
    }
};
// if (!loadBoard(samplePuzzle)) console.error("Failed to load puzzle: expected 81 characters");

document.addEventListener("keydown", handleKeyDown);

document.querySelectorAll<HTMLButtonElement>('.panel-input').forEach((btn, idx) => {
    if (idx < 9) {
        btn.addEventListener("click", () => {
            const { row, col } = getCursor();
            applyNumber(row * 9 + col, idx + 1);
            btn.blur();
        });
    } else {
        btn.addEventListener("click", () => {
            const {row, col} = getCursor();
            eraseCell(row * 9 + col);
            btn.blur();
        });
    }
});

const notesToggleBtn = document.querySelector<HTMLButtonElement>("#notes-toggle");
notesToggleBtn?.addEventListener("click", () => {
    toggleMode();
    notesToggleBtn.blur();
});

onModeChange((mode) => {
    if (notesToggleBtn) {
        let isNotes = mode === 'notes';
        notesToggleBtn.classList.toggle("notes-mode", isNotes);
    }
});

const scanBtn = document.querySelector<HTMLButtonElement>("#scan-btn");
scanBtn?.addEventListener("click", () => {
    if (!solution) return;
    const wrongs = new Set<number>();
    for (let i = 0; i < 81; i++) {
        const current = board[i];
        const solved = solution.getCell(i);
        if (current.value && current.value !== solved) wrongs.add(i);
    }
    renderBoard(wrongs);
});

const clearBtn = document.querySelector<HTMLButtonElement>("#clear-btn");
clearBtn?.addEventListener("click", () => {
    clearBoard();
    renderBoard();
});

const dialog = document.querySelector<HTMLDialogElement>("#new-board-dialog");
const openBtn = document.querySelector<HTMLButtonElement>("#new-board-btn");
openBtn?.addEventListener("click", () => dialog?.showModal());
document.querySelector("#generate-btn")?.addEventListener("click", () => {
    const clueInput = document.querySelector<HTMLInputElement>("#clue-count");
    const clue = Number(clueInput?.value ?? 30);
    clearBoard(true);
    worker.postMessage({ command: "generate", targetClues: clue });
    dialog?.close();
});

document.querySelector<HTMLInputElement>("#dialog-cancel")?.addEventListener("click", () => {
    dialog?.close();
});

document.querySelector<HTMLButtonElement>("#load-btn")?.addEventListener("click", () => {
    const stringInput = document.querySelector<HTMLInputElement>("#puzzle-string");
    const puzzleData = stringInput?.value.trim();
    if (puzzleData && puzzleData.length === 81) {
        const oldSolution = solution;
        solution = null;
        worker.postMessage({command: "solve", puzzleStr: puzzleData});

        clearBoard(true);
        loadBoard(puzzleData);
        renderBoard();
        dialog?.close();
    } else {
        alert("Puzzle string must be exactly 81 characters.");
    }
});

