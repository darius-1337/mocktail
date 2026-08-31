import {
	BoxGeometry,
	CanvasTexture,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	NearestFilter,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	WebGLRenderer,
} from "three";

export const SLOT_CONFIG = {
	cubeSize: 5.5,
	positions: [-10.5, -4.5, 4.5, 10.5],
	spinInterval: 2500,
	spinSpeed: 0.08,
	dragSensitivity: 0.008,
	cameraZ: 38,
	cameraFov: 35,
} as const;

const WORDS_FRONT = ["MO", "CK", "TA", "IL"] as const;
const WORDS_TOP = ["NE", "ED", "DA", "TA?"] as const;

function createSolidFace(text: string): MeshBasicMaterial {
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	if (ctx === null) return new MeshBasicMaterial({ color: 0xffffff });

	ctx.imageSmoothingEnabled = false;
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, 512, 512);

	if (text !== "") {
		ctx.fillStyle = "#000000";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = 'bold 240px "Courier New", Courier, monospace';
		ctx.fillText(text, 256, 256);
	}

	const texture = new CanvasTexture(canvas);
	texture.magFilter = NearestFilter;
	texture.minFilter = NearestFilter;
	return new MeshBasicMaterial({ map: texture });
}

interface Reel {
	readonly group: Group;
	target: number;
}

export function mountSlotMachine(container: HTMLElement): void {
	const scene = new Scene();
	const camera = new PerspectiveCamera(
		SLOT_CONFIG.cameraFov,
		container.clientWidth / container.clientHeight,
		0.1,
		150,
	);
	camera.position.z = SLOT_CONFIG.cameraZ;

	const renderer = new WebGLRenderer({ antialias: false, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setClearColor(0x000000, 0);
	container.appendChild(renderer.domElement);

	const mainGroup = new Group();
	scene.add(mainGroup);

	const blankFace = createSolidFace("");
	const planeGeo = new PlaneGeometry(
		SLOT_CONFIG.cubeSize,
		SLOT_CONFIG.cubeSize,
	);
	const d = SLOT_CONFIG.cubeSize / 2;
	const reels: Reel[] = [];

	SLOT_CONFIG.positions.forEach((x, i) => {
		const group = new Group();
		group.position.x = x;

		const front = new Mesh(planeGeo, createSolidFace(WORDS_FRONT[i] ?? ""));
		front.position.z = d;
		group.add(front);

		const top = new Mesh(planeGeo, createSolidFace(WORDS_TOP[i] ?? ""));
		top.position.y = d;
		top.rotation.x = -Math.PI / 2;
		group.add(top);

		const back = new Mesh(planeGeo, createSolidFace(WORDS_FRONT[i] ?? ""));
		back.position.z = -d;
		back.rotation.x = Math.PI;
		group.add(back);

		const bottom = new Mesh(planeGeo, createSolidFace(WORDS_TOP[i] ?? ""));
		bottom.position.y = -d;
		bottom.rotation.x = Math.PI / 2;
		group.add(bottom);

		const left = new Mesh(planeGeo, blankFace);
		left.position.x = -d;
		left.rotation.y = -Math.PI / 2;
		group.add(left);

		const right = new Mesh(planeGeo, blankFace);
		right.position.x = d;
		right.rotation.y = Math.PI / 2;
		group.add(right);

		const boxGeo = new BoxGeometry(
			SLOT_CONFIG.cubeSize,
			SLOT_CONFIG.cubeSize,
			SLOT_CONFIG.cubeSize,
		);
		const edges = new LineSegments(
			new EdgesGeometry(boxGeo),
			new LineBasicMaterial({ color: 0x000000 }),
		);
		edges.scale.set(1.002, 1.002, 1.002);
		group.add(edges);

		mainGroup.add(group);
		reels.push({ group, target: 0 });
	});

	let isDragging = false;
	let prevMouse = { x: 0, y: 0 };
	container.addEventListener("pointerdown", (event) => {
		isDragging = true;
		prevMouse = { x: event.clientX, y: event.clientY };
	});
	container.addEventListener("pointermove", (event) => {
		if (!isDragging) return;
		const deltaX = event.clientX - prevMouse.x;
		const deltaY = event.clientY - prevMouse.y;
		mainGroup.rotation.y += deltaX * SLOT_CONFIG.dragSensitivity;
		mainGroup.rotation.x += deltaY * SLOT_CONFIG.dragSensitivity;
		prevMouse = { x: event.clientX, y: event.clientY };
	});
	const stopDrag = (): void => {
		isDragging = false;
	};
	window.addEventListener("pointerup", stopDrag);
	window.addEventListener("pointerleave", stopDrag);
	window.addEventListener("pointercancel", stopDrag);

	const spin = (): void => {
		reels.forEach((reel, i) => {
			const extraSpins = Math.PI * 2 * (3 + i);
			const faceTurn = Math.PI / 2;
			reel.target += extraSpins + faceTurn;
		});
	};
	setInterval(spin, SLOT_CONFIG.spinInterval);

	const resize = (): void => {
		const width = container.clientWidth;
		const height = container.clientHeight;
		if (width === 0 || height === 0) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	};
	window.addEventListener("resize", resize);
	resize();

	const animate = (): void => {
		requestAnimationFrame(animate);
		for (const reel of reels) {
			reel.group.rotation.x = MathUtils.lerp(
				reel.group.rotation.x,
				reel.target,
				SLOT_CONFIG.spinSpeed,
			);
		}
		if (!isDragging) {
			mainGroup.rotation.x = MathUtils.lerp(mainGroup.rotation.x, 0, 0.08);
			mainGroup.rotation.y = MathUtils.lerp(mainGroup.rotation.y, 0, 0.08);
		}
		renderer.render(scene, camera);
	};
	animate();
}
