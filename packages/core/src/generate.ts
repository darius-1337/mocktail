import { BANDS, type Band } from "./contracts.js";
import { registry } from "./registry.js";
import { seedFrom } from "./rng/seed.js";
import { splitmix64 } from "./rng/splitmix64.js";

export interface GenerateRequest {
	readonly kind: string;
	readonly seed: string;
	readonly band?: Band;
	readonly valid?: boolean;
	readonly count?: number;
}

export interface GenerateResult {
	readonly kind: string;
	readonly label: string;
	readonly seed: string;
	readonly band: Band;
	readonly valid: boolean;
	readonly count: number;
	readonly data: readonly string[];
}

export class UnknownKindError extends Error {
	constructor(readonly kind: string) {
		super(`Unknown kind: ${kind}`);
	}
}

export function generate(req: GenerateRequest): GenerateResult {
	const kind = registry.get(req.kind);
	if (kind === undefined) throw new UnknownKindError(req.kind);

	const band = req.band ?? "realistic";
	const valid = req.valid ?? true;
	const count = Math.min(Math.max(req.count ?? 1, 1), 1000);

	const rng = splitmix64(seedFrom(req.seed));
	const data = Array.from({ length: count }, () =>
		kind.generate(rng, { band, valid }),
	);

	return {
		kind: kind.id,
		label: kind.label,
		seed: req.seed,
		band,
		valid,
		count,
		data,
	};
}

export function isBand(value: string): value is Band {
	return (BANDS as readonly string[]).includes(value);
}

export function randomSeed(): string {
	return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}
