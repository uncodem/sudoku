
const ALL_CANDIDATES = 0x1ff;

function popcount(n: number): number {
    let count = 0;
    while (n) { n &= n - 1; count++; }
    return count;
}

function lowestSet(n: number): number {
    return n & -n;
}

function bitToDigit(bit: number): number {
    return Math.log2(bit) + 1;
}

