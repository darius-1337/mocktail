import {
	BANDS,
	type Band,
	type GenerateResult,
	generate,
	InvalidParamError,
	type Kind,
	type KindParam,
	MAX_PARAM_LENGTH,
	MAX_SEED_LENGTH,
	randomSeed,
} from "@mocktail/core";
import { codeBlock } from "./code.js";
import { bindCopy, copyText } from "./copy.js";
import { curlFor } from "./curl.js";
import { el, FIELD_INPUT, fieldLabel, segmented, textButton } from "./dom.js";
import { BAND_HINTS, STRINGS } from "./strings.js";

const MAX_UI_COUNT = 25;

interface State {
	kind: Kind;
	band: Band;
	count: number;
	seed: string;
	valid: boolean;
	params: Record<string, string>;
}

export interface GeneratorPanel {
	readonly root: HTMLElement;
	readonly setKind: (kind: Kind) => void;
}

function enumOptions(pattern: RegExp | undefined): readonly string[] | null {
	if (pattern === undefined) return null;
	const match = /^\^\(([A-Za-z0-9_|-]+)\)\$$/.exec(pattern.source);
	const body = match?.[1];
	if (body === undefined) return null;
	const options = body.split("|").filter((option) => option !== "");
	return options.length > 1 ? options : null;
}

function cleanParams(
	params: Readonly<Record<string, string>>,
): Record<string, string> {
	const cleaned: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value !== "") cleaned[key] = value;
	}
	return cleaned;
}

function describeError(err: unknown): string {
	if (err instanceof InvalidParamError) {
		const problem = err.problem;
		const reason = problem.reason.replaceAll("_", " ");
		if (problem.example !== undefined) {
			return `${problem.parameter}: ${reason}, try ${problem.example}`;
		}
		if (problem.expected !== undefined) {
			return `${problem.parameter}: ${reason}, expected ${problem.expected}`;
		}
		return `${problem.parameter}: ${reason}`;
	}
	return err instanceof Error ? err.message : String(err);
}

export function createGeneratorPanel(
	initialKind: Kind,
	options: { showMeta?: boolean } = {},
): GeneratorPanel {
	const showMeta = options.showMeta ?? true;

	const state: State = {
		kind: initialKind,
		band: "realistic",
		count: 5,
		seed: randomSeed(),
		valid: true,
		params: {},
	};

	const kindTitle = el("h2", "font-display text-2xl");
	const kindMeta = el(
		"p",
		"text-sm leading-relaxed text-neutral-400 dark:text-neutral-500",
	);
	const kindHeader = el("div", "space-y-3", [kindTitle, kindMeta]);
	kindHeader.hidden = !showMeta;

	const bandHint = el(
		"span",
		"block text-xs text-neutral-400 dark:text-neutral-500",
	);
	bandHint.textContent = BAND_HINTS[state.band];
	const bandControl = segmented(BANDS, state.band, (band) => {
		state.band = band;
		bandControl.set(band);
		bandHint.textContent = BAND_HINTS[band];
		update();
	});

	const countInput = el("input", `w-24 ${FIELD_INPUT}`);
	countInput.type = "number";
	countInput.min = "1";
	countInput.max = String(MAX_UI_COUNT);
	countInput.step = "1";
	countInput.value = String(state.count);
	countInput.addEventListener("input", () => {
		const parsed = Number(countInput.value);
		if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_UI_COUNT) {
			state.count = parsed;
			update();
		}
	});
	countInput.addEventListener("blur", () => {
		countInput.value = String(state.count);
	});

	const validityControl = segmented(
		[STRINGS.validOption, STRINGS.invalidOption],
		state.valid ? STRINGS.validOption : STRINGS.invalidOption,
		(option) => {
			state.valid = option === STRINGS.validOption;
			validityControl.set(option);
			update();
		},
	);

	const seedInput = el("input", `w-full ${FIELD_INPUT}`);
	seedInput.type = "text";
	seedInput.maxLength = MAX_SEED_LENGTH;
	seedInput.spellcheck = false;
	seedInput.autocomplete = "off";
	seedInput.value = state.seed;
	seedInput.addEventListener("input", () => {
		state.seed = seedInput.value;
		update();
	});

	const newSeedButton = textButton(STRINGS.newSeed);
	newSeedButton.addEventListener("click", () => {
		state.seed = randomSeed();
		seedInput.value = state.seed;
		update();
	});

	const copySeedButton = textButton(STRINGS.copy);
	bindCopy(copySeedButton, () => state.seed, {
		idle: STRINGS.copy,
		done: STRINGS.copied,
	});

	const paramsContainer = el("div", "space-y-10");

	function paramRow(spec: KindParam): HTMLElement {
		const row = el("div", "space-y-2");
		row.append(fieldLabel(spec.name));

		const options = enumOptions(spec.pattern);
		if (options !== null) {
			const fallback = spec.default ?? options[0] ?? "";
			const control = segmented(
				options,
				state.params[spec.name] ?? fallback,
				(value) => {
					state.params[spec.name] = value;
					control.set(value);
					update();
				},
			);
			row.append(control.root);
		} else {
			const input = el("input", `w-full ${FIELD_INPUT}`);
			input.type = "text";
			input.spellcheck = false;
			input.autocomplete = "off";
			input.maxLength = spec.maxLength ?? MAX_PARAM_LENGTH;
			if (spec.default !== undefined) input.placeholder = spec.default;
			input.value = state.params[spec.name] ?? "";
			input.addEventListener("input", () => {
				state.params[spec.name] = input.value;
				update();
			});
			row.append(input);
		}

		row.append(
			el(
				"p",
				"text-xs leading-relaxed text-neutral-400 dark:text-neutral-500",
				[spec.description],
			),
		);
		return row;
	}

	function buildParams(): void {
		paramsContainer.replaceChildren();
		const specs = state.kind.params ?? [];
		paramsContainer.hidden = specs.length === 0;
		for (const spec of specs) {
			paramsContainer.append(paramRow(spec));
		}
	}

	const outputList = el(
		"div",
		"divide-y divide-neutral-100 dark:divide-neutral-900",
	);
	const errorLine = el("p", "text-sm text-red-700 dark:text-red-400");
	errorLine.hidden = true;
	let lastData: readonly string[] = [];
	const copyAllButton = textButton(STRINGS.copyAll);
	bindCopy(copyAllButton, () => lastData.join("\n"), {
		idle: STRINGS.copyAll,
		done: STRINGS.copied,
	});

	function resultRow(value: string): HTMLElement {
		const feedback = el(
			"span",
			"text-xs text-neutral-400 opacity-0 transition-opacity dark:text-neutral-500",
			[STRINGS.copied],
		);
		const row = el(
			"button",
			"flex w-full items-baseline justify-between gap-4 px-1 py-2 text-left font-mono text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900",
			[el("span", "break-all", [value]), feedback],
		);
		row.type = "button";
		let timer: ReturnType<typeof setTimeout> | undefined;
		row.addEventListener("click", () => {
			void copyText(value).then((ok) => {
				if (!ok) return;
				feedback.classList.remove("opacity-0");
				if (timer !== undefined) clearTimeout(timer);
				timer = setTimeout(() => feedback.classList.add("opacity-0"), 1200);
			});
		});
		return row;
	}

	const curlCode = codeBlock("bash");
	const copyCurlButton = textButton(STRINGS.copy);
	bindCopy(copyCurlButton, () => curlCode.getCode(), {
		idle: STRINGS.copy,
		done: STRINGS.copied,
	});

	function update(): void {
		const params = cleanParams(state.params);

		let result: GenerateResult | null = null;
		let errorText = "";
		try {
			result = generate({
				kind: state.kind.id,
				seed: state.seed,
				band: state.band,
				valid: state.valid,
				count: state.count,
				params,
			});
		} catch (err) {
			errorText = describeError(err);
		}

		outputList.replaceChildren();
		lastData = result === null ? [] : result.data;
		for (const value of lastData) {
			outputList.append(resultRow(value));
		}
		errorLine.textContent = errorText;
		errorLine.hidden = errorText === "";
		copyAllButton.hidden = result === null;

		curlCode.setCode(
			curlFor({
				kind: state.kind,
				seed: state.seed,
				band: state.band,
				count: state.count,
				valid: state.valid,
				params,
			}),
		);
	}

	const setKind = (kind: Kind): void => {
		state.kind = kind;
		state.params = {};
		kindTitle.textContent = kind.label.toLowerCase();
		kindMeta.textContent = kind.description;
		buildParams();
		update();
	};

	const root = el("div", "space-y-10", [
		kindHeader,
		el("div", "flex flex-wrap items-start gap-x-12 gap-y-10", [
			el("div", "space-y-2", [
				fieldLabel(STRINGS.bandLabel),
				bandControl.root,
				bandHint,
			]),
			el("div", "space-y-2", [fieldLabel(STRINGS.countLabel), countInput]),
			el("div", "space-y-2", [
				fieldLabel(STRINGS.validityLabel),
				validityControl.root,
			]),
		]),
		el("div", "space-y-2", [
			fieldLabel(STRINGS.seedLabel),
			el("div", "flex items-baseline gap-4", [
				seedInput,
				newSeedButton,
				copySeedButton,
			]),
		]),
		paramsContainer,
		el("section", "space-y-2", [
			el("div", "flex items-baseline justify-between", [
				fieldLabel(STRINGS.outputLabel),
				copyAllButton,
			]),
			outputList,
			errorLine,
		]),
		el("section", "space-y-2", [
			el("div", "flex items-baseline justify-between", [
				fieldLabel(STRINGS.curlLabel),
				copyCurlButton,
			]),
			curlCode.root,
		]),
	]);

	setKind(initialKind);
	return { root, setKind };
}
