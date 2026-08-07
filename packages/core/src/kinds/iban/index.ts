import type { Kind } from '../../contracts.js';
import { generateIban } from './generator.js';
import { COUNTRIES, validateIban, type CountryCode } from './validator.js';

export function ibanKind(country: CountryCode): Kind {
  return {
    id: `iban-${country.toLowerCase()}`,
    label: `IBAN (${country})`,
    generate: (rng, opts) => generateIban(country, rng, opts),
    validate: validateIban,
  };
}

export const ibanKinds: readonly Kind[] = COUNTRIES.map(ibanKind);

export { validateIban, generateIban, COUNTRIES, type CountryCode };