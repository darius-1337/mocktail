import type { Band } from "@mocktail/core";

export const STRINGS = {
	title: "mocktail",
	tagline: "Deterministic test data that passes real validators.",
	intro: "Same seed, same data, every time.",
	bandLabel: "band",
	countLabel: "count",
	validityLabel: "validity",
	validOption: "valid",
	invalidOption: "invalid",
	seedLabel: "seed",
	newSeed: "new",
	copy: "copy",
	copied: "copied",
	copyAll: "copy all",
	outputLabel: "output",
	curlLabel: "same request over the API",
	themeToDark: "dark",
	themeToLight: "light",
	homographAnalyzeLabel: "analyze a domain over the API",
	homographAnalyzeNote:
		"The analyze endpoint takes any domain and flags characters that only pretend to be ASCII.",
	apiTitle: "the API",
	apiIntro:
		"Everything on this page is one HTTP call away. No keys, no signup.",
	apiGenerateLabel: "generate",
	apiGenerateNote:
		"One GET per batch. The server picks a random seed and returns it in the response.",
	apiSeedLabel: "pin a seed",
	apiSeedNote:
		"Put the seed in the path to freeze a test case. The same URL returns the same data forever.",
	apiInvalidLabel: "invalid data",
	apiInvalidNote:
		"Add valid=false to get values the validator must reject. Useful for error paths.",
	apiValidateLabel: "validate",
	apiValidateNote: "Send any value and learn whether it passes and why not.",
	apiPopulateLabel: "populate",
	apiPopulateNote:
		"Full rows from a field spec. Send accept: text/csv or application/sql to change the output format.",
	tutorialTitle: "from your code",
	tutorialIntro:
		"Pick your language. Each snippet fetches five Spanish DNIs with a fixed seed, so it prints the same five values every run.",
} as const;

export const BAND_HINTS: Record<Band, string> = {
	simple: "common shapes",
	realistic: "everyday variety",
	limit: "edge cases",
	hostile: "parser breakers",
};
