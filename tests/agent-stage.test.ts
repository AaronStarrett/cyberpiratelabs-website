import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountAgentStage } from "../src/islands/stage/createAgentStage";

const rendererState = vi.hoisted(() => ({
  frames: [] as { camera: number[]; surfaces: number[][] }[],
  disposed: 0,
  contextsReleased: 0,
}));
vi.mock("three", async () => {
  const three = await vi.importActual<typeof import("three")>("three");
  return {
    ...three,
    WebGLRenderer: class {
      setPixelRatio() {}
      setClearColor() {}
      setSize() {}
      render(scene: import("three").Scene, camera: import("three").Camera) {
        rendererState.frames.push({
          camera: camera.position.toArray(),
          surfaces: scene.children.filter((child) => child instanceof three.Group)
            .map((child) => [...child.position.toArray(), ...child.rotation.toArray().slice(0, 3)] as number[]),
        });
      }
      dispose() { rendererState.disposed += 1; }
      forceContextLoss() { rendererState.contextsReleased += 1; }
    },
  };
});

type IntersectionCallback = (entries: { isIntersecting: boolean }[]) => void;
let queued: Map<number, FrameRequestCallback>;
let observerCallbacks: IntersectionCallback[];
let disconnected: boolean[];
let stageDocument: EventTarget & { hidden: boolean };
let nextId: number;

function flushFrame(time: number) {
  const callbacks = [...queued.values()];
  queued.clear();
  callbacks.forEach((callback) => callback(time));
}

function canvasSurface() {
  const rectangles: Record<string, { left: number; top: number; width: number; height: number }> = {
    ".agent-phone": { left: 52, top: 89, width: 207, height: 367 },
    ".agent-conversation": { left: 260, top: 51, width: 380, height: 437 },
    ".agent-result": { left: 696, top: 109, width: 270, height: 350 },
  };
  return Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 660 }),
    parentElement: {
      querySelector: (selector: string) => {
        const rectangle = rectangles[selector];
        return rectangle ? {
          offsetWidth: rectangle.width, offsetHeight: rectangle.height,
          getBoundingClientRect: () => rectangle,
        } : null;
      },
    },
  }) as unknown as HTMLCanvasElement;
}

describe("Three scene motion lifetime (real geometry, stubbed renderer)", () => {
  beforeEach(() => {
    queued = new Map();
    observerCallbacks = [];
    disconnected = [];
    stageDocument = Object.assign(new EventTarget(), { hidden: false });
    nextId = 0;
    rendererState.frames = [];
    rendererState.disposed = 0;
    rendererState.contextsReleased = 0;
    vi.stubGlobal("window", { devicePixelRatio: 2 });
    vi.stubGlobal("document", stageDocument);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      nextId += 1;
      queued.set(nextId, callback);
      return nextId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => queued.delete(id));
    vi.stubGlobal("ResizeObserver", class {
      index = disconnected.push(false) - 1;
      constructor(private callback: () => void) {}
      observe() { this.callback(); }
      disconnect() { disconnected[this.index] = true; }
    });
    vi.stubGlobal("IntersectionObserver", class {
      index = disconnected.push(false) - 1;
      constructor(callback: IntersectionCallback) { observerCallbacks.push(callback); }
      observe() {}
      disconnect() { disconnected[this.index] = true; }
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("freezes camera and physical surfaces when paused, then resumes without a time jump", async () => {
    const controller = await mountAgentStage(canvasSurface(), { onReady: vi.fn(), onLost: vi.fn() });
    controller.setPose({ mode: "chat", progress: 0.9, complete: true });
    flushFrame(100);
    flushFrame(150);
    flushFrame(200);
    const moving = rendererState.frames.at(-1);
    expect(moving?.camera[0]).toBeGreaterThan(0);
    controller.setPaused(true);
    flushFrame(1000);
    expect(rendererState.frames.at(-1)).toEqual(moving);
    expect(queued.size).toBe(0);
    controller.setPaused(false);
    flushFrame(90_000);
    expect(rendererState.frames.at(-1)).toEqual(moving);
    flushFrame(90_016);
    expect(rendererState.frames.at(-1)?.camera[0]).toBeGreaterThan(moving!.camera[0]!);
    controller.dispose();
    expect(queued.size).toBe(0);
    expect(rendererState.disposed).toBe(1);
    expect(rendererState.contextsReleased).toBe(1);
    expect(disconnected.every(Boolean)).toBe(true);
    stageDocument.dispatchEvent(new Event("visibilitychange"));
    expect(queued.size).toBe(0);
  });

  it("pauses offscreen and in a hidden document without background camera catch-up", async () => {
    const controller = await mountAgentStage(canvasSurface(), { onReady: vi.fn(), onLost: vi.fn() });
    controller.setPose({ mode: "chat", progress: 0.4, complete: false });
    flushFrame(100);
    flushFrame(150);
    const moving = rendererState.frames.at(-1);
    observerCallbacks[0]!([{ isIntersecting: false }]);
    expect(queued.size).toBe(0);
    observerCallbacks[0]!([{ isIntersecting: true }]);
    flushFrame(120_000);
    expect(rendererState.frames.at(-1)).toEqual(moving);
    stageDocument.hidden = true;
    stageDocument.dispatchEvent(new Event("visibilitychange"));
    expect(queued.size).toBe(0);
    stageDocument.hidden = false;
    stageDocument.dispatchEvent(new Event("visibilitychange"));
    flushFrame(240_000);
    expect(rendererState.frames.at(-1)).toEqual(moving);
    controller.dispose();
  });

  it("draws a stable reduced-motion pose without an animation loop", async () => {
    const ready = vi.fn();
    const controller = await mountAgentStage(canvasSurface(), { onReady: ready, onLost: vi.fn(), reduced: true });
    controller.setPose({ mode: "chat", progress: 1, complete: true });
    controller.setPaused(false);
    flushFrame(100);
    const staticPose = rendererState.frames.at(-1);
    expect(ready).toHaveBeenCalledOnce();
    expect(queued.size).toBe(0);
    stageDocument.dispatchEvent(new Event("visibilitychange"));
    flushFrame(60_000);
    expect(rendererState.frames.at(-1)).toEqual(staticPose);
    expect(queued.size).toBe(0);
    controller.dispose();
  });

  it("stops drawing on context loss and releases resources on disposal", async () => {
    const canvas = canvasSurface();
    const lost = vi.fn();
    const controller = await mountAgentStage(canvas, { onReady: vi.fn(), onLost: lost });
    flushFrame(100);
    const rendered = rendererState.frames.length;
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(lost).toHaveBeenCalledOnce();
    expect(queued.size).toBe(0);
    controller.setPose({ mode: "chat", progress: 0.5, complete: false });
    flushFrame(1000);
    expect(rendererState.frames).toHaveLength(rendered);
    controller.dispose();
    expect(rendererState.disposed).toBe(1);
    expect(rendererState.contextsReleased).toBe(1);
    expect(disconnected.every(Boolean)).toBe(true);
  });
});