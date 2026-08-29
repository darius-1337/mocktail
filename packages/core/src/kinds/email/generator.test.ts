import { describe, expect, it } from "vitest";
import { seedFrom } from "../../rng/seed.js";
import { splitmix64 } from "../../rng/splitmix64.js";
import { conformsToContract } from "../../testing/contract.js";
import { generateEmail } from "./generator.js";
import { email } from "./index.js";

conformsToContract(email);

describe("generateEmail: bands", () => {
	const sample = (band: "simple" | "hostile", n = 200): string[] =>
		Array.from({ length: n }, (_, i) =>
			generateEmail(splitmix64(seedFrom(`e${i}`)), { band }),
		);

	it("simple produces ordinary addresses", () => {
		const weird = sample("simple").filter((v) => /["[\]]/.test(v));
		expect(weird.length).toBeLessThan(20);
	});

	it("hostile produces quoted local parts or IP literals", () => {
		const weird = sample("hostile").filter((v) => /^"|@\[/.test(v));
		expect(weird.length).toBeGreaterThan(150);
	});

	it("hostile reaches quoted local parts specifically", () => {
		const quoted = sample("hostile").filter((v) => v.startsWith('"'));
		expect(quoted.length).toBeGreaterThan(30);
	});
});
