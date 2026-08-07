import { describe, expect, it } from "vitest";
import type { Band } from "../../contracts.js";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { esDni, generateDni } from "./index.js";

conformsToContract(esDni);

describe("generateDni: bands", () => {
	const sample = (band: "simple" | "hostile", n = 300): string[] =>
		Array.from({ length: n }, (_, i) =>
			generateDni(splitmix64(seedFrom(`s${i}`)), { band }),
		);

	it("simple almost never generates NIE", () => {
		const nies = sample("simple").filter((v) => /^[XYZ]/.test(v));
		expect(nies.length).toBeLessThan(30);
	});

	it("hostile produces NIE frequently", () => {
		const nies = sample("hostile").filter((v) => /^[XYZ]/.test(v));
		expect(nies.length).toBeGreaterThan(150);
	});

	it("hostile produces zeros to the left or weird prefixes", () => {
		const raros = sample("hostile").filter(
			(v) => /^0/.test(v) || /^[YZ]/.test(v),
		);
		expect(raros.length).toBeGreaterThan(50);
	});
});
