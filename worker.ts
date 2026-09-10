
import { generatePuzzle } from "./src/generator";
import { searchSolution } from "./src/solver";

self.onmessage = (e) => {
    const { targetClues } = e.data;
    const puzzle = generatePuzzle(targetClues);
    const solution = searchSolution(puzzle);
    self.postMessage({ puzzle: puzzle.toPuzzleString(), solution: solution?.toPuzzleString() });
}

