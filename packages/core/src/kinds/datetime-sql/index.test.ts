import { describe, expect, it } from "vitest";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { datetimeSql } from "./index.js";

conformsToContract(datetimeSql);

describe("datetime-sql", () => {
	const sample = (n = 200): string[] =>
		Array.from({ length: n }, (_, i) =>
			datetimeSql.generate(splitmix64(seedFrom(`s${i}`)), { band: "hostile" }),
		);

	it("never emits a timezone marker", () => {
		for (const value of sample()) {
			expect(/[TZ]|[+-]\d{2}:\d{2}$/.test(value), value).toBe(false);
		}
	});

	it("uses a space separator", () => {
		for (const value of sample(50)) {
			expect(value.charAt(10)).toBe(" ");
		}
	});

	it("respects the requested range", () => {
		for (let i = 0; i < 100; i++) {
			const value = datetimeSql.generate(splitmix64(seedFrom(`r${i}`)), {
				band: "hostile",
				params: { from: "2024-01-01", to: "2024-12-31" },
			});
			expect(value.startsWith("2024-"), value).toBe(true);
		}
	});
});
