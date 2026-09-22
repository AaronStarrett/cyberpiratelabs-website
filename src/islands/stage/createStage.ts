import { brand } from "../../../shared/brand";

export type Seat = "office" | "field" | "customer";
export type StagePose = {
  chapter: 0 | 1 | 2 | 3;
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

type Rig = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
  show: boolean;
};

const CAM: Record<Seat, Array<{ pos: [number, number, number]; look: [number, number, number] }>> = {
  office: [
    { pos: [0.15, 2.5, 3.75], look: [0, 0.28, 0.05] },
    { pos: [-0.15, 2.25, 3.4], look: [0.1, 0.34, -0.45] },
    { pos: [1.85, 1.95, 3.1], look: [1.15, 0.45, -0.08] },
    { pos: [-0.3, 2.2, 3.2], look: [-0.08, 0.4, 0.08] },
  ],
  field: [
    { pos: [0.45, 1.75, 3.05], look: [0.15, 0.22, 0.15] },
    { pos: [0.55, 1.7, 2.85], look: [0.35, 0.28, -0.2] },
    { pos: [2.2, 1.28, 2.2], look: [1.15, 0.42, -0.02] },
    { pos: [0.7, 1.6, 2.55], look: [0.25, 0.38, 0.12] },
  ],
  customer: [
    { pos: [-2.55, 2.35, 3.25], look: [0.05, 0.32, 0.08] },
    { pos: [-2.2, 2.2, 2.95], look: [0.15, 0.36, -0.15] },
    { pos: [-1.15, 1.85, 3.25], look: [0.75, 0.42, 0.02] },
    { pos: [-1.9, 1.95, 2.65], look: [-0.05, 0.42, 0.16] },
  ],
};

export async function mountStage(
  canvas: HTMLCanvasElement,
  options: { intro: boolean; reduced?: boolean; onReady: () => void; onLost: () => void },
): Promise<StageController> {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setClearColor(brand.shadow, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(brand.shadow);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);

  const hemi = new THREE.HemisphereLight(brand.highlight, brand.shadow, 0.85);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(brand.highlight, 1.35);
  key.position.set(4.2, 7.2, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.8;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.00035;
  scene.add(key);
  const fill = new THREE.DirectionalLight(brand.teal, 0.42);
  fill.position.set(-4.5, 2.4, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(brand.signal, 0.22);
  rim.position.set(-3.2, 2.6, -2.2);
  scene.add(rim);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(value: T): T => {
    disposables.push(value);
    return value;
  };

  const satin = (color: string, roughness: number, metalness = 0.08, extra: Record<string, unknown> = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
  const matte = (color: string, roughness = 0.82) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 }));

  const grain = paintGrain();
  const grainTex = track(new THREE.CanvasTexture(grain));
  grainTex.wrapS = THREE.RepeatWrapping;
  grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.repeat.set(5, 5);
  grainTex.colorSpace = THREE.NoColorSpace;

  const table = new THREE.Mesh(
    track(new THREE.BoxGeometry(8.4, 0.22, 5.1)),
    satin(brand.navy, 0.42, 0.18, { roughnessMap: grainTex }),
  );
  table.position.y = -0.11;
  table.receiveShadow = true;
  scene.add(table);

  const mat = new THREE.Mesh(track(new THREE.BoxGeometry(6.3, 0.03, 3.35)), satin(brand.teal, 0.58, 0.06));
  mat.position.y = 0.012;
  mat.receiveShadow = true;
  scene.add(mat);

  const backdropCanvas = paintBackdrop();
  const backdropTex = track(new THREE.CanvasTexture(backdropCanvas));
  backdropTex.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(
    track(new THREE.PlaneGeometry(16, 9)),
    track(new THREE.MeshBasicMaterial({ map: backdropTex })),
  );
  backdrop.position.set(0, 2.4, -3.6);
  scene.add(backdrop);

  function cardGeometry(width: number, height: number) {
    const shape = new THREE.Shape();
    const r = 0.07;
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const geo = track(new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 6,
    }));
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    if (box) geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    return geo;
  }

  const cardGeo = cardGeometry(0.78, 1.02);
  const cardColors = [brand.plate, brand.highlight, brand.plate, brand.highlight];
  const rigs = new Map<string, { object: import("three").Object3D; rig: Rig }>();

  function addRig(name: string, object: import("three").Object3D, rig: Rig) {
    scene.add(object);
    rigs.set(name, { object, rig });
  }

  const cards: import("three").Group[] = [];
  cardColors.forEach((color, index) => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(cardGeo, matte(color, 0.78));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (index === 1) {
      const chip = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.03, 0.12)), matte(brand.signal, 0.45));
      chip.position.set(0.2, 0.045, -0.34);
      chip.castShadow = true;
      group.add(chip);
    }
    cards.push(group);
    addRig(`card${index}`, group, { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, show: true });
  });

  const tray = new THREE.Mesh(track(new THREE.BoxGeometry(3.15, 0.06, 1.28)), satin(brand.teal, 0.42, 0.12));
  tray.castShadow = true;
  tray.receiveShadow = true;
  addRig("tray", tray, { x: 0, y: 0.03, z: 0.08, rx: 0, ry: 0, rz: 0, s: 1, show: true });

  const rail = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 0.035, 0.08)), satin(brand.signal, 0.32, 0.18, { emissive: new THREE.Color(brand.teal), emissiveIntensity: 0.18 }));
  rail.castShadow = true;
  addRig("rail", rail, { x: 0, y: 0.05, z: 0.82, rx: 0, ry: 0, rz: 0, s: 1, show: true });

  const folder = new THREE.Group();
  const folderBody = new THREE.Mesh(track(new THREE.BoxGeometry(1.15, 0.08, 0.82)), satin(brand.teal, 0.46, 0.08));
  folderBody.castShadow = true;
  folderBody.receiveShadow = true;
  folder.add(folderBody);
  const tab = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.05, 0.16)), satin(brand.signal, 0.4, 0.06));
  tab.position.set(-0.28, 0.05, -0.34);
  folder.add(tab);
  const stamp = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24)), satin(brand.teal, 0.38, 0.12));
  stamp.position.set(0.22, 0.1, 0.05);
  stamp.castShadow = true;
  folder.add(stamp);
  addRig("folder", folder, { x: 0.2, y: 0.04, z: -0.95, rx: 0, ry: -0.08, rz: 0, s: 1, show: true });

  const latch = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.18, 1.15)), satin(brand.danger, 0.4, 0.08));
  latch.castShadow = true;
  addRig("latch", latch, { x: 0.95, y: 0.16, z: -0.15, rx: 0, ry: 0.2, rz: 0, s: 0, show: false });

  const house = buildHouse(THREE, satin, matte, track);
  const van = buildVan(THREE, satin, matte, track);
  const shops = buildShops(THREE, satin, matte, track);
  addRig("house", house, { x: 1.45, y: 0, z: -0.15, rx: 0, ry: -0.4, rz: 0, s: 1, show: true });
  addRig("van", van, { x: 1.45, y: 0, z: -0.15, rx: 0, ry: 0.5, rz: 0, s: 0, show: false });
  addRig("shops", shops, { x: 1.45, y: 0, z: -0.15, rx: 0, ry: -0.2, rz: 0, s: 0, show: false });

  const sketches = {
    inspection: track(new THREE.CanvasTexture(paintSketch("roof"))),
    "field-service": track(new THREE.CanvasTexture(paintSketch("mech"))),
    recurring: track(new THREE.CanvasTexture(paintSketch("lot"))),
  };
  for (const tex of Object.values(sketches)) tex.colorSpace = THREE.SRGBColorSpace;
  const sketchMat = track(new THREE.MeshStandardMaterial({ map: sketches.inspection, roughness: 0.72 }));
  const sketch = new THREE.Group();
  const sketchFrame = new THREE.Mesh(track(new THREE.BoxGeometry(0.92, 0.04, 0.72)), satin(brand.navy, 0.5, 0.1));
  const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(0.78, 0.58)), sketchMat);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.03;
  sketch.add(sketchFrame, plate);
  addRig("sketch", sketch, { x: 0.1, y: 0.02, z: 0.9, rx: 0, ry: 0.15, rz: 0, s: 0, show: false });

  const booklet = new THREE.Group();
  const cover = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 0.07, 1.2)), matte(brand.plate, 0.7));
  cover.castShadow = true;
  const spine = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.09, 1.2)), satin(brand.teal, 0.4, 0.1));
  spine.position.x = -0.46;
  const pageTex = track(new THREE.CanvasTexture(paintPages()));
  pageTex.colorSpace = THREE.SRGBColorSpace;
  const page = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.72, 0.96)),
    track(new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.8 })),
  );
  page.rotation.x = -Math.PI / 2;
  page.position.y = 0.05;
  const signalEdge = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.04, 0.1, 1.2)),
    track(new THREE.MeshStandardMaterial({ color: brand.signal, emissive: brand.teal, emissiveIntensity: 0.2, roughness: 0.45 })),
  );
  signalEdge.position.x = 0.48;
  booklet.add(cover, spine, page, signalEdge);
  addRig("booklet", booklet, { x: -0.2, y: 0.04, z: 0.15, rx: 0, ry: 0.2, rz: 0, s: 0.8, show: true });

  let desired: StagePose = {
    chapter: 0,
    connected: false,
    decision: "pending",
    blocked: false,
    seat: "office",
    scenario: "inspection",
  };
  let paused = false;
  let running = false;
  let raf = 0;
  let last = performance.now();
  const reducedMotion = options.reduced === true;
  let intro = options.intro && !reducedMotion ? 1 : 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let readySent = false;
  let lost = false;
  const camPos = new THREE.Vector3(0.2, 2.8, 4.4);
  const look = new THREE.Vector3(0, 0.3, 0);
  const lookTarget = new THREE.Vector3();

  function applyPose(pose: StagePose) {
    const scattered: Array<[number, number, number, number, number, number]> = [
      [-1.75, 0.02, 0.9, 0.04, 0.62, 0.12],
      [-0.2, 0.05, -0.05, 0.08, -0.48, 0.04],
      [1.35, 0.02, 0.62, -0.05, 0.38, 0.1],
      [0.4, 0.07, 1.2, 0.12, -0.95, -0.08],
    ];
    const organized: Array<[number, number, number, number, number, number]> = [
      [-1.05, 0.045, 0.08, 0, 0.03, 0],
      [-0.35, 0.05, 0.05, 0, -0.02, 0],
      [0.35, 0.045, 0.07, 0, 0.025, 0],
      [1.05, 0.045, 0.04, 0, -0.015, 0],
    ];
    const cardPose = pose.connected ? organized : scattered;
    cards.forEach((_, index) => {
      const [x, y, z, rx, ry, rz] = cardPose[index]!;
      setRig(`card${index}`, { x: x!, y: y!, z: z!, rx: rx!, ry: ry!, rz: rz!, s: 1, show: true });
    });
    setRig("tray", { x: 0, y: 0.03, z: pose.connected ? 0.08 : 0.35, rx: 0, ry: 0, rz: 0, s: pose.connected ? 1 : 0.92, show: true });
    setRig("rail", { x: 0, y: 0.055, z: 0.84, rx: 0, ry: 0, rz: 0, s: pose.connected ? 1 : 0.02, show: pose.connected });

    const folderPose: Record<number, Rig> = {
      0: { x: 2.15, y: 0.04, z: -1.15, rx: 0, ry: -0.2, rz: 0, s: 0.82, show: true },
      1: { x: 0.05, y: 0.045, z: -0.95, rx: 0, ry: -0.06, rz: 0, s: 1, show: true },
      2: { x: -1.65, y: 0.04, z: -0.72, rx: 0, ry: 0.15, rz: 0, s: 0.88, show: true },
      3: { x: -1.85, y: 0.04, z: -0.45, rx: 0, ry: 0.25, rz: 0, s: 0.84, show: true },
    };
    setRig("folder", folderPose[pose.chapter]!);
    const stampColor = pose.decision === "approved" ? brand.signal : pose.decision === "rejected" ? brand.danger : brand.teal;
    (stamp.material as import("three").MeshStandardMaterial).color.set(stampColor);
    stamp.position.y = pose.decision === "pending" ? 0.16 : 0.09;

    const work = pose.chapter >= 2 ? 1 : 0.72;
    const workX = pose.chapter >= 2 ? 1.35 : 2.25;
    const showHouse = pose.scenario === "inspection";
    const showVan = pose.scenario === "field-service";
    const showShops = pose.scenario === "recurring";
    setRig("house", { x: workX, y: 0, z: -0.12, rx: 0, ry: -0.45, rz: 0, s: showHouse ? work : 0.001, show: showHouse });
    setRig("van", { x: workX, y: 0, z: -0.12, rx: 0, ry: 0.55, rz: 0, s: showVan ? work : 0.001, show: showVan });
    setRig("shops", { x: workX, y: 0, z: -0.12, rx: 0, ry: -0.25, rz: 0, s: showShops ? work : 0.001, show: showShops });
    setRig("latch", {
      x: 0.85,
      y: 0.18,
      z: -0.2,
      rx: 0,
      ry: 0.15,
      rz: 0,
      s: pose.blocked ? 1 : 0.001,
      show: pose.blocked,
    });
    setRig("sketch", {
      x: pose.chapter >= 2 ? 0.05 : 1.8,
      y: 0.03,
      z: pose.chapter >= 2 ? 0.95 : 1.3,
      rx: 0,
      ry: 0.18,
      rz: 0,
      s: pose.chapter >= 2 ? 1 : 0.4,
      show: pose.chapter >= 2,
    });
    sketchMat.map = sketches[pose.scenario];
    sketchMat.needsUpdate = true;
    setRig("booklet", {
      x: pose.chapter >= 3 ? -0.15 : -2.15,
      y: 0.04,
      z: pose.chapter >= 3 ? 0.12 : 0.55,
      rx: 0,
      ry: pose.chapter >= 3 ? 0.18 : 0.4,
      rz: 0,
      s: pose.chapter >= 3 ? 1 : 0.72,
      show: true,
    });
    rim.intensity = pose.seat === "customer" ? 0.48 : 0.22;
    const edge = signalEdge.material as import("three").MeshStandardMaterial;
    edge.emissiveIntensity = pose.seat === "customer" ? 0.55 : 0.12;
  }

  function setRig(name: string, rig: Rig) {
    const found = rigs.get(name);
    if (found) found.rig = rig;
  }

  function resize() {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;
    const ratio = Math.min(window.devicePixelRatio || 1, width < 800 ? 1.25 : 1.5);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    kick();
  });
  resizeObserver.observe(canvas);
  resize();

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    kick();
  }
  function onPointerLeave() {
    pointerTargetX = 0;
    pointerTargetY = 0;
    kick();
  }
  if (!reducedMotion) {
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
  }

  function onLost(event: Event) {
    event.preventDefault();
    if (lost) return;
    lost = true;
    paused = true;
    options.onLost();
  }
  canvas.addEventListener("webglcontextlost", onLost);

  function renderFrame(now: number) {
    if (paused || lost) {
      running = false;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (reducedMotion) {
      intro = 0;
      pointerX = 0;
      pointerY = 0;
      pointerTargetX = 0;
      pointerTargetY = 0;
    } else if (intro > 0) intro = Math.max(0, intro - dt / 1.15);
    if (!reducedMotion) {
      pointerX += (pointerTargetX - pointerX) * (1 - Math.exp(-3.2 * dt));
      pointerY += (pointerTargetY - pointerY) * (1 - Math.exp(-3.2 * dt));
    }

    let settled = intro === 0 && Math.abs(pointerX - pointerTargetX) < 0.01 && Math.abs(pointerY - pointerTargetY) < 0.01;
    const lambda = reducedMotion ? 1 : 1 - Math.exp(-4.8 * dt);
    for (const { object, rig } of rigs.values()) {
      object.visible = rig.show || object.scale.x > 0.02;
      object.position.x += (rig.x - object.position.x) * lambda;
      object.position.y += (rig.y - object.position.y) * lambda;
      object.position.z += (rig.z - object.position.z) * lambda;
      object.rotation.x += (rig.rx - object.rotation.x) * lambda;
      object.rotation.y += (rig.ry - object.rotation.y) * lambda;
      object.rotation.z += (rig.rz - object.rotation.z) * lambda;
      const scale = rig.show ? rig.s : 0.001;
      object.scale.setScalar(object.scale.x + (scale - object.scale.x) * lambda);
      if (Math.abs(object.position.x - rig.x) > 0.01 || Math.abs(object.scale.x - scale) > 0.02) settled = false;
    }

    const shot = CAM[desired.seat][desired.chapter]!;
    const pull = intro;
    const sway = reducedMotion ? 0 : 1;
    const tx = shot.pos[0] + pointerX * 0.16 * sway;
    const ty = shot.pos[1] + pull * 0.38 - pointerY * 0.08 * sway;
    const tz = shot.pos[2] + pull * 0.85;
    const camLerp = reducedMotion ? 1 : 1 - Math.exp(-3 * dt);
    camPos.x += (tx - camPos.x) * camLerp;
    camPos.y += (ty - camPos.y) * camLerp;
    camPos.z += (tz - camPos.z) * camLerp;
    lookTarget.set(shot.look[0], shot.look[1], shot.look[2]);
    look.lerp(lookTarget, camLerp);
    camera.position.copy(camPos);
    camera.lookAt(look);
    if (camPos.distanceTo(new THREE.Vector3(tx, ty, tz)) > 0.02) settled = false;

    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      options.onReady();
    }
    if (!settled) raf = requestAnimationFrame(renderFrame);
    else running = false;
  }

  function kick() {
    if (paused || lost || running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(renderFrame);
  }

  applyPose(desired);
  for (const { object, rig } of rigs.values()) {
    object.position.set(rig.x, rig.y, rig.z);
    object.rotation.set(rig.rx, rig.ry, rig.rz);
    object.scale.setScalar(rig.show ? rig.s : 0.001);
    object.visible = rig.show;
  }
  kick();

  return {
    setPose(pose) {
      desired = pose;
      applyPose(pose);
      kick();
    },
    setPaused(next) {
      paused = next || lost;
      if (!paused) kick();
    },
    dispose() {
      paused = true;
      lost = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      if (!reducedMotion) {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
      }
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
  };
}

function paintGrain() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const image = ctx.createImageData(256, 256);
  let seed = 42;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const tone = 90 + (seed % 80);
    image.data[i] = tone;
    image.data[i + 1] = tone;
    image.data[i + 2] = tone;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function paintBackdrop() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, brand.teal);
  gradient.addColorStop(0.55, brand.shadow);
  gradient.addColorStop(1, brand.navy);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

function paintPages() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = brand.plate;
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = brand.teal;
  ctx.lineWidth = 3;
  for (let y = 36; y < 290; y += 22) {
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(228, y);
    ctx.stroke();
  }
  ctx.strokeStyle = brand.signal;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(90, 28);
  ctx.stroke();
  return canvas;
}

function paintSketch(kind: "roof" | "mech" | "lot") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = brand.plate;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = brand.navy;
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  if (kind === "roof") {
    ctx.strokeRect(90, 150, 320, 220);
    ctx.beginPath();
    ctx.moveTo(90, 150);
    ctx.lineTo(250, 70);
    ctx.lineTo(410, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(250, 70);
    ctx.lineTo(250, 370);
    ctx.stroke();
  } else if (kind === "mech") {
    ctx.strokeRect(120, 90, 260, 300);
    ctx.strokeRect(170, 150, 160, 90);
    ctx.beginPath();
    ctx.arc(250, 300, 46, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(70, 80, 360, 320);
    for (let i = 0; i < 3; i += 1) ctx.strokeRect(110 + i * 100, 140, 70, 160);
    ctx.beginPath();
    ctx.moveTo(70, 280);
    ctx.lineTo(430, 280);
    ctx.stroke();
  }
  ctx.strokeStyle = brand.signal;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(kind === "mech" ? 250 : 320, kind === "lot" ? 220 : 210, 34, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

function buildHouse(
  THREE: typeof import("three"),
  satin: (color: string, roughness: number, metalness?: number, extra?: Record<string, unknown>) => import("three").Material,
  matte: (color: string, roughness?: number) => import("three").Material,
  track: <T extends { dispose: () => void }>(value: T) => T,
) {
  const group = new THREE.Group();
  const walls = new THREE.Mesh(track(new THREE.BoxGeometry(1.15, 0.72, 0.86)), matte(brand.highlight, 0.84));
  walls.position.y = 0.36;
  walls.castShadow = true;
  walls.receiveShadow = true;
  const roof = new THREE.Mesh(track(new THREE.BoxGeometry(1.28, 0.12, 0.98)), satin(brand.navy, 0.4, 0.16));
  roof.position.y = 0.78;
  roof.castShadow = true;
  const glass = track(new THREE.MeshStandardMaterial({ color: brand.highlight, roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.62 }));
  const windowMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.22, 0.04)), glass);
  windowMesh.position.set(-0.22, 0.42, 0.44);
  const door = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.36, 0.04)), matte(brand.navy, 0.7));
  door.position.set(0.22, 0.2, 0.44);
  group.add(walls, roof, windowMesh, door);
  return group;
}

function buildVan(
  THREE: typeof import("three"),
  satin: (color: string, roughness: number, metalness?: number, extra?: Record<string, unknown>) => import("three").Material,
  matte: (color: string, roughness?: number) => import("three").Material,
  track: <T extends { dispose: () => void }>(value: T) => T,
) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(track(new THREE.BoxGeometry(1.45, 0.48, 0.7)), satin(brand.navy, 0.42, 0.2));
  body.position.y = 0.42;
  body.castShadow = true;
  const cabin = new THREE.Mesh(track(new THREE.BoxGeometry(0.48, 0.38, 0.66)), satin(brand.teal, 0.38, 0.16));
  cabin.position.set(-0.48, 0.68, 0);
  cabin.castShadow = true;
  const beacon = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 0.08, 0.12)), matte(brand.signal, 0.35));
  beacon.position.set(0.2, 0.72, 0);
  const wheelGeo = track(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16));
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = matte(brand.shadow, 0.7);
  for (const x of [-0.42, 0.46]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, 0.14, 0.32);
    group.add(wheel);
  }
  group.add(body, cabin, beacon);
  return group;
}

function buildShops(
  THREE: typeof import("three"),
  satin: (color: string, roughness: number, metalness?: number, extra?: Record<string, unknown>) => import("three").Material,
  matte: (color: string, roughness?: number) => import("three").Material,
  track: <T extends { dispose: () => void }>(value: T) => T,
) {
  const group = new THREE.Group();
  const block = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 0.55, 0.7)), matte(brand.highlight, 0.8));
  block.position.y = 0.28;
  block.castShadow = true;
  const colors = [brand.teal, brand.signal, brand.navy];
  colors.forEach((color, index) => {
    const awning = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.08, 0.28)), satin(color, 0.4, 0.08));
    awning.position.set(-0.52 + index * 0.52, 0.5, 0.32);
    awning.castShadow = true;
    group.add(awning);
  });
  group.add(block);
  return group;
}
