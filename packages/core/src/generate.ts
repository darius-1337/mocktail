import { string } from "fast-check";
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

export interface ParamProblem {
	readonly parameter: string;
	readonly reason: 'missing' | 'too_long' | 'invalid_format';
	readonly received?: string;
	readonly expected?: string;
	readonly example?: string;
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
  constructor(readonly problem: ParamProblem) {
    super(`invalid parameter "${problem.parameter}": ${problem.reason}`);
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
      throw new InvalidParamError({
        parameter: spec.name,
        reason: 'missing',
        expected: spec.description,
      });
    }

    const maxLength = spec.maxLength ?? MAX_PARAM_LENGTH;
    if (value.length > maxLength) {
      throw new InvalidParamError({
        parameter: spec.name,
        reason: 'too_long',
        received: `${value.length} characters`,
        expected: `at most ${maxLength}`,
      });
    }

    if (spec.pattern !== undefined && !spec.pattern.test(value)) {
      throw new InvalidParamError({
        parameter: spec.name,
        reason: 'invalid_format',
        received: value,
        expected: spec.pattern.source,
        ...(spec.default !== undefined ? { example: spec.default } : {}),
      });
    }

    resolved[spec.name] = value;
  }

  return resolved;
}