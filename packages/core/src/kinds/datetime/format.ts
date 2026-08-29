import { pad } from "../date/validator";

export interface Instant {
	readonly year: number;
	readonly month: number;
	readonly day: number;
	readonly hour: number;
	readonly minute: number;
	readonly second: number;
	readonly offsetMinutes: number;
}

export type DatetimeFormat = "iso" | "sql";

export const DATETIME_FORMATS: readonly DatetimeFormat[] = ["iso", "sql"];

function offsetSuffix(minutes: number): string {
	if (minutes === 0) return "Z";

	const sign = minutes < 0 ? "-" : "+";
	const abs = Math.abs(minutes);

	return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

const stamp = (i: Instant, separator: string): string =>
	`${pad(i.year, 4)}-${pad(i.month)}-${pad(i.day)}${separator}` +
	`${pad(i.hour)}:${pad(i.minute)}:${pad(i.second)}`;

const WRITERS: Record<DatetimeFormat, (instant: Instant) => string> = {
	iso: (i) => stamp(i, "T") + offsetSuffix(i.offsetMinutes),

	// sql datetime so it doesnt break with the separation characters for http headers
	sql: (i) => stamp(i, " "),
};

export const writeDatetime = (
	instant: Instant,
	format: DatetimeFormat,
): string => WRITERS[format](instant);

export const isDatetimeFormat = (value: string): value is DatetimeFormat =>
	(DATETIME_FORMATS as readonly string[]).includes(value);
