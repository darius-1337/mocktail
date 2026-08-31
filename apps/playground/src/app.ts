import { API_BASE } from "./curl.js";
import { el, fieldLabel, textButton } from "./dom.js";
import { buildApiSection, buildTutorialSection, example } from "./examples.js";
import { HOMOGRAPH_KIND_ID, kindGroups } from "./groups.js";
import { createGeneratorPanel } from "./panel.js";
import { STRINGS } from "./strings.js";
import { isDark, toggleTheme } from "./theme.js";

const NAV_IDLE =
	"block w-full py-0.5 text-left font-mono text-sm text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100";
const NAV_ACTIVE =
	"block w-full py-0.5 text-left font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100";

export function mountApp(root: HTMLElement): void {
	const groups = kindGroups();
	const firstKind = groups[0]?.kinds[0];
	if (firstKind === undefined) return;

	const themeButton = textButton(
		isDark() ? STRINGS.themeToLight : STRINGS.themeToDark,
	);
	themeButton.addEventListener("click", () => {
		toggleTheme();
		themeButton.textContent = isDark()
			? STRINGS.themeToLight
			: STRINGS.themeToDark;
	});

	const header = el("header", "flex items-start justify-between gap-6", [
		el("div", "", [
			el("h1", "font-display text-5xl", [STRINGS.title]),
			el("p", "mt-4 text-neutral-500 dark:text-neutral-400", [STRINGS.tagline]),
			el("p", "mt-1 text-neutral-400 dark:text-neutral-500", [STRINGS.intro]),
		]),
		themeButton,
	]);

	const slot = el(
		"div",
		"mt-6 h-56 w-full cursor-grab active:cursor-grabbing sm:h-64",
	);
	slot.id = "slot";

	const mainPanel = createGeneratorPanel(firstKind);

	const homographExtra = example(
		STRINGS.homographAnalyzeLabel,
		STRINGS.homographAnalyzeNote,
		"bash",
		`# the first a in the value below is Cyrillic, not ASCII
curl -X POST "${API_BASE}/v1/analyze/domain" \\
  -H "content-type: application/json" \\
  -d '{"value":"exаmple.com"}'`,
	);

	const applyKind = (kindId: string): void => {
		homographExtra.hidden = kindId !== HOMOGRAPH_KIND_ID;
	};
	applyKind(firstKind.id);

	// --- Lateral de tipos agrupados ---
	const navButtons = new Map<string, HTMLButtonElement>();
	const setActive = (kindId: string): void => {
		for (const [id, button] of navButtons) {
			button.className = id === kindId ? NAV_ACTIVE : NAV_IDLE;
		}
	};

	const nav = el("nav", "space-y-8");
	for (const group of groups) {
		const list = el("div", "mt-2");
		for (const kind of group.kinds) {
			const button = el("button", NAV_IDLE, [kind.id]);
			button.type = "button";
			button.addEventListener("click", () => {
				mainPanel.setKind(kind);
				setActive(kind.id);
				applyKind(kind.id);
			});
			navButtons.set(kind.id, button);
			list.append(button);
		}
		nav.append(el("div", "", [fieldLabel(group.label), list]));
	}
	setActive(firstKind.id);

	const sidebar = el("aside", "md:sticky md:top-10 md:self-start", [nav]);

	const content = el("div", "space-y-24", [
		el("div", "space-y-10", [mainPanel.root, homographExtra]),
		buildApiSection(),
		buildTutorialSection(),
	]);

	root.append(
		header,
		slot,
		el("div", "mt-12 grid gap-12 md:grid-cols-[190px_minmax(0,1fr)]", [
			sidebar,
			content,
		]),
	);
}
