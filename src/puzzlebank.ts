
const TIERS = ['easy', 'medium', 'hard', 'diabolical'] as const;
type Tier = typeof TIERS[number];

const cache: Partial<Record<Tier, Uint8Array>> = {};

async function loadTier(tier: Tier): Promise<Uint8Array> {
    if (cache[tier]) return cache[tier]!;
    const buf = await(await fetch(`./${tier}.bin`)).arrayBuffer();
    const bytes = new Uint8Array(buf);
    cache[tier] = bytes;
    return bytes;
}

function unpackPuzzle(bytes: Uint8Array, offset: number): string {
    let out = '';
    for (let i = 0; i < 81; i++) {
        const byte = bytes[offset + (i >> 1)];
        const digit = (i % 2 === 0) ? (byte >> 4) : (byte & 0x0f);
        out += digit === 0 ? '.' : String(digit);
    }
    return out;
}

export async function getRandomPuzzle(tier: Tier): Promise<string> {
    const bytes = await loadTier(tier);
    const count = bytes.length / 41;
    const idx = Math.floor(Math.random() * count);
    return unpackPuzzle(bytes, idx * 41);
}

