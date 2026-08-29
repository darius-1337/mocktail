import type { Kind } from "../../contracts.js";
import { generateEmail } from "./generator.js";
import { validateEmail } from "./validator.js";

export const email: Kind = {
	id: "email",
	label: "Email address",
	description:
		"RFC 5322 email address. Higher bands produce quoted local parts, IP literals and unusual TLDs that are valid but break most regex validators. Comments (CFWS) are not supported.",
	generate: generateEmail,
	validate: validateEmail,
};

export { generateEmail, validateEmail };
