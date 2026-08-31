import { mountApp } from "./app.js";

const root = document.querySelector<HTMLElement>("#app");
if (root !== null) {
	mountApp(root);

	const slot = document.querySelector<HTMLElement>("#slot");
	if (slot !== null) {
		void import("./slot.js").then((mod) => {
			mod.mountSlotMachine(slot);
		});
	}
}
