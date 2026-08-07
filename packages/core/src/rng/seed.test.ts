import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { seedFrom } from "./seed.js";

describe("seedFrom", () => {
	it("is deterministic", () => {
		fc.assert(
			fc.property(fc.string(), (input) => {
				expect(seedFrom(input)).toBe(seedFrom(input));
			}),
		);
	});

	it("fits in 64 bits", () => {
		fc.assert(
			fc.property(fc.string(), (input) => {
				const value = seedFrom(input);
				expect(value).toBeGreaterThanOrEqual(0n);
				expect(value).toBeLessThanOrEqual(1n << 64n);
			}),
		);
	});

	it("different strings produce different seeds", () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), (a, b) => {
				fc.pre(a !== b);
				expect(seedFrom(a)).not.toBe(seedFrom(b));
			}),
		);
	});
});
