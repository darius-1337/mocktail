import { describe, expect, it } from "vitest";
import type { Band } from "../../contracts.js";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { generatePhone } from "./generator.js";
import { PHONE_COUNTRY_IDS, phoneKind } from "./index.js";
import { normalisePhone } from "./validator.js";

for (const country of PHONE_COUNTRY_IDS) {
	conformsToContract(phoneKind(country));
}

describe("generatePhone", () => {
	const sample = (country: "us" | "gb" | "es", band: Band, n = 300): string[] =>
		Array.from({ length: n }, (_, i) =>
			generatePhone(country, splitmix64(seedFrom(`p${i}`)), { band }),
		);

	it("US numbers stay inside the NANPA fictitious range", () => {
		for (const value of sample("us", "hostile")) {
			const digits = normalisePhone(value).replace(/^\+1/, "");
			const line = Number(digits.slice(6));
			expect(digits.slice(3, 6), value).toBe("555");
			expect(line >= 100 && line <= 199, value).toBe(true);
		}
	});

	/** Ofcom reserva estos bloques para drama. */
	it("UK numbers stay inside the Ofcom drama blocks", () => {
		for (const value of sample("gb", "hostile")) {
			const digits = normalisePhone(value).replace(/^\+44/, "");
			expect(/^(2079460|7700900)\d{3}$/.test(digits), value).toBe(true);
		}
	});

	it("Spanish numbers stay inside the unallocated 99 range", () => {
		for (const value of sample("es", "hostile")) {
			const digits = normalisePhone(value).replace(/^\+34/, "");
			expect(digits.startsWith("99"), value).toBe(true);
		}
	});

	it("simple returns plain E.164", () => {
		const plain = sample("es", "simple").filter((v) => /^\+34\d{9}$/.test(v));
		expect(plain.length).toBeGreaterThan(200);
	});

	it("hostile returns printed or national forms", () => {
		const odd = sample("es", "hostile").filter((v) => !/^\+34\d{9}$/.test(v));
		expect(odd.length).toBeGreaterThan(200);
	});

	it("format=national pins the national form regardless of band", () => {
		for (const band of ["simple", "hostile"] as const) {
			const value = generatePhone("es", splitmix64(seedFrom("x")), {
				band,
				params: { format: "national" },
			});
			expect(value).toMatch(/^\d{9}$/);
		}
	});

	it("format=e164 pins the international form regardless of band", () => {
		const value = generatePhone("es", splitmix64(seedFrom("x")), {
			band: "hostile",
			params: { format: "e164" },
		});
		expect(value).toMatch(/^\+34\d{9}$/);
	});
});
