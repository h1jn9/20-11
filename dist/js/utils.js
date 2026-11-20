export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isCoarsePointer = () =>
  window.matchMedia("(pointer: coarse)").matches;

export function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createSmartLoop(tick) {
    let rafId = 0;
    let running = false;

    function frame(time) {
        if (!running) return;
        rafId = requestAnimationFrame(frame);
        tick(time);
    }

    return {
        start() {
            if (running) return;
            running = true;
            rafId = requestAnimationFrame(frame);
        },
        stop() {
            running = false;
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
    };
}

export function makeDisposer() {
  const cleanups = [];
  return {
    add(fn) {
      cleanups.push(fn);
      return fn;
    },
    dispose() {
      while (cleanups.length) cleanups.pop()();
    }
  };
}
