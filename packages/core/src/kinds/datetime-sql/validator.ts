import type { ValidationResult } from "../../contracts.js";
import { validateParts } from "../datetime/parts.js";

const SHAPE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,6})?$/;

export function validateDatetimeSql(input: string): ValidationResult {
	const match = SHAPE.exec(input.trim());
	if (match === null) {
		return {
			valid: false,
			reason: "expected SQL DATETIME, e.g. 2026-08-15 22:57:00",
		};
	}

	return validateParts(
		Number(match[1]),
		Number(match[2]),
		Number(match[3]),
		Number(match[4]),
		Number(match[5]),
		Number(match[6]),
	);
}
