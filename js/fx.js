import { ASSETS } from './assets.js';
import { clamp, createSmartLoop, isCoarsePointer, pick, rand } from './utils.js';

let canvas;
let ctx;
let width = 0;
let height = 0;
let dpr = 1;
let stage = 1;
let branchEl = null;
let shouldIgnore = () => false;
let lastTime = 0;
let petalTimer = 0;

const dust = [];
const petals = [];
const bursts = [];

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function buildDust() {
    dust.length = 0;
    const count = isCoarsePointer() ? 16 : 30;
    for (let i = 0; i < count; i++) {
        dust.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: rand(-0.12, 0.12),
            vy: rand(-0.26, -0.06),
            size: rand(0.8, 2.4),
            alpha: rand(0.18, 0.55),
            phase: rand(0, Math.PI * 2),
            gold: Math.random() > 0.35
        });
    }
}

function spawnFallingPetal(originY) {
    const rect = branchEl ? branchEl.getBoundingClientRect() : null;
    let x;
    let y;

    if (stage === 1 && rect && rect.width > 0) {
        x = rect.left + rand(rect.width * 0.08, rect.width * 0.9);
        y = originY !== undefined ? originY : rect.top + rand(rect.height * 0.05, rect.height * 0.62);
    } else {
        x = rand(-20, width * 0.42);
        y = originY !== undefined ? originY : rand(-40, height * 0.18);
    }

    petals.push({
        x,
        y,
        size: rand(5, 15) * (isCoarsePointer() ? 0.82 : 1),
        vx: rand(0.18, 0.95),
        vy: rand(0.45, 1.35),
        sway: rand(0.35, 1.1),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        vRot: rand(-0.02, 0.025),
        color: pick(ASSETS.petals),
        alpha: rand(0.65, 1),
        life: 0
    });
}

export function burstAt(x, y, options = {}) {
    const count = isCoarsePointer() ? 10 : 16;
    bursts.push({
        x,
        y,
        radius: 0,
        maxRadius: options.large ? 130 : 88,
        alpha: 1,
        kind: 'ring'
    });

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.18, 0.18);
        const speed = rand(1.2, 4.4);
        petals.push({
            x,
            y,
            size: rand(3, 8),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.8,
            sway: rand(0.1, 0.3),
            phase: rand(0, Math.PI * 2),
            rot: angle,
            vRot: rand(-0.04, 0.04),
            color: pick(ASSETS.petals),
            alpha: 1,
            life: 0,
            burst: true
        });
    }
}

function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = clamp(p.alpha, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.85, p.size * 0.7, 0, p.size);
    ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.7, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
    ctx.fill();
    ctx.restore();
}

function update(dt) {
    const step = Math.min(dt / 16.67, 2.4);

    for (const d of dust) {
        d.x += (d.vx + Math.sin(d.phase + performance.now() * 0.0004) * 0.08) * step;
        d.y += d.vy * step;
        d.phase += 0.01 * step;
        if (d.y < -8) { d.y = height + 8; d.x = rand(0, width); }
        if (d.x < -8) d.x = width + 8;
        if (d.x > width + 8) d.x = -8;
    }

    if (stage === 1 || stage === 5) {
        petalTimer -= dt;
        if (petalTimer <= 0) {
            spawnFallingPetal();
            petalTimer = rand(stage === 1 ? 140 : 280, stage === 1 ? 520 : 900);
        }
    }

    const limit = isCoarsePointer() ? 26 : 46;
    for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.life += dt;
        p.x += (p.vx + Math.sin(p.phase + p.life * 0.003) * p.sway) * step;
        p.y += p.vy * step;
        p.rot += p.vRot * step;
        p.phase += 0.02 * step;

        if (p.burst) {
            p.vy += 0.055 * step;
            p.vx *= 0.985;
            p.alpha -= 0.016 * step;
        } else {
            p.vy += 0.004 * step;
            if (p.y > height + 30) p.alpha -= 0.06 * step;
        }

        if (p.alpha <= 0 || p.x > width + 40 || p.life > 16000) {
            petals.splice(i, 1);
        }
    }

    if (petals.length > limit) petals.splice(0, petals.length - limit);

    for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.radius += 3.4 * step;
        b.alpha -= 0.022 * step;
        if (b.alpha <= 0 || b.radius > b.maxRadius) bursts.splice(i, 1);
    }
}

function render() {
    ctx.clearRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    for (const d of dust) {
        const pulse = 0.65 + Math.sin(d.phase) * 0.35;
        ctx.globalAlpha = d.alpha * pulse;
        ctx.fillStyle = d.gold ? '#ffe6a8' : '#ff9fb2';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const b of bursts) {
        const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(b.radius, 1));
        gradient.addColorStop(0, `rgba(255,238,190,${b.alpha * 0.32})`);
        gradient.addColorStop(0.45, `rgba(255,170,150,${b.alpha * 0.12})`);
        gradient.addColorStop(1, 'rgba(255,170,150,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(b.radius, 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = b.alpha * 0.55;
        ctx.strokeStyle = '#ffe6a8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    for (const p of petals) drawPetal(p);
    ctx.globalAlpha = 1;
}

function frame(time) {
    const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67;
    lastTime = time;
    update(dt);
    render();
}

const fxLoop = createSmartLoop(frame);

function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (shouldIgnore(event)) return;
    burstAt(event.clientX, event.clientY);
}

function onResize() {
    resize();
    buildDust();
}

function onVisibility() {
    if (document.hidden) {
        fxLoop.stop();
    } else {
        lastTime = 0;
        fxLoop.start();
    }
}

export function initFx({ ignore, branch } = {}) {
    canvas = document.getElementById('fx-canvas');
    ctx = canvas.getContext('2d');
    branchEl = branch || document.getElementById('phuong-branch-img');
    if (typeof ignore === 'function') shouldIgnore = ignore;

    resize();
    buildDust();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    fxLoop.start();
}

export function setFxStage(stageNumber) {
    stage = stageNumber;
    if (stageNumber !== 1) {
        for (let i = petals.length - 1; i >= 0; i--) {
            if (!petals[i].burst) petals.splice(i, 1);
        }
    }
}
