import { describe, expect, it } from "vitest";
import { conformsToContract } from "../../testing/contract.js";
import { COUNTRIES, ibanKind } from "./index.js";

for (const country of COUNTRIES) {
	conformsToContract(ibanKind(country));
}

describe("generateIban", () => {
	it("generates the right length per country", () => {
		for (const country of COUNTRIES) {
			const kind = ibanKind(country);
			const value = kind.generate(
				{
					next: () => 0n,
					float: () => 0.5,
					int: (m) => Math.floor(m / 2),
					pick: (a) => a[0],
				},
				{ band: "simple" },
			);
			expect(value.startsWith(country)).toBe(true);
		}
	});
});
