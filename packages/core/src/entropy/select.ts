import type { Rng } from '../rng/splitmix64.js';

export interface Weighted {
    readonly rarity: number;
}

export function selectByRarity<T extends Weighted>(rng: Rng, candidates: readonly [T, ...T[]], target: number, spread = 0.25): T {

    const weights = candidates.map((candidate) => Math.exp(-((candidate.rarity - target) ** 2) / (2 * spread ** 2)));

    const total = weights.reduce((a, b) => a + b, 0);

    let threshold = rng.float() * total;

    for (let i = 0; i < candidates.length; i++) {
        threshold -= weights[i] ?? 0;

        if (threshold <= 0) {
            return candidates[i] ?? candidates[0];
        }
    }

    return candidates[candidates.length - 1] ?? candidates[0];
}