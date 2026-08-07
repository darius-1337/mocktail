import type { ValidationResult } from "../../contracts";

export const IBAN_LENGTHS = {
    ES: 24, DE: 22, GB: 22, FR: 27, IT: 27, NL: 18, MT: 31, NO: 15,
} as const;

export type CountryCode = keyof typeof IBAN_LENGTHS;

export const COUNTRIES = Object.keys(IBAN_LENGTHS) as readonly CountryCode[];

const SHAPE = /^[A-Z]{2}\d{2}[A-Z0-9]+$/;

export function mod97(input: string): number {
    let reminder = 0;
    for(const ch of input) {
        const baseChunk =
            ch >= '0' && ch <= '9' ? ch : String(ch.charCodeAt(0) - 55);
        for(const digit of baseChunk) {
            reminder = (reminder * 10 + Number(digit)) % 97;
        }
    }

    return reminder;
}

export function ibanCheckDigits(country: CountryCode, bban: string): string {
    return String(98 - mod97(`${bban}${country}00`)).padStart(2, '0');
}

function isCountry(value: string): value is CountryCode {
    return value in IBAN_LENGTHS;
}

export function validateIban(input: string): ValidationResult  {
    const value = input.replaceAll(/\s/g, '').toUpperCase();

    if(!SHAPE.test(value)) {
        return { valid: false, reason: 'Invalid format' };
    }

    const country = value.slice(0, 2);
    if(!isCountry(country)) {
        return { valid: false, reason: 'this country is not supported' };
    }

    if(value.length !== IBAN_LENGTHS[country]) {
        return {
            valid: false,
            reason: `Invalid length for this country, expected: ${IBAN_LENGTHS[country]}, got ${value.length}`,
        };
    }

    if(mod97(value.slice(4) + value.slice(0, 4)) !== 1) {
        return { valid: false, reason: 'Invalid checksum' };
    }

    return { valid: true };
}