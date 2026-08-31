import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import { el } from "./dom.js";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);

export type CodeLanguage = "bash" | "javascript" | "python" | "java";

export interface CodeBlock {
	readonly root: HTMLElement;
	readonly setCode: (code: string, language?: CodeLanguage) => void;
	readonly getCode: () => string;
}

export function codeBlock(language: CodeLanguage, initial = ""): CodeBlock {
	let current = initial;
	let currentLanguage: CodeLanguage = language;

	const code = el("code", "hljs");
	const root = el(
		"pre",
		"overflow-x-auto border border-neutral-200 p-4 font-mono text-xs leading-relaxed whitespace-pre dark:border-neutral-800",
		[code],
	);

	const render = (): void => {
		code.innerHTML = hljs.highlight(current, {
			language: currentLanguage,
		}).value;
	};

	const setCode = (next: string, nextLanguage?: CodeLanguage): void => {
		current = next;
		if (nextLanguage !== undefined) currentLanguage = nextLanguage;
		render();
	};

	if (initial !== "") render();
	return { root, setCode, getCode: () => current };
}
