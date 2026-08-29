import type { GeneratedOptions, KindParam } from "../../contracts.js";
import { BAND_TARGET } from "../../contracts.js";
import { selectByRarity, type Weighted } from "../../entropy/select.js";
import type { Rng } from "../../rng/splitmix64.js";
import { fromEpochDay, parseDate, toEpochDay } from "../date/validator.js";
import type { Instant } from "./format.js";

// instants construction: range, bands and strategies shared with datetime and datime-sql, this only diferenciate on the result

export const DEFAULT_FROM = "2000-01-01";
export const DEFAULT_TO = "2035-12-31";

const ODD_OFFSETS = [345, 765, 330, -570, 570, 210, -210] as const;

interface Strategy extends Weighted {
	readonly offset: (rng: Rng) => number;
	readonly time: (rng: Rng) => number;
	readonly extreme?: boolean;
}

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
	{ rarity: 0.1, offset: () => 0, time: (r) => r.int(86_400) },
	{
		rarity: 0.4,
		offset: (r) => (r.int(27) - 12) * 60,
		time: (r) => r.int(86_400),
	},
	{
		rarity: 0.65,
		offset: (r) => (r.int(27) - 12) * 60,
		time: (r) => (r.float() < 0.5 ? 0 : 86_399),
	},
	{
		rarity: 0.85,
		offset: (r) => ODD_OFFSETS[r.int(ODD_OFFSETS.length)] ?? 345,
		time: (r) => r.int(86_400),
	},
	{
		rarity: 0.97,
		offset: (r) => r.pick([840, -720, 345]),
		time: () => 0,
		extreme: true,
	},
];

const EPOCH_DAY = 0;
const Y2038_DAY = 24_855;
const MAX_DAY = 2_932_896;

const clamp = (v: number, lo: number, hi: number): number =>
	Math.min(Math.max(v, lo), hi);

export function buildInstant(rng: Rng, opts: GeneratedOptions): Instant {
	const fromParam = parseDate(opts.params?.from ?? DEFAULT_FROM);
	const toParam = parseDate(opts.params?.to ?? DEFAULT_TO);

	const low =
		fromParam === null ? toEpochDay(2000, 1, 1) : toEpochDay(...fromParam);
	const high =
		toParam === null ? toEpochDay(2035, 12, 31) : toEpochDay(...toParam);
	const [lo, hi] = low <= high ? [low, high] : [high, low];

	const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);

	const epochDay =
		strategy.extreme === true
			? clamp(rng.pick([lo, hi, EPOCH_DAY, Y2038_DAY, MAX_DAY]), lo, hi)
			: lo + rng.int(hi - lo + 1);

	const [year, month, day] = fromEpochDay(epochDay);
	const secondsOfDay = strategy.time(rng);

	return {
		year,
		month,
		day,
		hour: Math.floor(secondsOfDay / 3600),
		minute: Math.floor((secondsOfDay % 3600) / 60),
		second: secondsOfDay % 60,
		offsetMinutes: strategy.offset(rng),
	};
}

export const RANGE_PARAMS: readonly KindParam[] = [
	{
		name: "from",
		description: "earliest date, inclusive yyyy-mm-dd",
		default: DEFAULT_FROM,
		maxLength: 10,
		pattern: /^\d{4}-\d{2}-\d{2}$/,
	},
	{
		name: "to",
		description: "latest date, inclusive yyyy-mm-dd",
		default: DEFAULT_TO,
		maxLength: 10,
		pattern: /^\d{4}-\d{2}-\d{2}$/,
	},
];
