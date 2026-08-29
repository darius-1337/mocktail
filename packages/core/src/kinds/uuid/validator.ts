import type { ValidationResult } from "../../contracts.js";

const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const UUID_VERSIONS = [1, 2, 3, 4, 5, 6, 7] as const;
export type UuidVersion = (typeof UUID_VERSIONS)[number];

const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export function validateUuid(
	input: string,
	version?: UuidVersion,
): ValidationResult {
	const value = input.trim().toLowerCase();

	if (!SHAPE.test(value)) {
		return { valid: false, reason: "invalid uuid format" };
	}

	if (value === NIL || value === MAX) {
		return version === undefined
			? { valid: true }
			: { valid: false, reason: "nil/max uuid has no version" };
	}

	const actual = Number.parseInt(value[14] ?? "0", 16);
	if (!(UUID_VERSIONS as readonly number[]).includes(actual)) {
		return { valid: false, reason: "unknown uuid version" };
	}

	if (version !== undefined && actual !== version) {
		return {
			valid: false,
			reason: `expected version ${version} but got ${actual}`,
		};
	}

	const variant = Number.parseInt(value[19] ?? "0", 16);

	if (variant < 8 || variant > 11) {
		return { valid: false, reason: "invalid RFC 9562 variant bits" };
	}

	return { valid: true };
}
