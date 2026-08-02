import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { splitmix64 } from './splitmix64.js';

describe('splitmix64', () => {
    it('generate canon vectors with seed 0', () => { 
        const rng = splitmix64(0n);

        expect(rng.next()).toBe(0xe220a8397b1dcdafn);
        expect(rng.next()).toBe(0x6e789e6aa1b965f4n);
        expect(rng.next()).toBe(0x06c45d188009454fn);
        
    });

    it('deterministic, same seed same sequence', () => {
        fc.assert(fc.property(fc.bigInt(), (seed) => {
            const a = splitmix64(seed);
            const b = splitmix64(seed);

            for (let i = 0; i < 20; i++) {
                expect(a.next()).toBe(b.next());
            }
        }));
    });

    it('float lands on [0, 1)', () => {
        const rng = splitmix64(42n);

        for (let i = 0; i < 10_000; i++) {
            const value = rng.float();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it('int respects range', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 1000 }), (max) => {

            const rng = splitmix64(7n);

            for (let i = 0; i < 100; i++) {
                const value = rng.int(max);
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThan(max);
            }
        }));
    });
});