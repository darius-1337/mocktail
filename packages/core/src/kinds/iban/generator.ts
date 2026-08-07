import type { GeneratedOptions } from '../../contracts.js';
import { BAND_TARGET } from '../../contracts.js';
import { selectByRarity, type Weighted } from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';
import { ibanCheckDigits, type CountryCode } from './validator.js';


/* BBAN stants for basic bank account number (IBAN) this pattern is
its structure: n = digit, a = letter, c = alphanumeric */
const BBAN_PATTERN: Record<CountryCode, string> = {
    ES: 'n20', DE: 'n18', GB: 'a4n14', FR: 'n10c11n2',
  IT: 'a1n22', NL: 'a4n10', MT: 'a4n5c18', NO: 'n11',
};

const DIGITS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUM = DIGITS + LETTERS;

type DigitFill = (rng: Rng) => string;

interface Strategy extends Weighted {
    readonly fill: DigitFill;
}

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
    { rarity: 0.05, fill: (r) => DIGITS[1 + r.int(9)] ?? '1' },
  { rarity: 0.35, fill: (r) => DIGITS[r.int(10)] ?? '0' },
  { rarity: 0.6, fill: (r) => (r.float() < 0.6 ? '0' : (DIGITS[r.int(10)] ?? '0')) },
  { rarity: 0.85, fill: () => '0' },
  { rarity: 0.97, fill: () => '9' },
];

function parsePattern(pattern: string): readonly (readonly [string, number])[] {
  return [...pattern.matchAll(/([anc])(\d+)/g)].map(
    (m) => [m[1] ?? 'n', Number(m[2] ?? 0)] as const,
  );
}

function buildBban(rng: Rng, country: CountryCode, fill: DigitFill): string {
    let out = '';
    for(const [kind, len] of parsePattern(BBAN_PATTERN[country])) {
        const pool = kind === 'a' ? LETTERS : ALPHANUM;
        for(let i = 0; i < len; i++) {
            out += kind === 'n' ? fill(rng) : (pool[rng.int(pool.length)] ?? 'A'); 
        }
    }

    return out;
}
/* internal control digits for the spanish CCC (doble modelo 11) */
const CCC_WEIGHTS = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];

function cccDigit(digits: string): string {
    let sum = 0;
    for(let i = 0; i < digits.length; i++) {
        sum += Number(digits[i]) * (CCC_WEIGHTS[CCC_WEIGHTS.length - digits.length + i] ?? 0);
    }

    const r = 11 - (sum % 11);

    return String(r === 11 ? 0 : r === 10 ? 1 : r);
}

function checkSpanishDigits(bban: string): string {
    const bank = bban.slice(0, 4);
    const branch = bban.slice(4, 8);
    const accountNumber = bban.slice(10, 20);

    return bank + branch + cccDigit(`00${bank}${branch}`) + cccDigit(accountNumber) + accountNumber;
}

const grouped = (iban: string): string => iban.replace(/(.{4})/g, '$1 ').trim();

export function generateIban(
  country: CountryCode,
  rng: Rng,
  opts: GeneratedOptions,
): string {
  const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);

  let bban = buildBban(rng, country, strategy.fill);
  if (country === 'ES') bban = checkSpanishDigits(bban);

  const iban = country + ibanCheckDigits(country, bban) + bban;

  if (opts.valid === false) {
    const digit = Number(iban[2]);
    return iban.slice(0, 2) + String((digit + 1) % 10) + iban.slice(3);
  }

  // higher rarity generates more spaces
  if (strategy.rarity > 0.8 && rng.float() < 0.5) return grouped(iban);

  return iban;
}