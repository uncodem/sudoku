
import { board, loadBoard } from "./game";
import { buildBoard, renderBoard, moveCursor, getCursor } from "./render";
import { handleKeyDown, applyNumber, toggleMode, getMode, onModeChange, eraseCell } from "./vim";

const samplePuzzle = "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......";

const boardContainer = document.querySelector<HTMLElement>("#sudoku-board");

if (!boardContainer) throw new Error("#sudoku-board not found in DOM");
buildBoard(boardContainer, (row, col) => moveCursor(row, col));

if (!loadBoard(samplePuzzle)) console.error("Failed to load puzzle: expected 81 characters");

renderBoard();

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

