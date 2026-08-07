import { mix64 } from "./splitmix64";

const MASK = 0xffffffffffffffffn;
const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;

export function seedFrom(input: string): bigint {
	let hash = FNV_OFFSET;

	for (let i = 0; i < input.length; i++) {
		hash ^= BigInt(input.charCodeAt(i));
		hash = (hash * FNV_PRIME) & MASK;
	}

	return mix64(hash);
}
