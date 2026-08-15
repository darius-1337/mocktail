import type { ValidationResult } from '../../contracts.js';
import { daysInMonth, pad } from '../date/validator.js';

// instants construction: range, bands and strategies shared with datetime and datime-sql, this only diferenciate on the result

export function validateParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): ValidationResult {
  if (month < 1 || month > 12) return { valid: false, reason: `invalid month: ${month}` };

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return { valid: false, reason: `invalid day for ${pad(year, 4)}-${pad(month)}: ${day}` };
  }

  if (hour > 23) return { valid: false, reason: `invalid hour: ${hour}` };
  if (minute > 59) return { valid: false, reason: `invalid minute: ${minute}` };
  if (second > 60) return { valid: false, reason: `invalid second: ${second}` };

  return { valid: true };
}