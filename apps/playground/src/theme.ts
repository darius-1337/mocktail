const STORAGE_KEY = "mocktail-theme";

export function isDark(): boolean {
	return document.documentElement.classList.contains("dark");
}

export function toggleTheme(): void {
	const next = isDark() ? "light" : "dark";
	document.documentElement.classList.toggle("dark", next === "dark");
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {}
}
