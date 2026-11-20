import { ASSETS, bindFallback } from './assets.js';
import { clamp, isCoarsePointer, rand, randInt } from './utils.js';

const bed = document.getElementById('flower-bed');
const copy = document.getElementById('bloom-copy');
const cta = document.getElementById('btn-bloom-next');
const layers = {
    back: bed.querySelector('[data-depth="back"]'),
    mid: bed.querySelector('[data-depth="mid"]'),
    front: bed.querySelector('[data-depth="front"]')
};

const PARALLAX = [
    { name: 'back', factor: 0.45 },
    { name: 'mid', factor: 1 },
    { name: 'front', factor: 1.9 }
];

let active = false;
let coarsePointer = false;
let timers = [];
let resizeTimer = 0;
let maxDelay = 0;

function schedule(fn, delay) {
    timers.push(window.setTimeout(fn, delay));
}

function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
    window.clearTimeout(resizeTimer);
    resizeTimer = 0;
}

function getSafeRects() {
    const bedRect = bed.getBoundingClientRect();
    const scaleX = bed.clientWidth ? bedRect.width / bed.clientWidth : 1;
    const scaleY = bed.clientHeight ? bedRect.height / bed.clientHeight : 1;

    return [copy, cta].filter(Boolean).map((element) => {
        const rect = element.getBoundingClientRect();
        const padding = element === copy ? 28 : 24;

        return {
            left: (rect.left - bedRect.left) / scaleX - padding,
            top: (rect.top - bedRect.top) / scaleY - padding,
            right: (rect.right - bedRect.left) / scaleX + padding,
            bottom: (rect.bottom - bedRect.top) / scaleY + padding
        };
    });
}

function collidesRect(x, y, radius, rect) {
    return (
        x + radius > rect.left &&
        x - radius < rect.right &&
        y + radius > rect.top &&
        y - radius < rect.bottom
    );
}

function collides(x, y, radius, rects) {
    return rects.some((rect) => collidesRect(x, y, radius, rect));
}

function placeFlower(x, y, radius, rects, width, height) {
    let px = clamp(x, radius, Math.max(radius, width - radius));
    let py = clamp(y, radius, Math.max(radius, height - radius));
    const maxX = Math.max(radius, width - radius);
    const maxY = Math.max(radius, height - radius);

    for (let attempt = 0; attempt < 3 && collides(px, py, radius, rects); attempt++) {
        let best = null;

        for (const rect of rects) {
            if (!collidesRect(px, py, radius, rect)) continue;

            const candidates = [
                { x: rect.left - radius - 4, y: py },
                { x: rect.right + radius + 4, y: py },
                { x: px, y: rect.top - radius - 4 },
                { x: px, y: rect.bottom + radius + 4 }
            ];

            for (const candidate of candidates) {
                const cx = clamp(candidate.x, radius, maxX);
                const cy = clamp(candidate.y, radius, maxY);
                const distance = Math.abs(cx - px) + Math.abs(cy - py);
                if (!best || distance < best.distance) best = { x: cx, y: cy, distance };
            }
        }

        if (!best) break;
        px = best.x;
        py = best.y;
    }

    return collides(px, py, radius, rects) ? null : { x: px, y: py };
}

function createFlower(depth, position, size, delay) {
    const wrapper = document.createElement('div');
    wrapper.className = `bloom-flower depth-${depth}`;
    wrapper.style.left = `${position.x.toFixed(1)}px`;
    wrapper.style.top = `${position.y.toFixed(1)}px`;
    wrapper.style.setProperty('--size', `${size}px`);
    wrapper.style.setProperty('--rot', `${rand(-45, 45).toFixed(1)}deg`);
    wrapper.style.setProperty('--delay', `${delay.toFixed(3)}s`);
    wrapper.style.setProperty('--sway-dur', `${rand(5.5, 10.5).toFixed(2)}s`);
    wrapper.style.setProperty('--final-opacity', depth === 'back' ? '0.74' : depth === 'mid' ? '0.95' : '1');
    wrapper.style.setProperty('--z', String(depth === 'back' ? randInt(1, 20) : depth === 'mid' ? randInt(21, 60) : randInt(61, 99)));

    const inner = document.createElement('span');
    inner.className = 'bloom-inner';

    const asset = ASSETS.flowers[randInt(0, ASSETS.flowers.length - 1)];
    const img = document.createElement('img');
    img.src = asset.src;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    bindFallback(img, asset.fallback);

    inner.appendChild(img);
    wrapper.appendChild(inner);
    return wrapper;
}

function addFlower(fragments, rects, width, height, x, y, size, depth, delay) {
    const position = placeFlower(x, y, size * 0.5, rects, width, height);
    if (!position || !layers[depth]) return false;

    fragments[depth].appendChild(createFlower(depth, position, size, delay));
    maxDelay = Math.max(maxDelay, delay);
    return true;
}

function buildFlowerBed() {
    clearTimers();
    Object.values(layers).forEach((layer) => layer.replaceChildren());
    copy.classList.remove('is-visible');
    cta.classList.remove('is-visible');
    maxDelay = 0;

    const width = bed.clientWidth;
    const height = bed.clientHeight;
    if (!width || !height) return;

    const safeRects = getSafeRects();
    const narrow = width < 600;
    const compact = width < 1000;
    const scale = narrow ? 0.74 : compact ? 0.88 : 1;
    const spacing = narrow ? 64 : compact ? 76 : width > 1600 ? 98 : 86;
    const columns = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const total = columns * rows;
    const fragments = {
        back: document.createDocumentFragment(),
        mid: document.createDocumentFragment(),
        front: document.createDocumentFragment()
    };
    let placed = 0;

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const x = (column + 0.5) * spacing + rand(-spacing * 0.4, spacing * 0.4);
            const y = (row + 0.5) * spacing + rand(-spacing * 0.4, spacing * 0.4);
            const roll = Math.random();
            const depth = roll < 0.34 ? 'back' : roll < 0.8 ? 'mid' : 'front';
            const baseSize = depth === 'back' ? rand(58, 98) : depth === 'mid' ? rand(92, 152) : rand(142, 212);
            const size = Math.round(baseSize * scale);
            const delay = (placed / total) * 0.95 + rand(0, 0.38);

            if (addFlower(fragments, safeRects, width, height, x, y, size, depth, delay)) placed++;

            if (Math.random() < 0.24) {
                const smallSize = Math.max(34, Math.round(size * rand(0.42, 0.66)));
                const smallDelay = delay + rand(0, 0.16);
                const smallX = x + rand(-spacing * 0.55, spacing * 0.55);
                const smallY = y + rand(-spacing * 0.55, spacing * 0.55);
                if (addFlower(fragments, safeRects, width, height, smallX, smallY, smallSize, 'back', smallDelay)) placed++;
            }
        }
    }

    if (placed < 12) {
        const fallbackPoints = [
            [0.08, 0.08], [0.5, 0.06], [0.92, 0.08], [0.06, 0.5],
            [0.94, 0.5], [0.08, 0.92], [0.5, 0.94], [0.92, 0.92]
        ];

        fallbackPoints.forEach(([fx, fy], index) => {
            let size = narrow ? 72 : 120;
            for (let attempt = 0; attempt < 4; attempt++) {
                const x = fx * width + rand(-18, 18);
                const y = fy * height + rand(-18, 18);
                if (addFlower(fragments, safeRects, width, height, x, y, size, 'back', 0.2 + index * 0.05)) {
                    placed++;
                    return;
                }
                size = Math.round(size * 0.75);
            }
        });
    }

    Object.entries(fragments).forEach(([depth, fragment]) => layers[depth].appendChild(fragment));

    schedule(() => {
        if (!active) return;
        copy.classList.add('is-visible');
        schedule(() => {
            if (active) cta.classList.add('is-visible');
        }, 1250);
    }, Math.round((maxDelay + 1.05) * 1000));
}

function resetParallax() {
    PARALLAX.forEach(({ name }) => {
        bed.style.setProperty(`--mx-${name}`, '0px');
        bed.style.setProperty(`--my-${name}`, '0px');
    });
}

function onPointerMove(event) {
    if (!active || coarsePointer) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 22;
    const y = (event.clientY / window.innerHeight - 0.5) * 16;

    PARALLAX.forEach(({ name, factor }) => {
        bed.style.setProperty(`--mx-${name}`, `${(x * factor).toFixed(2)}px`);
        bed.style.setProperty(`--my-${name}`, `${(y * factor).toFixed(2)}px`);
    });
}

function onResize() {
    coarsePointer = isCoarsePointer();
    if (!active) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildFlowerBed, 180);
}

export function initFlowers() {
    coarsePointer = isCoarsePointer();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
}

export function enterFlowers() {
    active = true;
    buildFlowerBed();
}

export function leaveFlowers() {
    active = false;
    clearTimers();
    copy.classList.remove('is-visible');
    cta.classList.remove('is-visible');
    resetParallax();
}
