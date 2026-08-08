import { describe, expect, it } from 'vitest';
import { conformsToContract } from '../../testing/contract.js';
import { seedFrom } from '../../rng/seed.js';
import { splitmix64 } from '../../rng/splitmix64.js';
import { BRAND_IDS, cardKind } from './index.js';

for(const brand of BRAND_IDS) {
    conformsToContract(cardKind(brand));
}

describe('generateCard: bands', () => {
  const sample = (band: 'simple' | 'hostile', n = 200): string[] =>
    Array.from({ length: n }, (_, i) =>
      cardKind('visa').generate(splitmix64(seedFrom(`c${i}`)), { band }),
    );

    it('simple returns plain digits', () => {
    const formatted = sample('simple').filter((v) => /[\s-]/.test(v));
    expect(formatted.length).toBeLessThan(20);
    });

    it('hostile returns printed formats', () => {
        const formatted = sample('hostile').filter((v) => /[\s-]/.test(v));
        expect(formatted.length).toBeGreaterThan(150);
    });

    it('hostile reaches the 19-digit Visa', () => {
        const long = sample('hostile').filter((v) => v.replaceAll(/[\s-]/g, '').length === 19);
        expect(long.length).toBeGreaterThan(50);
    });

});