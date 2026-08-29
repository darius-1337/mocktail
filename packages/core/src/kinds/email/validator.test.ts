import { describe, expect, it } from "vitest";
import { validateEmail } from "./validator.js";

describe("validateEmail", () => {
	it.each([
		"simple@example.com",
		"very.common@example.com",
		"x@example.com",
		"long.email-address-with-hyphens@and.subdomains.example.com",
		"user.name+tag+sorting@example.com",
		"name/surname@example.com",
		"admin@example",
		'" "@example.org',
		'"john..doe"@example.org',
		"mailhost!username@example.org",
		"user%example.com@example.org",
		"postmaster@[123.123.123.123]",
		"postmaster@[IPv6:2001:db8::1]",
		"!#$%&'*+-/=?^_`{|}~@example.com",
	])("accepts RFC 5322 valid %s", (value) => {
		const r = validateEmail(value);
		expect(r.valid, r.reason).toBe(true);
	});

	it.each([
		"abc.example.com",
		"a@b@c@example.com",
		'just"not"right@example.com',
		'this is"not\\allowed@example.com',
		"i.like.underscore@but_you_are_not_allowed.example.com",
		"a@-example.com",
		"a@example-.com",
		"a@exam..ple.com",
		".leading@example.com",
		"trailing.@example.com",
		"",
		"@example.com",
		"a@",
	])("rejects invalid %s", (value) => {
		expect(validateEmail(value).valid).toBe(false);
	});

	it("rejects a local part over 64 characters", () => {
		expect(validateEmail(`${"a".repeat(65)}@example.com`).valid).toBe(false);
	});
});
