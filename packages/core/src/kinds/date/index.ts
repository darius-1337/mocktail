import type { Kind } from "../../contracts.js";
import { DEFAULT_FROM, DEFAULT_TO, generateDate } from "./generator.js";
import { validateDate } from "./validator.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const date: Kind = {
	id: "date",
	label: "Calendar Date",
	description:
		"ISO 8601 calendar date (YYYY-MM-DD). Higher bands favour month boundaries, 29 February in leap years, and dates that break systems: the Unix epoch, the 2038 signed 32-bit limit, and year 9999.",
	params: [
		{
			name: "from",
			description: "Earliest date, inclusive (YYYY-MM-DD)",
			default: DEFAULT_FROM,
			maxLength: 10,
			pattern: DATE_PATTERN,
		},
		{
			name: "to",
			description: "Latest date, inclusive (YYYY-MM-DD)",
			default: DEFAULT_TO,
			maxLength: 10,
			pattern: DATE_PATTERN,
		},
	],

	generate: generateDate,
	validate: validateDate,
};

export { generateDate, validateDate };
