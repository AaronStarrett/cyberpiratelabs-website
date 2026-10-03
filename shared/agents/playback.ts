const INTERVAL_MS = 100;

/** One clock per active playback session. Resuming always starts from the present. */
export function createExperienceClock(onTick: (ms: number) => void) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let last = 0;
  let disposed = false;
  return {
    setRunning(running: boolean) {
      if (disposed) return;
      if (!running) {
        if (timer !== undefined) clearInterval(timer);
        timer = undefined;
        return;
      }
      if (timer !== undefined) return;
      last = performance.now();
      timer = setInterval(() => {
        const now = performance.now();
        const elapsed = Math.min(250, Math.max(0, now - last));
        last = now;
        if (elapsed > 0) onTick(elapsed);
      }, INTERVAL_MS);
    },
    dispose() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
      disposed = true;
    },
  };
}