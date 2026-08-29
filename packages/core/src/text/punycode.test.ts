import { describe, expect, it } from "vitest";
import { hasPunycode, punycodeToUnicode } from "./punycode.js";

describe("punycodeToUnicode", () => {
	it.each([
		["xn--mnchen-3ya.de", "münchen.de"],
		["xn--bcher-kva.de", "bücher.de"],
		["xn--nxasmm1c.gr", "βόλος.gr"],
		["xn--80ak6aa92e.com", "аррӏе.com"],
		["xn--pple-43d.com", "аpple.com"],
		["example.com", "example.com"],
	])("decodes %s to %s", (input, expected) => {
		expect(punycodeToUnicode(input)).toBe(expected);
	});

	it("decodes every punycode label, including the TLD", () => {
		expect(punycodeToUnicode("xn--80ak6aa92e.xn--p1ai")).toBe("аррӏе.рф");
	});

	it.each([
		["xn--mnchen-3ya.de", true],
		["example.com", false],
	])("hasPunycode(%s) is %s", (input, expected) => {
		expect(hasPunycode(input)).toBe(expected);
	});
});
