const MASK = 0xFFFFFFFFFFFFFFFFn;
const GAMMA = 0x9E3779B97F4A7C15n;

export function mix64(z: bigint): bigint {
    z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n & MASK;
    z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn & MASK;
    return z ^ (z >> 31n) & MASK;
}

export interface Rng {
    next(): bigint;
    float(): number;
    int(maxExclusive: number): number;
    pick<T>(items: readonly [T, ...T[]]): T;
}

export function splitmix64(seed: bigint): Rng {
    let x = seed & MASK;

    const next = (): bigint => {
        x = (x + GAMMA) & MASK;
        return mix64(x);
    };

    const float = (): number => Number(next() >> 11n) / 2 **53;

    const int = (maxExclusive: number): number => Math.floor(float() * maxExclusive);

    const pick = <T>(items: readonly [T, ...T[]]): T => items[int(items.length)] ?? items[0];

    return { next, float, int, pick };
}