export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function bindCopy(
	button: HTMLButtonElement,
	getText: () => string,
	labels: { idle: string; done: string },
): void {
	button.textContent = labels.idle;
	let timer: ReturnType<typeof setTimeout> | undefined;
	button.addEventListener("click", () => {
		void copyText(getText()).then((ok) => {
			if (!ok) return;
			button.textContent = labels.done;
			if (timer !== undefined) clearTimeout(timer);
			timer = setTimeout(() => {
				button.textContent = labels.idle;
			}, 1200);
		});
	});
}
