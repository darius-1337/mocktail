import type { ValidationResult } from "../../contracts.js";
import { daysInMonth, pad } from "../date/validator.js";

const SHAPE =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

const MAX_OFFSET_HOURS = 14;

export function validateDateTime(input: string): ValidationResult {
	const match = SHAPE.exec(input.trim());

	if (match === null) {
		return {
			valid: false,
			reason: "expected ISO 8601 with offset ex: [2026-08-15T22:57:00Z]",
		};
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	const minute = Number(match[5]);
	const second = Number(match[6]);
	const offset = match[8] ?? "Z";

	if (month < 1 || month > 12)
		return { valid: false, reason: `invalid month: ${month}` };

	const maxDay = daysInMonth(year, month);
	if (day < 1 || day > maxDay) {
		return {
			valid: false,
			reason: `invalid day for ${pad(year, 4)}-${pad(month)}: ${day}`,
		};
	}

	if (hour > 23) return { valid: false, reason: `invalid hour: ${hour}` };
	if (minute > 59) return { valid: false, reason: `invalid minute: ${minute}` };
	if (second > 60) return { valid: false, reason: `invalid second: ${second}` };

	if (offset !== "Z") {
		const offsetHours = Number(offset.slice(1, 3));
		const offsetMinutes = Number(offset.slice(4, 6));

		if (offsetMinutes > 59)
			return { valid: false, reason: "invalid offset minutes" };
		if (offsetHours > MAX_OFFSET_HOURS)
			return { valid: false, reason: "offset beyond ±14:00" };
		if (offsetHours === MAX_OFFSET_HOURS && offsetMinutes !== 0) {
			return { valid: false, reason: "offset beyond ±14:00" };
		}
	}

	return { valid: true };
}
