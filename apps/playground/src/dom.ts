type Child = Node | string;

export function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className = "",
	children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className !== "") node.className = className;
	node.append(...children);
	return node;
}

export const FIELD_INPUT =
	"border-b border-neutral-300 bg-transparent py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-neutral-100";

const SEGMENT_IDLE =
	"-ml-px border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 first:ml-0 hover:text-neutral-900 dark:border-neutral-800 dark:hover:text-neutral-100";
const SEGMENT_ACTIVE =
	"-ml-px border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm text-white first:ml-0 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900";

export function textButton(label: string): HTMLButtonElement {
	const button = el(
		"button",
		"text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100",
		[label],
	);
	button.type = "button";
	return button;
}

export function fieldLabel(text: string): HTMLElement {
	return el(
		"p",
		"text-xs tracking-widest text-neutral-400 uppercase dark:text-neutral-500",
		[text],
	);
}

export interface Segmented<T extends string> {
	readonly root: HTMLElement;
	readonly set: (value: T) => void;
}

export function segmented<T extends string>(
	options: readonly T[],
	initial: T,
	onPick: (value: T) => void,
): Segmented<T> {
	const buttons = new Map<T, HTMLButtonElement>();
	const root = el("div", "flex flex-wrap");
	for (const option of options) {
		const button = el("button", SEGMENT_IDLE, [option]);
		button.type = "button";
		button.addEventListener("click", () => onPick(option));
		buttons.set(option, button);
		root.append(button);
	}
	const set = (value: T): void => {
		for (const [option, button] of buttons) {
			button.className = option === value ? SEGMENT_ACTIVE : SEGMENT_IDLE;
		}
	};
	set(initial);
	return { root, set };
}
