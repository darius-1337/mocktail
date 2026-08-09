import type { GeneratedOptions } from "../../contracts";
import { BAND_TARGET } from "../../contracts";
import { selectByRarity, type Weighted } from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';

const CYRILLIC: Record<string, string> = {
  a: '\u0430', b: '\u042C', c: '\u0441', d: '\u0501', e: '\u0435',
  h: '\u04BB', i: '\u0456', j: '\u0458', k: '\u043A', l: '\u04CF',
  m: '\u043C', o: '\u043E', p: '\u0440', q: '\u051B', s: '\u0455',
  t: '\u0442', x: '\u0445', y: '\u0443',
};

interface Strategy extends Weighted {
    readonly ratio: number;
}

// if all the letters have homograph, the label marks it as 100% cyrillic
const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
    { rarity: 0.05, ratio: 0.15 },
  { rarity: 0.35, ratio: 0.4 },
  { rarity: 0.6, ratio: 0.7 },
  { rarity: 0.85, ratio: 1 },
  { rarity: 0.97, ratio: 1 },
];

export function generateHomograph(rng: Rng, opts: GeneratedOptions): string {
  const target = (opts.params?.target ?? 'example.com').toLowerCase();
  const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);

  const dot = target.indexOf('.');
  const label = dot === -1 ? target : target.slice(0, dot);
  const rest = dot === -1 ? '' : target.slice(dot);

  const chars = [...label];
  const swappable = chars
    .map((c, i) => (CYRILLIC[c] === undefined ? -1 : i))
    .filter((i) => i >= 0);

  if (swappable.length === 0) return target + rest;

  const howMany = Math.max(1, Math.round(swappable.length * strategy.ratio));

  const order = [...swappable];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }

  for (const index of order.slice(0, howMany)) {
    const original = chars[index] ?? '';
    chars[index] = CYRILLIC[original] ?? original;
  }

  if (opts.valid === false) return target;

  return chars.join('') + rest;
}