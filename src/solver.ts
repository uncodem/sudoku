import { Board, PEERS, POPCOUNT_9BIT } from './board';

/** Scans for the empty cell with fewest candidates. If findSingle, returns
 *  as soon as any naked single (1 candidate) is found instead of scanning further. */
export function mostConstrainedCell(
    board: Board,
    findSingle = false
): 'invalid' | null | [number, number] {
    let ret: number | null = null;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
        if (board.getCell(i) === 0) {
            const count = POPCOUNT_9BIT[board.getCandidates(i)];
            if (count === 0) return 'invalid';

            if (findSingle && count === 1) {
                return [i, 1];
            } else if (count < bestCount) {
                ret = i;
                bestCount = count;
            }
        }
    }

    if (ret === null) return null;
    return [ret, bestCount];
}

/** Constraint-propagation pass: repeatedly fills any cell with exactly one
 *  remaining candidate, cascading through peers. Returns null on contradiction. */
export function sweepSingles(board: Board, seed?: number[]): Board | null {
    const queue: number[] = [];

    if (seed) {
        for (const idx of seed) {
            if (board.getCell(idx) !== 0) continue;
            if (POPCOUNT_9BIT[board.getCandidates(idx)] === 1) queue.push(idx);
        }
    } else {
        for (let i = 0; i < 81; i++) {
            if (board.getCell(i) === 0 && POPCOUNT_9BIT[board.getCandidates(i)] === 1) {
                queue.push(i);
            }
        }
    }

    while (queue.length > 0) {
        const idx = queue.shift()!;
        if (board.getCell(idx) !== 0) continue;

        const mask = board.getCandidates(idx);
        if (mask === 0) continue;

        const digit = 32 - Math.clz32(mask); // single-bit mask -> its digit
        const changed = board.setCell(idx, digit);
        if (!changed) continue;

        for (const p of changed) {
            const count = POPCOUNT_9BIT[board.getCandidates(p)];
            if (count === 0) return null; // contradiction
            if (count === 1) queue.push(p);
        }
    }

    return board;
}

/** Stack-based DFS. Returns the first solved Board found, or null if unsolvable. */
export function searchSolution(board: Board): Board | null {
    const stack: [Board, number[] | undefined][] = [[board.clone(), undefined]];
    let nodes = 0;
    let dups = 1;

    while (stack.length > 0) {
        nodes++;
        const [current, seed] = stack.pop()!;
        const sweeped = sweepSingles(current, seed);

        if (!sweeped) continue;
        if (sweeped.complete()) return sweeped;

        const result = pushPossibles(stack, sweeped, dups);
        if (result === 'invalid') continue;
        if (result instanceof Board) return result;
        dups = result;
    }

    console.debug(`nodes: ${nodes}, dups: ${dups}`);
    return null;
}

function pushPossibles(
    stack: [Board, number[] | undefined][],
    board: Board,
    dups: number
): Board | number | 'invalid' {
    const cell = mostConstrainedCell(board, false);
    if (cell === 'invalid') return 'invalid';
    if (cell === null) return board; // defensive: no empty cells left

    const [idx] = cell;
    let candidates = board.getCandidates(idx);
    let digit = 1;

    while (candidates !== 0) {
        if ((candidates & 1) === 1) {
            const nBoard = board.clone();
            dups++;
            const changed = nBoard.setCell(idx, digit);
            stack.push([nBoard, changed ?? undefined]);
        }
        digit++;
        candidates >>= 1;
    }
    return dups;
}
