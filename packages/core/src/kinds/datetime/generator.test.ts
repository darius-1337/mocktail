import { describe, expect, it } from "vitest";
import type { Band } from "../../contracts.js";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { generateDatetime } from "./generator.js";
import { datetime } from "./index.js";
import { validateDateTime } from "./validator.js";

conformsToContract(datetime);

describe("generateDatetime", () => {
	const gen = (opts: {
		band: Band;
		seed: string;
		params?: Record<string, string>;
	}): string =>
		generateDatetime(splitmix64(seedFrom(opts.seed)), {
			band: opts.band,
			...(opts.params ? { params: opts.params } : {}),
		});

	const sample = (band: Band, n = 200): string[] =>
		Array.from({ length: n }, (_, i) => gen({ band, seed: `dt${i}` }));

	it("never produces an invalid instant", () => {
		for (const value of sample("hostile", 500)) {
			expect(validateDateTime(value).valid, value).toBe(true);
		}
	});

	it("respects the requested range", () => {
		for (let i = 0; i < 200; i++) {
			const value = gen({
				band: "hostile",
				seed: `r${i}`,
				params: { from: "2024-01-01", to: "2024-12-31" },
			});
			expect(value.startsWith("2024-"), value).toBe(true);
		}
	});

	it("simple uses UTC", () => {
		const utc = sample("simple").filter((v) => v.endsWith("Z"));
		expect(utc.length).toBeGreaterThan(150);
	});

	it("hostile produces non-integer offsets", () => {
		const odd = sample("hostile").filter((v) => /[+-]\d{2}:(45|30)$/.test(v));
		expect(odd.length).toBeGreaterThan(30);
	});
});
