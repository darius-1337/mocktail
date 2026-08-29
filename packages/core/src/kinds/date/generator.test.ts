import { describe, expect, it } from "vitest";
import type { Band } from "../../contracts.js";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { generateDate } from "./generator.js";
import { date } from "./index.js";
import { validateDate } from "./validator.js";

conformsToContract(date);

describe("generateDate", () => {
	const gen = (opts: {
		band: Band;
		seed: string;
		params?: Record<string, string>;
	}): string =>
		generateDate(splitmix64(seedFrom(opts.seed)), {
			band: opts.band,
			...(opts.params ? { params: opts.params } : {}),
		});

	it("respects the requested range", () => {
		for (let i = 0; i < 200; i++) {
			const value = gen({
				band: "hostile",
				seed: `s${i}`,
				params: { from: "2020-01-01", to: "2020-12-31" },
			});
			expect(value >= "2020-01-01" && value <= "2020-12-31", value).toBe(true);
		}
	});

	it("produces 29 February when the range allows it", () => {
		const values = Array.from({ length: 200 }, (_, i) =>
			gen({
				band: "limit",
				seed: `l${i}`,
				params: { from: "2020-01-01", to: "2028-12-31" },
			}),
		);
		expect(values.some((v) => v.endsWith("-02-29"))).toBe(true);
	});

	it("never produces an invalid date", () => {
		for (let i = 0; i < 500; i++) {
			const value = gen({ band: "hostile", seed: `x${i}` });
			expect(validateDate(value).valid, value).toBe(true);
		}
	});
});
