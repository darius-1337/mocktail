import type { ValidationResult } from '../../contracts.js';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

const NIE_PREFIX: Record<string, string> = { X: '0', Y: '1', Z: '2' };

const SHAPE = /^([XYZ]?)(\d{7,8})([A-Z])$/;

export function validateDni(input: string): ValidationResult {
    const value = input.trim().toUpperCase();

    const match = SHAPE.exec(value);
    if (match === null) {
        return { valid: false, reason: 'Invalid format' };
    }

    const [, prefix = '', digits = '', letter = ''] = match;

    const expectedDigits = prefix === '' ? 8 : 7;
    if (digits.length !== expectedDigits) {
        return { valid: false, reason: 'Invalid number of digits' };
    }

    const numericVal = prefix === '' ? digits : `${NIE_PREFIX[prefix]}${digits}`;
    const expected = DNI_LETTERS[Number(numericVal) % 23];

    if (letter !== expected) {
        return { valid: false, reason: `Invalid letter, expected ${expected}` };
    }

    return { valid: true };
}

export function dniLetter(numeric: string): string {
    
    return DNI_LETTERS[Number(numeric) % 23] ?? '';
}