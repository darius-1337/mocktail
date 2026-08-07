import type { Kind } from "../../contracts.js";
import { generateDni } from "./generator.js";
import { validateDni } from "./validator.js";

export const esDni: Kind = {
	id: "es-dni",
	label: "Spanish DNI/NIE",
	description: 'Spanish national and foreigner ID (DNI / NIE) with model 23 letter check',
	generate: generateDni,
	validate: validateDni,
};

export { generateDni, validateDni };
