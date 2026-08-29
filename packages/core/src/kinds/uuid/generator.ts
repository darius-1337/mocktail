import type { GeneratedOptions } from "../../contracts.js";
import { BAND_TARGET } from "../../contracts.js";
import { selectByRarity, type Weighted } from "../../entropy/select.js";
import type { Rng } from "../../rng/splitmix64.js";
import type { UuidVersion } from "./validator.js";

const hex2 = (num: number): string => num.toString(16).padStart(2, "0");

const format = (bytes: readonly number[]): string => {
	const h = bytes.map(hex2).join("");

	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

function stamp(bytes: number[], version: number): number[] {
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | (version << 4);
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

	return bytes;
}

const randomBytes = (rng: Rng, num: number): number[] =>
	Array.from({ length: num }, () => rng.int(256));

function buildV7(rng: Rng, ms: number): string {
	const bytes = new Array<number>(16);
	const time = BigInt(Math.floor(ms));

	for (let i = 0; i < 6; i++) {
		bytes[i] = Number((time >> BigInt(8 * (5 - i))) & 0xffn);
	}

	for (let i = 6; i < 16; i++) bytes[i] = rng.int(256);

	return format(stamp(bytes, 7));
}

interface Strategy extends Weighted {
	readonly build: (rng: Rng, version: UuidVersion) => string;
}

const EPOCH_2024 = 1_704_067_200_000;

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
	{
		rarity: 0.1,
		build: (r, v) =>
			v === 7
				? buildV7(r, EPOCH_2024 + r.int(60_000_000))
				: format(stamp(randomBytes(r, 16), v)),
	},

	{
		rarity: 0.55,
		build: (r, v) =>
			(v === 7
				? buildV7(r, EPOCH_2024 + r.int(60_000_000))
				: format(stamp(randomBytes(r, 16), v))
			).toUpperCase(),
	},

	{
		rarity: 0.8,
		build: (r, v) => {
			const fill = r.float() < 0.5 ? 0x00 : 0xff;
			return format(stamp(new Array(16).fill(fill), v));
		},
	},

	{
		rarity: 0.97,
		build: (r, v) =>
			v === 7
				? buildV7(r, r.float() < 0.5 ? 0 : 281_474_976_710_655)
				: format(
						stamp(new Array(16).fill(r.float() < 0.5 ? 0x00 : 0xff), v),
					).toUpperCase(),
	},
];

export function generateUuid(
	version: UuidVersion,
	rng: Rng,
	opts: GeneratedOptions,
): string {
	const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);
	const value = strategy.build(rng, version);

	if (opts.valid === false) {
		return `${value.slice(0, 19)}0${value.slice(20)}`;
	}

	return value;
}
