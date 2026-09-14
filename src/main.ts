
import { board, loadBoard, clearBoard, setCellValue, isSolved } from "./game";
import { buildBoard, renderBoard, moveCursor, getCursor, onRender } from "./render";
import { handleKeyDown, applyNumber, toggleMode, getMode, onModeChange, eraseCell } from "./vim";
import { Board, hasConflict } from "./board";
import { resetTimer, stopTimer, togglePause, isPaused, onPauseChange } from "./timer";
import { getRandomPuzzle, type Tier } from "./puzzlebank";

// const samplePuzzle = "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......";
const boardContainer = document.querySelector<HTMLElement>("#sudoku-board");
if (!boardContainer) throw new Error("#sudoku-board not found in DOM");
buildBoard(boardContainer, (row, col) => {
    if (isPaused()) return;
    moveCursor(row, col);
});

let solution: Board|null = null;

const worker = new Worker("./worker.js");

let resolveCurrent: ((data: any) => void) | null = null;
let queueTail: Promise<void> = Promise.resolve();

worker.onmessage = (e) => {
    resolveCurrent?.(e.data);
    resolveCurrent = null;
}

function askWorker<T = any>(payload: Record<string, unknown>, timeoutMs = 10000): Promise<T> {
    const result = queueTail.then(() => new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            resolveCurrent = null;
            reject(new Error("Worker timed out"));
        }, timeoutMs);
        resolveCurrent = (data) => {
            clearTimeout(timer);
            resolve(data);
        };
        worker.postMessage(payload);
    }));
    queueTail = result.then(() => {}, () => {});
    return result;
}

async function generatePuzzle(targetClues: number) {
    const data = await askWorker<{ puzzle: string; solution?: string }>({ command: "generate", targetClues });
    clearBoard(true);
    loadBoard(data.puzzle);
    resetTimer();
    solution = data.solution ? Board.fromString(data.solution) : null;
    renderBoard();
}

async function solvePuzzle(puzzleStr: string): Promise<Board | null> {
    const data = await askWorker<{ solution: string | null }>({ command: "solve", puzzleStr });
    return data.solution ? Board.fromString(data.solution) : null;
}

generatePuzzle(30);

document.addEventListener("keydown", handleKeyDown);

document.querySelectorAll<HTMLButtonElement>('.panel-input').forEach((btn, idx) => {
    if (idx < 9) {
        btn.addEventListener("click", () => {
            if (isPaused()) return;
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
    if (isPaused() || !solution) return;
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
    if (isPaused()) return;
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
    dialog?.close();
    generatePuzzle(clue);
});

document.querySelector<HTMLInputElement>("#dialog-cancel")?.addEventListener("click", () => {
    dialog?.close();
});

const loadBtn = document.querySelector<HTMLButtonElement>("#load-btn");
loadBtn?.addEventListener("click", async () => {
    const stringInput = document.querySelector<HTMLInputElement>("#puzzle-string");
    const puzzleData = stringInput?.value.trim();
    if (!puzzleData || puzzleData.length !== 81) {
        alert("Puzzle string must be exactly 81 characters.");
        return;
    }

    if (hasConflict(puzzleData)) {
        alert("Invalid board, no solution exists");
        return;
    }

    loadBtn.disabled = true;
    try {
        const solved = await solvePuzzle(puzzleData);
        if (!solved) {
            alert("Invalid board, no solution exists.");
            return; // nothing was touched, no rollback needed
        }
        solution = solved;
        clearBoard(true);
        loadBoard(puzzleData);
        resetTimer();
        renderBoard();
        dialog?.close();
    } finally {
        loadBtn.disabled = false;
    }
});

const solveBtn = document.querySelector<HTMLButtonElement>("#solve-btn");
solveBtn?.addEventListener("click", () => {
    if (isPaused() || solution === null) return;
    for (let i = 0; i < 81; i++) {
        if (board[i].given) continue;
        setCellValue(i, solution.getCell(i));
        board[i].given = true;
    }
    renderBoard();
});

const timerBtn = document.querySelector<HTMLButtonElement>("#timer-btn");
timerBtn?.addEventListener("click", () => {
    togglePause();
    timerBtn.blur();
})

document.querySelector("#pause-indicator")?.addEventListener("click", () => {
    togglePause();
});

onPauseChange((paused) => {
    timerBtn?.classList.toggle("paused", paused);
    document.querySelector("#board-panel")?.classList.toggle("paused", isPaused());
});

onRender(() => {
    if (isSolved()) stopTimer();
})

const randomBtn = document.querySelector<HTMLButtonElement>("#random-btn");
const difficultySelect = document.querySelector<HTMLSelectElement>("#bank-difficulty");
const puzzleStringInput = document.querySelector<HTMLInputElement>("#puzzle-string");

randomBtn?.addEventListener("click", async () => {
    const tier = (difficultySelect?.value ?? "medium") as Tier;
    randomBtn.disabled = true;
    try {
        const puzzle = await getRandomPuzzle(tier);
        if (puzzleStringInput) puzzleStringInput.value = puzzle;
    } catch (err) {
        console.error("Failed to load puzzle bank: ", err);
        alert("Could not load puzzle bank. Try again.");
    } finally {
        randomBtn.disabled = false;
    }
})

