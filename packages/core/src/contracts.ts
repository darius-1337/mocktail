import type { Rng } from "./rng/splitmix64.js";

export const BANDS = ["simple", "realistic", "limit", "hostile"] as const;
export type Band = (typeof BANDS)[number];

export const BAND_TARGET: Record<Band, number> = {
	simple: 0.1,
	realistic: 0.4,
	limit: 0.7,
	hostile: 0.95,
};

export interface GeneratedOptions {
	readonly band: Band;
	readonly valid?: boolean;
}

export interface ValidationResult {
	readonly valid: boolean;
	readonly reason?: string;
}

export interface Kind {
	readonly id: string;
	readonly label: string;
	generate(rng: Rng, options: GeneratedOptions): string;
	validate(value: string): ValidationResult;
}
