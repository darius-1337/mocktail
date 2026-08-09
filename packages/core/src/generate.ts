import { BANDS, type Band, type Kind } from "./contracts.js";
import { registry } from "./registry.js";
import { seedFrom } from "./rng/seed.js";
import { splitmix64 } from "./rng/splitmix64.js";

export const MAX_SEED_LENGTH = 256;
export const MAX_PARAM_LENGTH = 253;

export interface GenerateRequest {
	readonly kind: string;
	readonly seed: string;
	readonly band?: Band;
	readonly valid?: boolean;
	readonly count?: number;
	readonly params?: Readonly<Record<string, string>>;
}

export interface GenerateResult {
	readonly kind: string;
	readonly label: string;
	readonly seed: string;
	readonly band: Band;
	readonly valid: boolean;
	readonly count: number;
	 readonly params: Readonly<Record<string, string>>;
	readonly data: readonly string[];
}

export class UnknownKindError extends Error {
	constructor(readonly kind: string) {
		super(`Unknown kind: ${kind}`);
	}
}

export class InvalidSeedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidSeedError';
	}
}

export class InvalidParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamError';
  }
}

export function generate(req: GenerateRequest): GenerateResult {

	const kind = registry.get(req.kind);
	if (kind === undefined) throw new UnknownKindError(req.kind);

	if(req.seed.length > MAX_SEED_LENGTH) {
		throw new InvalidSeedError(`the seed cannot exceed ${MAX_SEED_LENGTH} characters`);
	}

	const band = req.band ?? "realistic";
	const valid = req.valid ?? true;
	const count = Math.min(Math.max(req.count ?? 1, 1), 1000);
	const params = resolveParams(kind, req.params ?? {});

	const rng = splitmix64(seedFrom(req.seed));
	const data = Array.from({ length: count }, () =>
		kind.generate(rng, { band, valid, params }),
	);

	return {
		kind: kind.id,
		label: kind.label,
		seed: req.seed,
		band,
		valid,
		count,
		params,
		data,
	};
}

export function isBand(value: string): value is Band {
	return (BANDS as readonly string[]).includes(value);
}

export function randomSeed(): string {
	return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}

function resolveParams(
  kind: Kind,
  given: Readonly<Record<string, string>>,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const spec of kind.params ?? []) {
    const value = given[spec.name] ?? spec.default;

    if (value === undefined) {
      throw new InvalidParamError(`missing required parameter: ${spec.name}`);
    }
    if (value.length > (spec.maxLength ?? MAX_PARAM_LENGTH)) {
      throw new InvalidParamError(
        `${spec.name} exceeds ${spec.maxLength ?? MAX_PARAM_LENGTH} characters`,
      );
    }
    if (spec.pattern !== undefined && !spec.pattern.test(value)) {
      throw new InvalidParamError(`${spec.name} has an invalid format`);
    }
    resolved[spec.name] = value;
  }

  return resolved;
}