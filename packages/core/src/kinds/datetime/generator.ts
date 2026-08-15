import type { GeneratedOptions } from '../../contracts.js';
import { BAND_TARGET } from '../../contracts.js';
import { selectByRarity, type Weighted } from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';
import { fromEpochDay, pad, parseDate, toEpochDay } from '../date/validator.js';

export const DEFAULT_FROM = '2000-01-01';
export const DEFAULT_TO = '2035-12-31';

const ODD_OFFSETS = [345, 765, 330, -570, 570, 210, -210] as const;

function formatOffset(minutes: number): string {
  if (minutes === 0) return 'Z';
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

interface Strategy extends Weighted {
  readonly offset: (rng: Rng) => number;
  readonly time: (rng: Rng) => number;
  readonly extreme?: boolean;
}

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
  { rarity: 0.1, offset: () => 0, time: (r) => r.int(86_400) },

  { rarity: 0.4, offset: (r) => (r.int(27) - 12) * 60, time: (r) => r.int(86_400) },

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

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

export function generateDatetime(rng: Rng, opts: GeneratedOptions): string {
  const fromParam = parseDate(opts.params?.from ?? DEFAULT_FROM);
  const toParam = parseDate(opts.params?.to ?? DEFAULT_TO);

  const low = fromParam === null ? toEpochDay(2000, 1, 1) : toEpochDay(...fromParam);
  const high = toParam === null ? toEpochDay(2035, 12, 31) : toEpochDay(...toParam);
  const [lo, hi] = low <= high ? [low, high] : [high, low];

  const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);

  const epochDay =
    strategy.extreme === true
      ? clamp(rng.pick([lo, hi, EPOCH_DAY, Y2038_DAY, MAX_DAY]), lo, hi)
      : lo + rng.int(hi - lo + 1);

  const [year, month, day] = fromEpochDay(epochDay);

  const secondsOfDay = strategy.time(rng);
  const hour = Math.floor(secondsOfDay / 3600);
  const minute = Math.floor((secondsOfDay % 3600) / 60);
  const second = secondsOfDay % 60;

  const offset = formatOffset(strategy.offset(rng));

  const stamp = `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;

  if (opts.valid === false) {
    return rng.float() < 0.5 ? `${stamp.slice(0, 11)}24:00:00${offset}` : stamp;
  }

  return stamp + offset;
}