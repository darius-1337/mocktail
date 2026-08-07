import type { Kind } from "../../contracts.js";
import { generateDni } from "./generator.js";
import { validateDni } from "./validator.js";

export const esDni: Kind = {
	id: "es-dni",
	label: "Spanish DNI/NIE",
	generate: generateDni,
	validate: validateDni,
};

export { generateDni, validateDni };
