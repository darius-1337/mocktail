import type { ValidationResult } from "../../contracts";

export const BRANDS = {
    visa: { label: 'Visa', prefixes: ['424242', '400000', '411111'], lengths: [16, 19] },
  mastercard: { label: 'Mastercard', prefixes: ['555555', '510510', '222300'], lengths: [16] },
  amex: { label: 'American Express', prefixes: ['378282', '371449'], lengths: [15] },
  discover: { label: 'Discover', prefixes: ['601111', '644000'], lengths: [16, 19] },
  jcb: { label: 'JCB', prefixes: ['356600'], lengths: [16, 19] },
  diners: { label: 'Diners Club', prefixes: ['305693', '360000'], lengths: [14, 16] },
} as const;

export type Brand = keyof typeof BRANDS;
export const BRAND_IDS = Object.keys(BRANDS) as readonly Brand[];

export function luhnAlg(digits: string): boolean {
    let sum = 0;
    let double = false;
    for(let i = digits.length - 1; i >= 0; i--) {
        let digit = Number(digits[i]);

        if(double) {
            digit *= 2;
            if(digit > 9) digit -= 9;
        }

        sum += digit;
        double = !double;
    }

    return sum % 10 === 0;
}

export function luhnCheckDigit(partial: string): string {
    for(let digit = 0; digit < 10; digit++) {
        if(luhnAlg(partial + digit)) return String(digit);
    }

    return '0';
}

const normalise = (input: string): string => input.replaceAll(/[\s-]/g, '');

export function brandOf(pan: string): Brand | undefined {
    
    return BRAND_IDS.find((id) => 
        BRANDS[id].prefixes.some((prefix) => pan.startsWith(prefix.slice(0, 4)))
    );
}

export function validateCard(input: string): ValidationResult {
    const value = normalise(input);

    if(!/^\d+$/.test(value)) {
        return { valid: false, reason: 'must contain only digits, spaces or dashes' };
    }

    if(value.length < 12 || value.length > 19) {
        return { valid: false, reason: `invalid length ${value.length}` };
    }

    if(!luhnAlg(value)) {
        return { valid: false, reason: 'Luhn checksum failed' };
    }

    return { valid: true };
}

export function validateBrandedCard(brand: Brand, input: string): ValidationResult {
    const value = normalise(input);
    const spec = BRANDS[brand];

    const generic = validateCard(input);
    if(!generic.valid) return generic;

    if(!spec.prefixes.some((prefix) => value.startsWith(prefix.slice(0, 4)))) {
        return { valid: false, reason: `not a ${spec.label} correct prefix` };
    }

    if(!(spec.lengths as readonly number[]).includes(value.length)) {
        return { valid: false, reason: `invalid ${spec.label}, expected: ${spec.lengths.join(' or ')}, got ${value.length}`, 
        };
    }

    return { valid: true };
}