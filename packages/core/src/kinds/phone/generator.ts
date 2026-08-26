import type { GeneratedOptions } from '../../contracts.js';
import { BAND_TARGET } from '../../contracts.js';
import { selectByRarity, type Weighted } from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';
import { PHONE_COUNTRIES, type PhoneCountry } from './validator.js';

const pad = (n: number, len: number): string => String(n).padStart(len, '0');

const NSN_BUILDERS: Record<PhoneCountry, (rng: Rng) => string> = {
  us: (r) => `${200 + r.int(600)}555${pad(100 + r.int(100), 4)}`,

  gb: (r) =>
    r.float() < 0.5
      ? `2079460${pad(r.int(1000), 3)}`
      : `7700900${pad(r.int(1000), 3)}`,

  es: (r) => `99${pad(r.int(10_000_000), 7)}`,
};

type Formatter = (code: string, nsn: string) => string;

const e164: Formatter = (code, nsn) => `+${code}${nsn}`;

const spaced: Formatter = (code, nsn) =>
  `+${code} ${(nsn.match(/.{1,3}/g) ?? [nsn]).join(' ')}`;

const dashed: Formatter = (code, nsn) =>
  `+${code}-${(nsn.match(/.{1,3}/g) ?? [nsn]).join('-')}`;

const parenthesised: Formatter = (code, nsn) => `(+${code}) ${nsn}`;

const doubleZero: Formatter = (code, nsn) => `00${code}${nsn}`;

const national: Formatter = (_code, nsn) => nsn;

interface Strategy extends Weighted {
  readonly format: Formatter;
}

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
  { rarity: 0.05, format: e164 },
  { rarity: 0.35, format: spaced },
  { rarity: 0.6, format: dashed },
  { rarity: 0.82, format: parenthesised },
  { rarity: 0.95, format: doubleZero },
  { rarity: 0.99, format: national },
];

export type PhoneFormat = 'e164' | 'national';

const EXPLICIT_FORMATS: Record<PhoneFormat, Formatter> = {
  e164,
  national,
};

const isPhoneFormat = (value: string): value is PhoneFormat =>
  value === 'e164' || value === 'national';

export function generatePhone(
  country: PhoneCountry,
  rng: Rng,
  opts: GeneratedOptions,
): string {
  const spec = PHONE_COUNTRIES[country];
  const nsn = NSN_BUILDERS[country](rng);

  if (opts.valid === false) {
    return `+${spec.code}${nsn}${rng.int(10)}`;
  }

  const requested = opts.params?.format;
  if (requested !== undefined && isPhoneFormat(requested)) {
    return EXPLICIT_FORMATS[requested](spec.code, nsn);
  }

  const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);
  return strategy.format(spec.code, nsn);
}