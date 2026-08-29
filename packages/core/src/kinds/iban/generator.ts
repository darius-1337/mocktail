import type { GeneratedOptions } from "../../contracts.js";
import { BAND_TARGET } from "../../contracts.js";
import { selectByRarity, type Weighted } from "../../entropy/select.js";
import type { Rng } from "../../rng/splitmix64.js";
import { type CountryCode, ibanCheckDigits } from "./validator.js";

/* BBAN stants for basic bank account number this pattern is
its structure: n = digit, a = letter, c = alphanumeric */
const BBAN_PATTERN: Record<CountryCode, string> = {
	ES: "n20",
	DE: "n18",
	GB: "a4n14",
	FR: "n10c11n2",
	IT: "a1n22",
	NL: "a4n10",
	MT: "a4n5c18",
	NO: "n11",
	BE: "n12",
};

const DIGITS = "0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHANUM = DIGITS + LETTERS;

type DigitFill = (rng: Rng) => string;

interface Strategy extends Weighted {
	readonly fill: DigitFill;
}

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
	{ rarity: 0.05, fill: (r) => DIGITS[1 + r.int(9)] ?? "1" },
	{ rarity: 0.35, fill: (r) => DIGITS[r.int(10)] ?? "0" },
	{
		rarity: 0.6,
		fill: (r) => (r.float() < 0.6 ? "0" : (DIGITS[r.int(10)] ?? "0")),
	},
	{ rarity: 0.85, fill: () => "0" },
	{ rarity: 0.97, fill: () => "9" },
];

function parsePattern(pattern: string): readonly (readonly [string, number])[] {
	return [...pattern.matchAll(/([anc])(\d+)/g)].map(
		(m) => [m[1] ?? "n", Number(m[2] ?? 0)] as const,
	);
}

function buildBban(rng: Rng, country: CountryCode, fill: DigitFill): string {
	let out = "";
	for (const [kind, len] of parsePattern(BBAN_PATTERN[country])) {
		const pool = kind === "a" ? LETTERS : ALPHANUM;
		for (let i = 0; i < len; i++) {
			out += kind === "n" ? fill(rng) : (pool[rng.int(pool.length)] ?? "A");
		}
	}

	return out;
}
/* internal control digits for the spanish CCC (doble modelo 11) */
const CCC_WEIGHTS = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];

function cccDigit(digits: string): string {
	let sum = 0;
	for (let i = 0; i < digits.length; i++) {
		sum +=
			Number(digits[i]) *
			(CCC_WEIGHTS[CCC_WEIGHTS.length - digits.length + i] ?? 0);
	}

	const r = 11 - (sum % 11);

	return String(r === 11 ? 0 : r === 10 ? 1 : r);
}

const digitsOnly = (s: string): number => {
	let r = 0;
	for (const d of s) r = (r * 10 + Number(d)) % 97;
	return r;
};

// spain
function withSpanishCheckDigits(bban: string): string {
	const bank = bban.slice(0, 4);
	const branch = bban.slice(4, 8);
	const account = bban.slice(10, 20);
	return (
		bank + branch + cccDigit(`00${bank}${branch}`) + cccDigit(account) + account
	);
}

// norway
function withNorwegianCheckDigit(bban: string): string {
	const W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let head = bban.slice(0, 10);
	for (let attempt = 0; attempt < 11; attempt++) {
		let sum = 0;
		for (let i = 0; i < 10; i++) sum += Number(head[i]) * (W[i] ?? 0);
		const r = 11 - (sum % 11);
		const d = r === 11 ? 0 : r;
		if (d !== 10) return head + d;
		head = head.slice(0, 9) + String((Number(head[9]) + 1) % 10);
	}
	return `${head}0`;
}

// netherlands
function withDutchCheckDigit(bban: string): string {
	const prefix = bban.slice(0, 4);
	let account = bban.slice(4, 14);
	for (let attempt = 0; attempt < 11; attempt++) {
		let sum = 0;
		for (let i = 0; i < 9; i++) sum += Number(account[i]) * (10 - i);
		const d = (11 - (sum % 11)) % 11;
		if (d !== 10) return prefix + account.slice(0, 9) + d;
		account =
			account.slice(0, 8) + String((Number(account[8]) + 1) % 10) + account[9];
	}
	return prefix + account;
}

// france
function withFrenchRibKey(bban: string): string {
	const toDigit = (c: string): string =>
		c >= "0" && c <= "9" ? c : String(((c.charCodeAt(0) - 65) % 9) + 1);

	const bank = bban.slice(0, 5);
	const branch = bban.slice(5, 10);
	const account = bban.slice(10, 21);
	const numeric = [...account].map(toDigit).join("");

	const key =
		97 -
		((89 * digitsOnly(bank) +
			15 * digitsOnly(branch) +
			3 * digitsOnly(numeric)) %
			97);

	return bank + branch + account + String(key).padStart(2, "0");
}

// belgium
function withBelgianCheckDigits(bban: string): string {
	const head = bban.slice(0, 10);
	return head + String(digitsOnly(head) || 97).padStart(2, "0");
}

const NATIONAL_FIXUP: Partial<Record<CountryCode, (bban: string) => string>> = {
	ES: withSpanishCheckDigits,
	NO: withNorwegianCheckDigit,
	NL: withDutchCheckDigit,
	FR: withFrenchRibKey,
	BE: withBelgianCheckDigits,
};

export const COUNTRIES_WITH_NATIONAL_CHECK: readonly CountryCode[] =
	Object.keys(NATIONAL_FIXUP) as CountryCode[];

const grouped = (iban: string): string => iban.replace(/(.{4})/g, "$1 ").trim();

export function generateIban(
	country: CountryCode,
	rng: Rng,
	opts: GeneratedOptions,
): string {
	const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[opts.band]);

	let bban = buildBban(rng, country, strategy.fill);
	bban = NATIONAL_FIXUP[country]?.(bban) ?? bban;

	const iban = country + ibanCheckDigits(country, bban) + bban;

	if (opts.valid === false) {
		const digit = Number(iban[2]);
		return iban.slice(0, 2) + String((digit + 1) % 10) + iban.slice(3);
	}

	// higher rarity generates more spaces
	if (strategy.rarity > 0.8 && rng.float() < 0.5) return grouped(iban);

	return iban;
}
