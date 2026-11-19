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
    let timerId = 0;
    let running = false;
    let stamp = 0;

    function frame(time) {
        if (!running) return;
        tick(time);
        const token = ++stamp;
        rafId = requestAnimationFrame(frame);
        clearTimeout(timerId);
        timerId = window.setTimeout(() => {
            if (running && token === stamp) {
                cancelAnimationFrame(rafId);
                frame(performance.now());
            }
        }, 140);
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
            clearTimeout(timerId);
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
