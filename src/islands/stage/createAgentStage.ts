import type { AgentMode } from "../../../shared/agents/fixtures";

export type AgentStagePose = { mode: AgentMode; progress: number; complete: boolean };
export type AgentStageController = {
  setPose: (pose: AgentStagePose) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

/** Purely decorative geometry. All conversation content is semantic HTML. */
export async function mountAgentStage(
  canvas: HTMLCanvasElement,
  options: { onReady: () => void; onLost: () => void; reduced?: boolean },
): Promise<AgentStageController> {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x071b2b, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 45);
  camera.position.set(0, 1.35, 11);
  const resources = new Set<{ dispose: () => void }>();
  const track = <T extends { dispose: () => void }>(resource: T): T => {
    resources.add(resource);
    return resource;
  };
  const metal = track(new THREE.MeshPhysicalMaterial({
    color: 0xb3e5dc, metalness: 0.65, roughness: 0.28, clearcoat: 1,
  }));
  const navy = track(new THREE.MeshPhysicalMaterial({
    color: 0x082a3d, metalness: 0.26, roughness: 0.22, clearcoat: 1,
  }));
  const screen = track(new THREE.MeshPhysicalMaterial({
    color: 0x0c4754, emissive: 0x06313a, emissiveIntensity: 0.45,
    metalness: 0.05, roughness: 0.15, clearcoat: 1,
  }));
  const glass = track(new THREE.MeshPhysicalMaterial({
    color: 0x9df8df, transparent: true, opacity: 0.28,
    metalness: 0.03, roughness: 0.12, clearcoat: 1,
    transmission: 0.15, thickness: 0.2, depthWrite: false,
  }));
  const frosted = track(new THREE.MeshPhysicalMaterial({
    color: 0xdafcf5, transparent: true, opacity: 0.7,
    roughness: 0.35, metalness: 0.02, clearcoat: 0.6,
  }));
  const cyan = track(new THREE.MeshStandardMaterial({
    color: 0x67efce, emissive: 0x30bea7, emissiveIntensity: 0.35,
    roughness: 0.25, metalness: 0.3,
  }));

  function roundedGeometry(width: number, height: number, radius: number, depth: number) {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return track(new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 3,
      steps: 1, bevelSize: 0.024, bevelThickness: 0.024, curveSegments: 10,
    }));
  }

  const phone = new THREE.Group();
  const shell = new THREE.Mesh(roundedGeometry(1.62, 3.25, 0.23, 0.16), metal);
  const face = new THREE.Mesh(roundedGeometry(1.48, 3.1, 0.2, 0.025), navy);
  face.position.z = 0.17;
  const display = new THREE.Mesh(roundedGeometry(1.36, 2.89, 0.17, 0.013), screen);
  display.position.z = 0.205;
  const cameraIsland = new THREE.Mesh(roundedGeometry(0.49, 0.115, 0.056, 0.013), navy);
  cameraIsland.position.set(0, 1.3, 0.235);
  const speaker = new THREE.Mesh(roundedGeometry(0.26, 0.028, 0.013, 0.01), metal);
  speaker.position.set(-0.06, 1.3, 0.253);
  const cameraLens = new THREE.Mesh(track(new THREE.SphereGeometry(0.025, 12, 8)), screen);
  cameraLens.position.set(0.15, 1.3, 0.253);
  const button = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.37, 0.075)), metal);
  button.position.set(0.837, 0.53, 0.1);
  const homeBar = new THREE.Mesh(roundedGeometry(0.43, 0.025, 0.012, 0.007), frosted);
  homeBar.position.set(0, -1.38, 0.24);
  phone.add(shell, face, display, cameraIsland, speaker, cameraLens, button, homeBar);
  phone.position.set(-2.18, 0.16, 0.45);
  phone.rotation.set(-0.075, 0.3, -0.085);
  scene.add(phone);

  const chat = new THREE.Group();
  const chatBody = new THREE.Mesh(roundedGeometry(3.07, 2.7, 0.16, 0.07), glass);
  const rim = new THREE.LineSegments(
    track(new THREE.EdgesGeometry(chatBody.geometry, 30)),
    track(new THREE.LineBasicMaterial({ color: 0x98f9e0, transparent: true, opacity: 0.58 })),
  );
  chat.add(chatBody, rim);
  chat.position.set(1.65, 0.36, -0.4);
  chat.rotation.set(0.035, -0.26, 0.035);
  scene.add(chat);

  const inquiry = new THREE.Group();
  const resultBody = new THREE.Mesh(roundedGeometry(1.9, 1.98, 0.13, 0.07), frosted);
  inquiry.add(resultBody);
  inquiry.position.set(3.12, -0.73, 0.86);
  inquiry.rotation.set(-0.07, -0.3, -0.04);
  scene.add(inquiry);

  const base = new THREE.Mesh(
    track(new THREE.CylinderGeometry(4.15, 4.4, 0.14, 64)),
    track(new THREE.MeshPhysicalMaterial({
      color: 0x145268, transparent: true, opacity: 0.48, roughness: 0.34, metalness: 0.2,
    })),
  );
  base.position.set(0.25, -1.69, -0.2);
  scene.add(base);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.2, -1.5, 0.3),
    new THREE.Vector3(0.2, -1.45, 0.3),
    new THREE.Vector3(1.5, -1.2, 0.65),
    new THREE.Vector3(2.5, -1.2, 0.9),
  ]);
  const route = new THREE.Mesh(track(new THREE.TubeGeometry(path, 32, 0.018, 6, false)), cyan);
  scene.add(route);
  const signal = new THREE.Mesh(track(new THREE.SphereGeometry(0.07, 14, 10)), cyan);
  scene.add(signal);

  scene.add(new THREE.HemisphereLight(0xd4fff1, 0x082234, 2.4));
  const key = new THREE.DirectionalLight(0xc8fff3, 5);
  key.position.set(-4, 5, 5);
  scene.add(key);
  const rimLight = new THREE.DirectionalLight(0x29d2e8, 4);
  rimLight.position.set(4, 1, -3);
  scene.add(rimLight);
  const fill = new THREE.PointLight(0xbdfdf2, 16, 13, 2);
  fill.position.set(0, 2, 4);
  scene.add(fill);

  let pose: AgentStagePose = { mode: "voice", progress: 0, complete: false };
  let disposed = false;
  let lost = false;
  let paused = Boolean(options.reduced);
  let inView = true;
  let raf = 0;
  let elapsed = 1000;
  let lastTime = 0;
  let current = {
    cameraX: 0, cameraZ: 11, phoneY: 0.3, phoneZ: 0.122, phoneScale: 1,
    chatY: -0.087, chatZ: -0.026, resultY: -0.157, resultZ: 0.035,
  };
  let from = { ...current };
  let target = { ...current };
  const signalPoint = new THREE.Vector3();

  const alignmentRay = new THREE.Vector3();
  const alignmentPoint = new THREE.Vector3();
  const alignmentRight = new THREE.Vector3();
  const alignmentTop = new THREE.Vector3();

  function screenPoint(x: number, y: number, z: number, destination: import("three").Vector3) {
    alignmentRay.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
    const distance = (z - camera.position.z) / alignmentRay.z;
    return destination.copy(camera.position).addScaledVector(alignmentRay, distance);
  }

  function alignInterface(
    group: import("three").Group,
    selector: string,
    width: number,
    height: number,
    depth: number,
    rotationY: number,
    rotationZ: number,
    bounds: DOMRect,
    scale = 1,
  ) {
    const element = canvas.parentElement?.querySelector<HTMLElement>(selector);
    if (!element || !bounds.width || !bounds.height) return;
    const rect = element.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 2 - 1;
    const y = 1 - ((rect.top + rect.height / 2 - bounds.top) / bounds.height) * 2;
    screenPoint(x, y, depth, alignmentPoint);
    screenPoint(x + element.offsetWidth * scale / bounds.width, y, depth, alignmentRight);
    screenPoint(x, y + element.offsetHeight * scale / bounds.height, depth, alignmentTop);
    group.position.copy(alignmentPoint);
    group.scale.set(
      alignmentRight.distanceTo(alignmentPoint) * 2 / width * 1.045,
      alignmentTop.distanceTo(alignmentPoint) * 2 / height * 1.025,
      1,
    );
    group.rotation.set(-0.025, rotationY, rotationZ);
  }

  function apply() {
    camera.position.x = current.cameraX;
    camera.position.z = current.cameraZ;
    camera.lookAt(0.25, 0.02, 0);
    camera.updateMatrixWorld();
    const bounds = canvas.getBoundingClientRect();
    // Physical shells follow the semantic interfaces rather than duplicating them.
    // Projected positions preserve one readable conversation composition at every size.
    alignInterface(phone, ".agent-phone", 1.62, 3.25, 0.35,
      current.phoneY, current.phoneZ, bounds, current.phoneScale);
    alignInterface(chat, ".agent-conversation", 3.07, 2.7, 0.2,
      current.chatY, current.chatZ, bounds);
    alignInterface(inquiry, ".agent-result", 1.9, 1.98, 0.5,
      current.resultY, current.resultZ, bounds);
    path.getPoint(Math.min(1, Math.max(0, pose.progress)), signalPoint);
    signal.position.copy(signalPoint);
    signal.visible = pose.progress > 0 && !pose.complete && !paused;
    route.visible = pose.progress > 0;
    renderer.render(scene, camera);
  }

  function frame(time: number) {
    raf = 0;
    if (disposed || lost || !inView || document.hidden) return;
    const delta = lastTime ? Math.min(time - lastTime, 50) : 0;
    lastTime = time;
    elapsed = paused ? 1000 : Math.min(1000, elapsed + delta);
    const t = elapsed / 1000;
    const eased = 1 - Math.pow(1 - t, 3);
    for (const key of Object.keys(current) as (keyof typeof current)[]) {
      current[key] = from[key] + (target[key] - from[key]) * eased;
    }
    apply();
    if (elapsed < 1000) raf = requestAnimationFrame(frame);
  }

  function requestFrame() {
    if (!raf && !disposed && !lost && inView && !document.hidden) {
      lastTime = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    requestFrame();
  });
  resizeObserver.observe(canvas);
  const observer = new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting);
    if (inView) requestFrame();
    else { cancelAnimationFrame(raf); raf = 0; }
  });
  observer.observe(canvas);
  const visibility = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else requestFrame();
  };
  document.addEventListener("visibilitychange", visibility);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    options.onLost();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  requestFrame();
  options.onReady();

  return {
    setPose(next) {
      const changed = pose.mode !== next.mode || pose.complete !== next.complete;
      pose = next;
      if (changed) {
        from = { ...current };
        target = {
          phoneY: next.mode === "chat" ? 0.52 : 0.3,
          phoneZ: next.mode === "chat" ? 0.19 : 0.122,
          phoneScale: next.mode === "chat" ? 0.89 : 1,
          chatY: next.mode === "chat" ? 0.035 : -0.087,
          chatZ: next.mode === "chat" ? 0.017 : -0.026,
          resultY: next.complete ? 0 : -0.157,
          resultZ: next.complete ? 0 : 0.035,
          cameraX: next.complete ? 0.35 : next.mode === "voice" ? 0 : 0.2,
          cameraZ: next.complete ? 10.6 : 11,
        };
        elapsed = 0;
      }
      requestFrame();
    },
    setPaused(next) {
      paused = next || Boolean(options.reduced);
      if (paused) { current = { ...target }; elapsed = 1000; }
      requestFrame();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", contextLost);
      for (const resource of resources) resource.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}