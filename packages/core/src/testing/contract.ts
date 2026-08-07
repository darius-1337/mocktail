import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BANDS, type Kind } from "../contracts.js";
import { seedFrom } from "../rng/seed.js";
import { splitmix64 } from "../rng/splitmix64.js";

const rngFor = (seed: string) => splitmix64(seedFrom(seed));

export function conformsToContract(kind: Kind): void {
	describe(`contract: ${kind.id}`, () => {
		it("all generated values are accepted by the validator", () => {
			fc.assert(
				fc.property(fc.string(), fc.constantFrom(...BANDS), (seed, band) => {
					const value = kind.generate(rngFor(seed), { band });
					const result = kind.validate(value);
					expect(result.valid, `"${value}" rechazado: ${result.reason}`).toBe(
						true,
					);
				}),
				{ numRuns: 2000 },
			);
		});

		it("is deterministic", () => {
			fc.assert(
				fc.property(fc.string(), fc.constantFrom(...BANDS), (seed, band) => {
					const a = kind.generate(rngFor(seed), { band });
					const b = kind.generate(rngFor(seed), { band });
					expect(a).toBe(b);
				}),
			);
		});

		it("with valid:false produces values that the validator rejects", () => {
			fc.assert(
				fc.property(fc.string(), fc.constantFrom(...BANDS), (seed, band) => {
					const value = kind.generate(rngFor(seed), { band, valid: false });
					expect(
						kind.validate(value).valid,
						`"${value}" should be invalid`,
					).toBe(false);
				}),
				{ numRuns: 2000 },
			);
		});

		it('the band actually influences the output', () => {
  		const seeds = Array.from({ length: 200 }, (_, i) => `band-probe-${i}`);

  		const differing = seeds.filter(
    		(seed) =>
      			kind.generate(rngFor(seed), { band: 'simple' }) !==
      			kind.generate(rngFor(seed), { band: 'hostile' }),
  			).length;

  expect(differing / seeds.length).toBeGreaterThan(0.5);
});
	});
}
