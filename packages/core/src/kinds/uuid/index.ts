import type { Kind } from "../../contracts.js";
import { generateUuid } from "./generator.js";
import { type UuidVersion, validateUuid } from "./validator.js";

const SUPPORTED: readonly UuidVersion[] = [4, 7];

export function uuidKind(version: UuidVersion): Kind {
	return {
		id: `uuid-v${version}`,
		label: `UUID v${version}`,
		description:
			version === 7
				? "RFC 9562 UUID v7: 48-bit millisecond timestamp prefix, so values sort lexicographically by creation time. High bands use extreme timestamps and uppercase hex."
				: "RFC 9562 UUID v4: random, with version and variant bits set. High bands produce all-zero or all-F values and uppercase hex, which break comparisons that do not normalise case.",
		generate: (rng, opts) => generateUuid(version, rng, opts),
		validate: (value) => validateUuid(value, version),
	};
}

export const uuidKinds: readonly Kind[] = SUPPORTED.map(uuidKind);

export { generateUuid, type UuidVersion, validateUuid };
