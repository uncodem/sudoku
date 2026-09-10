import { Board, POPCOUNT_9BIT } from './board';
import { mostConstrainedCell, sweepSingles } from './solver';

function shuffledDigits(): number[] {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    return digits;
}

function shuffledIndices(): number[] {
    const order = Array.from({ length: 81 }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

/** Recursive backtracking with shuffled candidate order + singles propagation.
 *  Produces a random complete, valid solution grid. */
export function generateFullGrid(): Board {
    function fill(board: Board): Board | null {
        const cell = mostConstrainedCell(board, false);
        if (cell === 'invalid') return null;
        if (cell === null) return board; // complete

        const [idx] = cell;
        const candidates = board.getCandidates(idx);
        const order = shuffledDigits().filter(d => (candidates & (1 << (d - 1))) !== 0);

        for (const digit of order) {
            const next = board.clone();
            const changed = next.setCell(idx, digit);
            if (!changed) continue;

            const swept = sweepSingles(next, changed);
            if (!swept) continue;

            const result = fill(swept);
            if (result) return result;
        }
        return null;
    }

    const solved = fill(new Board());
    if (!solved) throw new Error("generateFullGrid: unexpected failure to fill a grid");
    return solved;
}

/** Same DFS shape as searchSolution, but keeps going until `limit` solutions
 *  are found (or the search is exhausted). Used for the uniqueness check. */
export function countSolutions(board: Board, limit: number): number {
    const stack: [Board, number[] | undefined][] = [[board.clone(), undefined]];
    let found = 0;

    while (stack.length > 0 && found < limit) {
        const [current, seed] = stack.pop()!;
        const sweeped = sweepSingles(current, seed);
        if (!sweeped) continue;
        if (sweeped.complete()) { found++; continue; }

        const cell = mostConstrainedCell(sweeped, false);
        if (cell === 'invalid') continue;
        if (cell === null) { found++; continue; } // defensive

        const [idx] = cell;
        let candidates = sweeped.getCandidates(idx);
        let digit = 1;
        while (candidates !== 0) {
            if ((candidates & 1) === 1) {
                const next = sweeped.clone();
                const changed = next.setCell(idx, digit);
                stack.push([next, changed ?? undefined]);
            }
            digit++;
            candidates >>= 1;
        }
    }
    return found;
}

/** Generates a puzzle with (approximately) targetClues filled cells,
 *  guaranteed to have exactly one solution. */
export function generatePuzzle(targetClues: number): Board {
    const solved = generateFullGrid();
    const cells = Array.from({ length: 81 }, (_, i) => solved.getCell(i));

    let clueCount = 81;
    for (const idx of shuffledIndices()) {
        if (clueCount <= targetClues) break;

        const backup = cells[idx];
        cells[idx] = 0;

        const testBoard = new Board(cells);
        const solutions = countSolutions(testBoard, 2); // stop as soon as a 2nd solution appears

        if (solutions !== 1) {
            cells[idx] = backup; // removing this cell broke uniqueness
        } else {
            clueCount--;
        }
    }

    return new Board(cells);
}
