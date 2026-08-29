import { describe, expect, it } from "vitest";
import { normalisePhone, validatePhone } from "./validator.js";

describe("normalisePhone", () => {
	it("strips printed separators", () => {
		expect(normalisePhone("(+34) 999-123 456")).toBe("+34999123456");
	});

	it("converts the 00 prefix to +", () => {
		expect(normalisePhone("0034999123456")).toBe("+34999123456");
	});
});

describe("validatePhone", () => {
	it.each([
		"+12125550100",
		"+442079460000",
		"+34999123456",
		"+34 999 123 456",
		"(+34) 999 123 456",
		"0034999123456",
	])("accepts E.164 form %s", (v) => {
		const r = validatePhone(v);
		expect(r.valid, r.reason).toBe(true);
	});

	it("accepts the national form when the country is known", () => {
		expect(validatePhone("999123456", "es").valid).toBe(true);
	});

	it("rejects the national form when the country is unknown", () => {
		expect(validatePhone("999123456").valid).toBe(false);
	});

	it("rejects a national number of the wrong length", () => {
		const r = validatePhone("99912345", "es");
		expect(r.valid).toBe(false);
		expect(r.reason).toMatch(/digits/i);
	});

	it("rejects a mismatched country code", () => {
		const r = validatePhone("+12125550100", "es");
		expect(r.valid).toBe(false);
		expect(r.reason).toMatch(/country code/i);
	});

	it.each(["", "+", "+0123456789", "abc", "+1234567890123456"])(
		"rejects malformed %s",
		(v) => {
			expect(validatePhone(v).valid).toBe(false);
		},
	);
});
