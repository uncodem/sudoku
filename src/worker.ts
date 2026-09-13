
import { generatePuzzle } from "./generator";
import { searchSolution } from "./solver";
import { Board } from "./board";

self.onmessage = (e) => {
    const { command, targetClues, puzzleStr } = e.data;
    if (command === "generate") {
        const puzzle = generatePuzzle(targetClues);
        const solution = searchSolution(puzzle);
        self.postMessage({ type: "generated", puzzle: puzzle.toPuzzleString(), solution: solution?.toPuzzleString() });
    } else if (command === "solve" && puzzleStr) {
        const current = Board.fromString(puzzleStr);
        if (current) {
            const solution: Board|null = searchSolution(current);
            self.postMessage({ type: "solved", solution: solution ? solution.toPuzzleString() : null });
        }
    }
}

