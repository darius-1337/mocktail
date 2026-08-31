import type { Band, Kind } from "@mocktail/core";

export const API_BASE = "https://mocktail.darius1337.workers.dev";

export interface CurlInput {
	readonly kind: Kind;
	readonly seed: string;
	readonly band: Band;
	readonly count: number;
	readonly valid: boolean;
	readonly params: Readonly<Record<string, string>>;
}

export function curlFor(input: CurlInput): string {
	const query = new URLSearchParams();
	query.set("band", input.band);
	query.set("count", String(input.count));
	if (!input.valid) query.set("valid", "false");

	for (const spec of input.kind.params ?? []) {
		const value = input.params[spec.name];
		if (value !== undefined && value !== "" && value !== spec.default) {
			query.set(spec.name, value);
		}
	}

	const seed = encodeURIComponent(input.seed);
	return `curl "${API_BASE}/v1/gen/${input.kind.id}/${seed}?${query.toString()}"`;
}
