import type { GeneratedOptions } from "../../contracts.js";
import { BAND_TARGET } from "../../contracts.js";
import { selectByRarity, type Weighted } from "../../entropy/select.js";
import type { Rng } from "../../rng/splitmix64.js";
import {
	daysInMonth,
	formatDate,
	fromEpochDay,
	isLeapYear,
	parseDate,
	toEpochDay,
} from "./validator.js";

export const DEFAULT_FROM = "1950-01-01";
export const DEFAULT_TO = "2035-12-31";

const clamp = (value: number, low: number, high: number): number =>
	Math.min(Math.max(value, low), high);

function snapMonthToEdge(epochDay: number, rng: Rng): number {
	const [year, month] = fromEpochDay(epochDay);
	const day = rng.float() < 0.5 ? 1 : daysInMonth(year, month);

	return toEpochDay(year, month, day);
}

function leapDayWithin(epochDay: number, low: number, high: number): number {
	const [year] = fromEpochDay(epochDay);
	for (let offset = 0; offset < 8; offset++) {
		for (const candidate of [year - offset, year + offset]) {
			if (!isLeapYear(candidate)) continue;
			const leap = toEpochDay(candidate, 2, 29);
			if (leap >= low && leap <= high) return leap;
		}
	}
	return epochDay;
}

interface Strategy extends Weighted {
	readonly build: (rng: Rng, low: number, high: number) => number;
}

const EPOCH = 0;
const Y2038 = 24_855;
const MAX_DATE = 2_932_896;

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
	{ rarity: 0.1, build: (r, lo, hi) => lo + r.int(hi - lo + 1) },
	{
		rarity: 0.45,
		build: (r, lo, hi) => snapMonthToEdge(lo + r.int(hi - lo + 1), r),
	},
	{
		rarity: 0.75,
		build: (r, lo, hi) => leapDayWithin(lo + r.int(hi - lo + 1), lo, hi),
	},
	{
		rarity: 0.95,
		build: (r, lo, hi) =>
			clamp(r.pick([lo, hi, EPOCH, Y2038, MAX_DATE, lo, hi]), lo, hi),
	},
];

export function generateDate(rng: Rng, opts: GeneratedOptions): string {
	const fromParam = parseDate(opts.params?.from ?? DEFAULT_FROM);
	const toParam = parseDate(opts.params?.to ?? DEFAULT_TO);

	const low =
		fromParam === null ? toEpochDay(1950, 1, 1) : toEpochDay(...fromParam);
	const high =
		toParam === null ? toEpochDay(2035, 12, 31) : toEpochDay(...toParam);

	const [lowVal, highVal] = low <= high ? [low, high] : [high, low];

	const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);
	const epochDay = clamp(strategy.build(rng, lowVal, highVal), lowVal, highVal);

	const [year, month, day] = fromEpochDay(epochDay);

	if (opts.valid === false) {
		return rng.float() < 0.5
			? formatDate(year, 2, 30)
			: formatDate(year, 4, 31);
	}

	return formatDate(year, month, day);
}
