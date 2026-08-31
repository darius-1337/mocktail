import { type CodeBlock, type CodeLanguage, codeBlock } from "./code.js";
import { bindCopy } from "./copy.js";
import { API_BASE } from "./curl.js";
import { el, fieldLabel, segmented, textButton } from "./dom.js";
import { STRINGS } from "./strings.js";

export function sectionTitle(text: string): HTMLElement {
	return el("h2", "font-display text-2xl", [text]);
}

export function sectionIntro(text: string): HTMLElement {
	return el(
		"p",
		"text-sm leading-relaxed text-neutral-500 dark:text-neutral-400",
		[text],
	);
}

export function example(
	label: string,
	note: string,
	language: CodeLanguage,
	code: string,
): HTMLElement {
	const block: CodeBlock = codeBlock(language, code);
	const copyButton = textButton(STRINGS.copy);

	bindCopy(copyButton, () => block.getCode(), {
		idle: STRINGS.copy,
		done: STRINGS.copied,
	});

	return el("div", "space-y-2", [
		el("div", "flex items-baseline justify-between", [
			fieldLabel(label),
			copyButton,
		]),
		el("p", "text-xs leading-relaxed text-neutral-400 dark:text-neutral-500", [
			note,
		]),
		block.root,
	]);
}

export function buildApiSection(): HTMLElement {
	return el("section", "space-y-10", [
		el("div", "space-y-3", [
			sectionTitle(STRINGS.apiTitle),
			sectionIntro(STRINGS.apiIntro),
		]),
		example(
			STRINGS.apiGenerateLabel,
			STRINGS.apiGenerateNote,
			"bash",
			`curl "${API_BASE}/v1/gen/es-dni"`,
		),
		example(
			STRINGS.apiSeedLabel,
			STRINGS.apiSeedNote,
			"bash",
			`curl "${API_BASE}/v1/gen/iban-es/my-seed-123?band=limit&count=3"`,
		),
		example(
			STRINGS.apiInvalidLabel,
			STRINGS.apiInvalidNote,
			"bash",
			`curl "${API_BASE}/v1/gen/email?valid=false&count=5"`,
		),
		example(
			STRINGS.apiValidateLabel,
			STRINGS.apiValidateNote,
			"bash",
			`curl -X POST "${API_BASE}/v1/validate/es-dni" \\
  -H "content-type: application/json" \\
  -d '{"value":"12345678Z"}'`,
		),
		example(
			STRINGS.apiPopulateLabel,
			STRINGS.apiPopulateNote,
			"bash",
			`curl -X POST "${API_BASE}/v1/populate" \\
  -H "content-type: application/json" \\
  -d '{"seed":"demo","count":3,"fields":{"id":"uuid-v7","dni":"es-dni","email":"email"}}'`,
		),
	]);
}

const TUTORIAL_URL = `${API_BASE}/v1/gen/es-dni/my-seed-123?count=5`;

const TUTORIAL_SNIPPETS: Record<
	string,
	{ language: CodeLanguage; code: string }
> = {
	shell: {
		language: "bash",
		code: `curl "${TUTORIAL_URL}"`,
	},
	javascript: {
		language: "javascript",
		code: `const res = await fetch(
  "${TUTORIAL_URL}",
);
const body = await res.json();
console.log(body.data);`,
	},
	python: {
		language: "python",
		code: `import json
from urllib.request import urlopen

url = "${TUTORIAL_URL}"
body = json.load(urlopen(url))
print(body["data"])`,
	},
	java: {
		language: "java",
		code: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Mocktail {
  public static void main(String[] args) throws Exception {
    var client = HttpClient.newHttpClient();
    var request = HttpRequest.newBuilder(URI.create(
        "${TUTORIAL_URL}"))
      .build();
    var response = client.send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(response.body());
  }
}`,
	},
};

export function buildTutorialSection(): HTMLElement {
	const languages = Object.keys(TUTORIAL_SNIPPETS);
	const first = languages[0] ?? "shell";
	const firstSnippet = TUTORIAL_SNIPPETS[first];

	const block = codeBlock(
		firstSnippet?.language ?? "bash",
		firstSnippet?.code ?? "",
	);

	const copyButton = textButton(STRINGS.copy);
	bindCopy(copyButton, () => block.getCode(), {
		idle: STRINGS.copy,
		done: STRINGS.copied,
	});

	const picker = segmented(languages, first, (language) => {
		picker.set(language);
		const snippet = TUTORIAL_SNIPPETS[language];

		if (snippet !== undefined) block.setCode(snippet.code, snippet.language);
	});

	return el("section", "space-y-6", [
		el("div", "space-y-3", [
			sectionTitle(STRINGS.tutorialTitle),
			sectionIntro(STRINGS.tutorialIntro),
		]),

		picker.root,
		el("div", "space-y-2", [
			el("div", "flex justify-end", [copyButton]),
			block.root,
		]),
	]);
}
