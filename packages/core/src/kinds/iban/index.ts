import type { Kind } from "../../contracts.js";
import { COUNTRIES_WITH_NATIONAL_CHECK, generateIban } from "./generator.js";
import { COUNTRIES, type CountryCode, validateIban } from "./validator.js";

export function ibanKind(country: CountryCode): Kind {
	const hasNationalCheck = COUNTRIES_WITH_NATIONAL_CHECK.includes(country);

	return {
		id: `iban-${country.toLowerCase()}`,
		label: `IBAN (${country})`,
		description: `IBAN for ${country}: ISO 7064 mod-97 checksum${
			hasNationalCheck ? ", with national BBAN check digits" : ""
		}.`,
		generate: (rng, opts) => generateIban(country, rng, opts),
		validate: validateIban,
	};
}

export const ibanKinds: readonly Kind[] = COUNTRIES.map(ibanKind);

export { COUNTRIES, type CountryCode, generateIban, validateIban };
