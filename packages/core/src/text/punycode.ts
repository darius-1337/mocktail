const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = "-";
const MAX_INT = 0x7fffffff;

const ACE_PREFIX = /^xn--/i;

function basicToDigit(codePoint: number): number {
	if (codePoint - 48 < 10) return codePoint - 22;
	if (codePoint - 65 < 26) return codePoint - 65;
	if (codePoint - 97 < 26) return codePoint - 97;

	return BASE;
}

function adaptNumber(
	delta: number,
	numPoints: number,
	firstTime: boolean,
): number {
	let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
	d += Math.floor(d / numPoints);

	let constant = 0;
	for (; d > ((BASE - TMIN) * TMAX) >> 1; constant += BASE) {
		d = Math.floor(d / (BASE - TMIN));
	}

	return Math.floor(constant + ((BASE - TMAX + 1) * d) / (d + SKEW));
}

class PunycodeError extends Error {}

function decodeLabel(input: string): string {
	const output: number[] = [];
	let num = INITIAL_N;
	let i = 0;
	let bias = INITIAL_BIAS;

	const lastDelimiter = input.lastIndexOf(DELIMITER);
	let start = 0;

	if (lastDelimiter > 0) {
		for (let j = 0; j < lastDelimiter; j++) {
			const codePoint = input.charCodeAt(j);
			if (codePoint >= 0x80) throw new PunycodeError("non-basic code point");
			output.push(codePoint);
		}

		start = lastDelimiter + 1;
	}

	for (let index = start; index < input.length; ) {
		const oldIndex = i;

		for (let w = 1, constant = BASE; ; constant += BASE) {
			if (index >= input.length) throw new PunycodeError("truncated input");

			const digit = basicToDigit(input.charCodeAt(index++));

			if (digit >= BASE) throw new PunycodeError("invalid digit");
			if (digit > Math.floor((MAX_INT - i) / w))
				throw new PunycodeError("overflow");

			i += digit * w;
			const time =
				constant <= bias
					? TMIN
					: constant >= bias + TMAX
						? TMAX
						: constant - bias;
			if (digit < time) break;

			if (w > Math.floor(MAX_INT / (BASE - time)))
				throw new PunycodeError("overflow");
			w *= BASE - time;
		}

		const out = output.length + 1;
		bias = adaptNumber(i - oldIndex, out, oldIndex === 0);

		if (Math.floor(i / out) > MAX_INT - num)
			throw new PunycodeError("overflow");
		num += Math.floor(i / out);
		i %= out;

		output.splice(i++, 0, num);
	}

	return String.fromCodePoint(...output);
}

export const hasPunycode = (domain: string): boolean =>
	domain.split(".").some((label) => ACE_PREFIX.test(label));

export function punycodeToUnicode(domain: string): string {
	return domain
		.split(".")
		.map((label) => {
			if (!ACE_PREFIX.test(label)) return label;
			try {
				return decodeLabel(label.slice(4).toLowerCase());
			} catch {
				return label;
			}
		})
		.join(".");
}
