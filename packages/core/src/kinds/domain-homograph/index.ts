import type { Kind, ValidationResult } from "../../contracts.js";
import { detectConfusable } from "../../text/confusables.js";
import { generateHomograph } from "./generator.js";

const DOMAIN_SHAPE = /^[^\s.]+(\.[^\s.]+)+$/u;

export function validateHomograph(input: string): ValidationResult {
	const value = input.trim().toLowerCase();

	if (!DOMAIN_SHAPE.test(value)) {
		return { valid: false, reason: "not a well-formed domain" };
	}

	const report = detectConfusable(value);
	if (!report.suspicious) {
		return { valid: false, reason: "no homograph indicators found" };
	}

	return { valid: true };
}

export const domainHomograph: Kind = {
	id: "domain-homograph",
	label: "Homograph attack domain",
	description:
		"A visually identical copy of a target domain built from Cyrillic look-alike characters. Use it to test anti-phishing detection. Low bands swap a single character, which mixes scripts inside one label and is easy to catch. High bands swap every character that has a look-alike; when the whole label converts, it no longer mixes scripts within the label and evades naive per-label detection.",
	params: [
		{
			name: "target",
			description: "Domain to spoof, for example yourcompany.com",
			default: "example.com",
			maxLength: 253,
			pattern:
				/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i,
		},
	],
	generate: generateHomograph,
	validate: validateHomograph,
};

export { generateHomograph };
