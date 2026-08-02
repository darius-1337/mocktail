import type { GeneratedOptions } from '../../contracts.js';
import {BAND_TARGET} from '../../contracts.js';
import {selectByRarity, type Weighted} from '../../entropy/select.js';
import type { Rng } from '../../rng/splitmix64.js';
import {dniLetter} from './validator.js';

interface Strategy extends Weighted {

    readonly build: (rng: Rng) => string;
}

const pad = (num: number, len: number): string => num.toString().padStart(len, '0');

const dni = (num: number): string => {
    const digits = pad(num, 8);

    return digits + dniLetter(digits);
};


const nie = (prefix: 'X' | 'Y' | 'Z', num: number): string => {
    const digits = pad(num, 7);
    const numeric = String('XYZ'.indexOf(prefix)) + digits;

    return prefix + digits + dniLetter(numeric);
};

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
      { rarity: 0.05, build: (r) => dni(10_000_000 + r.int(90_000_000)) },
  { rarity: 0.3, build: (r) => dni(r.int(100_000_000)) },
  { rarity: 0.55, build: (r) => dni(r.int(1_000_000)) },
  { rarity: 0.72, build: (r) => nie('X', r.int(10_000_000)) },
  { rarity: 0.88, build: (r) => nie(r.float() < 0.5 ? 'Y' : 'Z', r.int(10_000_000)) },
  {
    rarity: 0.98,
    build: (r) =>
      r.pick([
        dni(0),
        dni(99_999_999),
        nie('Z', 0),
        nie('Z', 9_999_999),
        dni(11_111_111),
      ]),
  },
];

export function generateDni(rng: Rng, options: GeneratedOptions): string {
    const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[options.band]);
    const value = strategy.build(rng);

    if (options.valid === false) {

        const digits = value.slice(0, -1);
        const letter = value.slice(-1);
        const wrong = 'TRWAGMYFPDXBNJZSQVHLCKE'.replace(letter, '');

        return digits + (wrong[rng.int(wrong.length)] ?? 'X');
    }

    return value;
}