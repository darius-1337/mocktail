import type { Kind } from "../../contracts";
import { generateCard } from "./generator";
import { BRANDS, BRAND_IDS, validateBrandedCard, type Brand } from './validator.js';

export function cardKind(brand: Brand): Kind {
    const spec = BRANDS[brand];

    return {
        id: `card-${brand}`,
        label: spec.label,
        description: `${spec.label} card number with valid Luhn checksum uses BIN ranges, never real range (just in case).`,
        generate: (rng, options) => generateCard(brand, rng, options),
        validate: (value) => validateBrandedCard(brand, value),
    };
}

export const cardKinds: readonly Kind[] = BRAND_IDS.map(cardKind);

export { validateCard, validateBrandedCard, luhnAlg, BRAND_IDS, type Brand } from './validator.js';