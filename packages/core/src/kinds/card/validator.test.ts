import { describe, expect, it } from "vitest";
import { luhnAlg, validateCard } from "./validator";

describe("validateCard", () => {
	it.each([
		"4111111111111111",
		"4242424242424242",
		"5555555555554444",
		"5105105105105100",
		"2223003122003222",
		"378282246310005",
		"371449635398431",
		"6011111111111117",
		"3566002020360505",
		"3056930009020004",
	])("accepts publised test card %s", (pan) => {
		const r = validateCard(pan);
		expect(r.valid, r.reason).toBe(true);
	});

	it.each([
		"4242 4242 4242 4242",
		"4242-4242-4242-4242",
		"  4242424242424242  ",
		"3782 822463 10005",
	])("accepts printed format %s", (pan) => {
		expect(validateCard(pan).valid).toBe(true);
	});

	it("rejects a broken checksum", () => {
		const r = validateCard("4242424242424243");
		expect(r.valid).toBe(false);
		expect(r.reason).toMatch(/luhn/i);
	});

	it.each(["", "424242424242424a", "41111", "41111111111111111111"])(
		"rejects malformed %s",
		(pan) => {
			expect(validateCard(pan).valid).toBe(false);
		},
	);

	it("luhn is position sensitive", () => {
		expect(luhnAlg("4242424242424242")).toBe(true);
		expect(luhnAlg("2424242424242424")).toBe(false);
	});
});
