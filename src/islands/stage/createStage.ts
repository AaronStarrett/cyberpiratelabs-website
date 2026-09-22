import { brand } from "../../../shared/brand";

export type Seat = "office" | "field" | "customer";
export type StagePose = {
  chapter: 0 | 1 | 2 | 3 | 4 | 5;
  connected: boolean;
  decision: "pending" | "approved" | "rejected";
  blocked: boolean;
  seat: Seat;
  scenario: "inspection" | "field-service" | "recurring";
};

export type StageController = {
  setPose: (pose: StagePose) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

type View = {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookZ: number;
  focusX: number;
  focusZ: number;
  routeOpacity: number;
  planeOpacity: number;
};

const roleOrder: Seat[] = ["office", "field", "customer"];
const duration = 640;

/** The DOM carries the product story; this scene only supplies depth and orientation. */
export async function mountStage(
  canvas: HTMLCanvasElement,
  options: { intro: boolean; reduced?: boolean; onReady: () => void; onLost: () => void },
): Promise<StageController> {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setClearColor(brand.shadow, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(brand.shadow);
  scene.fog = new THREE.Fog(brand.shadow, 9, 24);
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 35);
  const disposables = new Set<{ dispose: () => void }>();
  const track = <T extends { dispose: () => void }>(value: T): T => {
    disposables.add(value);
    return value;
  };

  const surfaceMaterial = track(new THREE.MeshBasicMaterial({ color: brand.panel }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(25, 30)), surfaceMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.72, -6);
  scene.add(floor);

  function lineSegments(points: number[], color: string, opacity: number) {
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const material = track(new THREE.LineBasicMaterial({
      color, transparent: true, opacity, depthWrite: false,
    }));
    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    return lines;
  }

  // A receding engineering grid is deliberately weakest behind the reading surface.
  const grid: number[] = [];
  for (let x = -12; x <= 12; x += 0.75) grid.push(x, -0.71, -18, x, -0.71, 7);
  for (let z = -18; z <= 7; z += 0.75) grid.push(-12, -0.71, z, 12, -0.71, z);
  lineSegments(grid, brand.teal, 0.15);

  const deckGeometry = track(new THREE.BoxGeometry(0.7, 0.13, 11));
  const deckMaterial = track(new THREE.MeshBasicMaterial({ color: brand.navy }));
  const edgeMaterial = track(new THREE.LineBasicMaterial({
    color: brand.teal, transparent: true, opacity: 0.22, depthWrite: false,
  }));
  const edgeGeometry = track(new THREE.EdgesGeometry(deckGeometry));
  for (const side of [-1, 1]) {
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(side * 5.45, -0.58, -2.6);
    const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    deck.add(edge);
    scene.add(deck);

    // One lit inner edge gives the deck a physical boundary without emissive glare.
    lineSegments([
      side * 5.08, -0.5, 2.9,
      side * 5.08, -0.5, -7.9,
    ], brand.highlight, 0.12);
  }

  const planeMaterial = track(new THREE.MeshBasicMaterial({
    color: brand.teal, transparent: true, opacity: 0.055,
    side: THREE.DoubleSide, depthWrite: false,
  }));
  const planeGeometry = track(new THREE.PlaneGeometry(2.8, 4.5));
  for (const side of [-1, 1]) {
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(side * 5.6, 0.7, -4.2);
    plane.rotation.set(-0.1, -side * 0.35, 0);
    const outline = new THREE.LineSegments(
      track(new THREE.EdgesGeometry(planeGeometry)),
      track(new THREE.LineBasicMaterial({
        color: brand.teal, transparent: true, opacity: 0.14, depthWrite: false,
      })),
    );
    plane.add(outline);
    scene.add(plane);
  }

  // Three parallel role routes share the same six handoffs as the HTML film.
  const routes = roleOrder.map((seat, index) => {
    const z = 2.05 + index * 0.3;
    const points: number[] = [];
    for (let chapter = 0; chapter < 5; chapter += 1) {
      const x = -3.5 + chapter * 1.4;
      points.push(x, -0.49, z, x + 1.4, -0.49, z);
    }
    points.push(-5.08, -0.49, z - 1.25, -4.3, -0.49, z - 1.25);
    points.push(-4.3, -0.49, z - 1.25, -3.5, -0.49, z);
    points.push(3.5, -0.49, z, 4.3, -0.49, z - 1.25);
    points.push(4.3, -0.49, z - 1.25, 5.08, -0.49, z - 1.25);
    const route = lineSegments(points, brand.teal, 0.1);
    return { seat, route };
  });

  const nodeGeometry = track(new THREE.CircleGeometry(0.036, 12));
  const nodeMaterial = track(new THREE.MeshBasicMaterial({
    color: brand.highlight, transparent: true, opacity: 0.25, depthWrite: false,
  }));
  for (let role = 0; role < 3; role += 1) {
    for (let chapter = 0; chapter < 6; chapter += 1) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.rotation.x = -Math.PI / 2;
      node.position.set(-3.5 + chapter * 1.4, -0.48, 2.05 + role * 0.3);
      scene.add(node);
    }
  }

  const focusMaterial = track(new THREE.MeshBasicMaterial({
    color: brand.teal, transparent: true, opacity: 0.8, depthWrite: false,
  }));
  const focus = new THREE.Mesh(track(new THREE.RingGeometry(0.06, 0.085, 24)), focusMaterial);
  focus.rotation.x = -Math.PI / 2;
  scene.add(focus);
  const focusColor = new THREE.Color(brand.teal);
  const fromColor = new THREE.Color(brand.teal);
  const targetColor = new THREE.Color(brand.teal);

  let desired: StagePose = {
    chapter: 0, connected: false, decision: "pending", blocked: false,
    seat: "office", scenario: "inspection",
  };
  let disposed = false;
  let lost = false;
  let callerPaused = false;
  let inViewport = true;
  let readySent = false;
  let raf = 0;
  let lastFrame = 0;
  let elapsed = duration;
  const current = viewFor(desired);
  let from = { ...current };
  let target = { ...current };
  const lookAt = new THREE.Vector3();

  function viewFor(pose: StagePose): View {
    const role = roleOrder.indexOf(pose.seat);
    const side = role === 1 ? 0.24 : role === 2 ? -0.24 : 0;
    return {
      x: side + (pose.chapter - 2.5) * 0.065,
      y: 3.55 - pose.chapter * 0.045,
      z: 8.5 - pose.chapter * 0.065,
      lookX: side * 0.45,
      lookZ: -1.25 + pose.chapter * 0.045,
      focusX: -3.5 + pose.chapter * 1.4,
      focusZ: 2.05 + role * 0.3,
      routeOpacity: pose.connected ? 0.43 : 0.16,
      planeOpacity: pose.connected ? 0.075 : 0.045,
    };
  }

  function isPaused() {
    return disposed || lost || callerPaused || !inViewport || document.hidden;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
  }

  function kick() {
    if (isPaused() || raf) return;
    raf = requestAnimationFrame(renderFrame);
  }

  function renderFrame(now: number) {
    raf = 0;
    if (isPaused()) {
      lastFrame = 0;
      return;
    }
    if (elapsed < duration) {
      elapsed = options.reduced ? duration : Math.min(duration, elapsed + (lastFrame ? Math.min(now - lastFrame, 50) : 16));
      const progress = elapsed / duration;
      const eased = 1 - Math.pow(1 - progress, 3);
      for (const key of Object.keys(target) as Array<keyof View>) {
        current[key] = from[key] + (target[key] - from[key]) * eased;
      }
      focusColor.copy(fromColor).lerp(targetColor, eased);
    }
    lastFrame = now;
    camera.position.set(current.x, current.y, current.z);
    lookAt.set(current.lookX, -0.1, current.lookZ);
    camera.lookAt(lookAt);
    focus.position.set(current.focusX, -0.47, current.focusZ);
    focusMaterial.color.copy(focusColor);
    planeMaterial.opacity = current.planeOpacity;
    for (const { seat, route } of routes) {
      route.material.opacity = current.routeOpacity * (seat === desired.seat ? 1 : 0.3);
    }
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      options.onReady();
    }
    // No idle loop: a settled scene renders again only after a pose or viewport change.
    if (elapsed < duration) kick();
    else lastFrame = 0;
  }

  function resize() {
    if (disposed || lost) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    kick();
  }

  function onLost(event: Event) {
    event.preventDefault();
    if (disposed || lost) return;
    lost = true;
    readySent = false;
    stop();
    options.onLost();
  }

  function onRestored() {
    if (disposed) return;
    lost = false;
    readySent = false;
    renderer.setClearColor(brand.shadow, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    resize();
  }

  function onVisibility() {
    if (isPaused()) stop();
    else kick();
  }

  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", onVisibility);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting);
      onVisibility();
    }, { threshold: 0 })
    : null;
  intersectionObserver?.observe(canvas);

  if (options.intro && !options.reduced) {
    current.z += 0.25;
    current.y += 0.1;
    from = { ...current };
    elapsed = 0;
  }
  resize();

  return {
    setPose(pose) {
      if (disposed) return;
      if (Object.keys(desired).every((key) => desired[key as keyof StagePose] === pose[key as keyof StagePose])) return;
      desired = { ...pose };
      from = { ...current };
      target = viewFor(pose);
      fromColor.copy(focusColor);
      targetColor.set(pose.blocked || pose.decision === "rejected"
        ? brand.danger
        : pose.decision === "approved" || pose.connected ? brand.signal : brand.teal);
      elapsed = 0;
      lastFrame = 0;
      kick();
    },
    setPaused(paused) {
      if (disposed) return;
      callerPaused = paused;
      onVisibility();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      for (const resource of disposables) resource.dispose();
      scene.clear();
      renderer.dispose();
    },
  };
}
