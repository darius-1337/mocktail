import type { Kind } from "../../contracts.js";
import { generatePhone } from "./generator.js";
import {
	PHONE_COUNTRIES,
	PHONE_COUNTRY_IDS,
	type PhoneCountry,
	validatePhone,
} from "./validator.js";

const NOTES: Record<PhoneCountry, string> = {
	us: "Uses the 555-0100 to 555-0199 range, which NANPA reserves for fictitious use.",
	gb: "Uses the 020 7946 0XXX and 07700 900XXX blocks, which Ofcom reserves for drama.",
	es: "Uses the 99 range, which the Spanish numbering plan does not allocate. This is a technical convention, not a regulatory reservation like the US 555 range: strict validators will reject these as not assignable in ES, which is deliberate so the number cannot belong to a real subscriber.",
};

export function phoneKind(country: PhoneCountry): Kind {
	const spec = PHONE_COUNTRIES[country];
	return {
		id: `phone-${country}`,
		label: `Phone number (${spec.label})`,
		description:
			`E.164 phone number for ${spec.label}. ${NOTES[country]} ` +
			"Higher bands return printed forms with spaces, dashes, parentheses, " +
			"the 00 international prefix, and the national form without a country code.",
		params: [
			{
				name: "format",
				description:
					"Pin the output format: e164 (+34999123456) or national (999123456). " +
					"Leave it as auto to let the band decide, which also yields printed " +
					"forms with spaces, dashes, parentheses and the 00 prefix.",
				default: "auto",
				maxLength: 8,
				pattern: /^(auto|e164|national)$/,
			},
		],
		generate: (rng, opts) => generatePhone(country, rng, opts),
		validate: (value) => validatePhone(value, country),
	};
}

export const phoneKinds: readonly Kind[] = PHONE_COUNTRY_IDS.map(phoneKind);

export { generatePhone, PHONE_COUNTRY_IDS, type PhoneCountry, validatePhone };
