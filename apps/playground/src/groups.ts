import { type Kind, registry } from "@mocktail/core";

export const HOMOGRAPH_KIND_ID = "domain-homograph";

export interface KindGroup {
	readonly label: string;
	readonly kinds: readonly Kind[];
}

interface GroupRule {
	readonly label: string;
	readonly test: (id: string) => boolean;
}

const GROUP_RULES: readonly GroupRule[] = [
	{ label: "Identity", test: (id) => id === "es-dni" },
	{ label: "Cards", test: (id) => id.startsWith("card-") },
	{ label: "IBAN", test: (id) => id.startsWith("iban-") },
	{ label: "UUID", test: (id) => id.startsWith("uuid-") },
	{ label: "Phone numbers", test: (id) => id.startsWith("phone-") },
	{ label: "Email", test: (id) => id === "email" },
	{ label: "Dates", test: (id) => id === "date" || id.startsWith("datetime") },
	{ label: "Security", test: (id) => id === HOMOGRAPH_KIND_ID },
];

export function kindGroups(): readonly KindGroup[] {
	const buckets = new Map<string, Kind[]>(
		GROUP_RULES.map((rule) => [rule.label, []]),
	);
	const other: Kind[] = [];

	for (const kind of registry.values()) {
		const rule = GROUP_RULES.find((candidate) => candidate.test(kind.id));
		if (rule === undefined) other.push(kind);
		else buckets.get(rule.label)?.push(kind);
	}

	const groups: KindGroup[] = [];
	for (const rule of GROUP_RULES) {
		const kinds = buckets.get(rule.label) ?? [];
		if (kinds.length > 0) groups.push({ label: rule.label, kinds });
	}
	if (other.length > 0) groups.push({ label: "Other", kinds: other });
	return groups;
}
