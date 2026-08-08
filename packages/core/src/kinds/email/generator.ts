import type { GeneratedOptions } from '../../contracts.js';
import { BAND_TARGET } from '../../contracts.js';
import { selectByRarity, type Weighted } from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';

const FIRST = ['ana', 'luis', 'maria', 'john', 'sara', 'omar', 'lena', 'raul'] as const;
const LAST = ['garcia', 'smith', 'nowak', 'silva', 'chen', 'okafor', 'rossi'] as const;
const DOMAIN = ['example.com', 'example.org', 'test.example', 'mail.example.net'] as const;

const ODD_TLD = ['museum', 'travel', 'international', 'example'] as const;

const SPECIALS = "!#$%&'*+-/=?^_`{|}~";

interface Strategy extends Weighted {
  readonly build: (rng: Rng) => string;
}

const pickFrom = <T>(rng: Rng, xs: readonly T[]): T => xs[rng.int(xs.length)] as T;

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
    // common and expected values
  {
    rarity: 0.05,
    build: (r) => `${pickFrom(r, FIRST)}.${pickFrom(r, LAST)}@${pickFrom(r, DOMAIN)}`,
  },
  {
    rarity: 0.35,
    build: (r) =>
      `${pickFrom(r, FIRST)}+${pickFrom(r, LAST)}${r.int(100)}@sub.${pickFrom(r, DOMAIN)}`,
  },
  // 1 char local part, long or special chars without " "
  {
    rarity: 0.6,
    build: (r) => {
      const local = r.float() < 0.5
        ? String.fromCharCode(97 + r.int(26))
        : `${pickFrom(r, FIRST)}${SPECIALS[r.int(SPECIALS.length)]}${pickFrom(r, LAST)}`;
      return `${local}@${pickFrom(r, FIRST)}.${pickFrom(r, ODD_TLD)}`;
    },
  },
  // literal ips
  {
    rarity: 0.85,
    build: (r) =>
      r.float() < 0.5
        ? `${pickFrom(r, FIRST)}@[${r.int(256)}.${r.int(256)}.${r.int(256)}.${r.int(256)}]`
        : `${pickFrom(r, FIRST)}@[IPv6:2001:db8::${r.int(65536).toString(16)}]`,
  },
  // local with quotes, spaces, colon or containing @
  {
    rarity: 0.97,
    build: (r) =>
      pickFrom(r, [
        `"${pickFrom(r, FIRST)}..${pickFrom(r, LAST)}"@${pickFrom(r, DOMAIN)}`,
        `" "@${pickFrom(r, DOMAIN)}`,
        `"${pickFrom(r, FIRST)}@${pickFrom(r, LAST)}"@${pickFrom(r, DOMAIN)}`,
        `"very.(),:;<>[]\\".unusual"@${pickFrom(r, DOMAIN)}`,
        `${SPECIALS}@${pickFrom(r, DOMAIN)}`,
      ]),
  },
];

export function generateEmail(rng: Rng, opts: GeneratedOptions): string {
  const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);
  const email = strategy.build(rng);

  if (opts.valid === false) {
    return pickFrom(rng, [
      `${email}..`,
      `.${email}`,
      `${email}-`,
      `${email}@`,
    ]);
  }

  return email;
}