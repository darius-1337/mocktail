import type { ValidationResult } from "../../contracts.js";

export const isLeapYear = (year: number): boolean =>
	(year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export const daysInMonth = (year: number, month: number): number =>
	month === 2 && isLeapYear(year) ? 29 : (MONTH_DAYS[month - 1] ?? 30);

export const pad = (num: number, len = 2): string =>
	String(num).padStart(len, "0");

export const formatDate = (year: number, month: number, day: number): string =>
	`${pad(year, 4)}-${pad(month)}-${pad(day)}`;

export function toEpochDay(year: number, month: number, day: number): number {
	const a = Math.floor((14 - month) / 12);
	const yr = year + 4800 - a;
	const m = month + 12 * a - 3;

	return (
		day +
		Math.floor((153 * m + 2) / 5) +
		365 * yr +
		Math.floor(yr / 4) -
		Math.floor(yr / 100) +
		Math.floor(yr / 400) -
		32045 -
		2440588
	);
}

export function fromEpochDay(
	epochDay: number,
): readonly [number, number, number] {
	const a = epochDay + 2440588 + 32044;
	const b = Math.floor((4 * a + 3) / 146097);
	const c = a - Math.floor((146097 * b) / 4);
	const d = Math.floor((4 * c + 3) / 1461);
	const e = c - Math.floor((1461 * d) / 4);
	const m = Math.floor((5 * e + 2) / 153);

	const day = e - Math.floor((153 * m + 2) / 5) + 1;
	const month = m + 3 - 12 * Math.floor(m / 10);
	const year = 100 * b + d - 4800 + Math.floor(m / 10);

	return [year, month, day];
}

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(
	input: string,
): readonly [number, number, number] | null {
	const match = SHAPE.exec(input.trim());

	if (match === null) return null;

	return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
}

export function validateDate(input: string): ValidationResult {
	const parsed = parseDate(input);

	if (parsed === null)
		return { valid: false, reason: "invalid date, expected yyyy-mm-dd" };

	const [year, month, day] = parsed;

	if (year < 1 || year > 9999)
		return { valid: false, reason: "year out of range" };
	if (month < 1 || month > 12)
		return { valid: false, reason: "month out of range" };

	const max = daysInMonth(year, month);
	if (day < 1 || day > max) {
		return {
			valid: false,
			reason: `invalid day for ${pad(year, 4)}-${pad(month)}: ${day} (max ${max})`,
		};
	}

	return { valid: true };
}
