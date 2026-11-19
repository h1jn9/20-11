import { clamp, createSmartLoop, rand } from './utils.js';

const wishes = [
    { title: "🌈 Mỗi Ngày Đến Trường", body: "Cảm ơn Thầy/Cô đã biến mỗi ngày đến lớp thành một ngày vui trọn vẹn và đáng nhớ." },
    { title: "✨ Tỏa Sáng Yêu Thương", body: "Thầy/Cô không chỉ dạy kiến thức mà còn dạy chúng em biết sống nhân ái." },
    { title: "🏆 Tự Hào Nghề Giáo", body: "Nghề dạy học là nghề cao quý nhất trong những nghề cao quý. Chúng em tự hào về Thầy/Cô!" },
    { title: "🔥 Giữ Trọn Lửa Nghề", body: "Chúc Thầy/Cô mãi giữ vững ngọn lửa nhiệt huyết với sự nghiệp trồng người cao quý." },
    { title: "🎶 Khúc Ca Tri Ân", body: "Giai điệu tuổi học trò đẹp nhất luôn ngân vang bóng hình Thầy/Cô bên bục giảng thân thương." },
    { title: "⛵ Người Lái Đò Thầm Lặng", body: "Tri ân người lái đò đã kiên nhẫn đưa bao thế hệ học trò cập bến bờ tri thức bình an." },
    { title: "💚 Sức Khỏe Dồi Dào", body: "Kính chúc Thầy/Cô thật nhiều sức khỏe, bình an và luôn nở nụ cười hạnh phúc mỗi ngày." },
    { title: "💡 Ngọn Hải Đăng Tri Thức", body: "Cảm ơn Thầy/Cô đã thắp sáng ngọn đèn tri thức và dẫn lối chúng em trưởng thành." }
];

const world = document.getElementById('wish-world');
const object3d = document.getElementById('wish-object');
const cardsHost = document.getElementById('wish-cards');
const canvas = document.getElementById('wish-particles');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('wish-modal');
const modalTitle = document.getElementById('modal-wish-title');
const modalBody = document.getElementById('modal-wish-body');

let active = false;
let lastTime = 0;
let rotX = -8;
let rotY = 0;
let velX = 0;
let velY = 0;
let dragging = false;
let pointerId = null;
let lastPointerX = 0;
let lastPointerY = 0;
let radius = 210;
let radiusZ = 150;
let particleW = 0;
let particleH = 0;
let dpr = 1;
let dotSpin = 0;

const cards = [];
const dots = [];

function buildCards() {
    cardsHost.innerHTML = '';
    cards.length = 0;

    wishes.forEach((wish, index) => {
        const angle = -Math.PI / 2 + (index / wishes.length) * Math.PI * 2;

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'wish-card touch-feedback';
        card.innerHTML = `<h4></h4><p></p>`;
        card.querySelector('h4').textContent = wish.title;
        card.querySelector('p').textContent = wish.body;

        card.dataset.angle = String(angle);
        card.dataset.bob = String(index % 2 === 0 ? 7 : -7);

        card.addEventListener('click', (event) => {
            event.stopPropagation();
            openWish(wish);
        });

        cardsHost.appendChild(card);
        cards.push(card);
    });
}

function buildDots() {
    dots.length = 0;
    const count = window.innerWidth < 600 ? 46 : 84;
    for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const spread = rand(0.74, 1.38);
        dots.push({
            x: Math.cos(angle) * spread,
            y: rand(-0.32, 0.32),
            z: Math.sin(angle) * spread,
            distance: rand(radius * 0.78, radius * 1.3),
            size: rand(0.7, 2.3),
            alpha: rand(0.25, 0.85),
            phase: rand(0, Math.PI * 2),
            hue: Math.random() > 0.4 ? '255, 226, 168' : '255, 138, 158'
        });
    }
}

function resizeParticles() {
    const rect = world.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    particleW = rect.width;
    particleH = rect.height;
    canvas.width = Math.round(particleW * dpr);
    canvas.height = Math.round(particleH * dpr);
    canvas.style.width = `${particleW}px`;
    canvas.style.height = `${particleH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nextRadius = window.innerWidth < 600 ? 128 : window.innerWidth < 1000 ? 166 : 205;
    if (nextRadius !== radius || Math.round(radius * 0.72) !== radiusZ) {
        radius = nextRadius;
        radiusZ = Math.round(radius * 0.72);
        buildDots();
    }
}

function openWish(wish) {
    modalTitle.textContent = wish.title;
    modalBody.textContent = wish.body;
    modal.classList.remove('hidden');
}

function closeWish() {
    modal.classList.add('hidden');
}

function rotatePoint(x, y, z, cosY, sinY, cosX, sinX) {
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    return {
        x: x1,
        y: y * cosX - z1 * sinX,
        z: y * sinX + z1 * cosX
    };
}

function renderDots(cosY, sinY, cosX, sinX) {
    ctx.clearRect(0, 0, particleW, particleH);
    const centerX = particleW / 2;
    const centerY = particleH / 2;
    const perspective = 760;

    ctx.globalCompositeOperation = 'lighter';
    for (const dot of dots) {
        const spinCos = Math.cos(dotSpin);
        const spinSin = Math.sin(dotSpin);
        const sx = dot.x * spinCos - dot.z * spinSin;
        const sz = dot.x * spinSin + dot.z * spinCos;
        const p = rotatePoint(sx * dot.distance, dot.y * dot.distance, sz * dot.distance, cosY, sinY, cosX, sinX);
        if (p.z > perspective - 30) continue;

        const scale = perspective / (perspective - p.z);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;
        const depthAlpha = clamp((p.z / (radius * 2.1) + 1) / 2, 0.1, 1);
        const twinkle = 0.7 + Math.sin(dot.phase + dotSpin * 2) * 0.3;

        ctx.globalAlpha = dot.alpha * depthAlpha * twinkle;
        ctx.fillStyle = `rgba(${dot.hue},1)`;
        ctx.beginPath();
        ctx.arc(px, py, dot.size * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

function updateCards(cosY, sinY, cosX, sinX) {
    const centerX = particleW / 2;
    const centerY = particleH / 2;
    const perspective = particleW < 520 ? 620 : 760;

    for (const card of cards) {
        const angle = Number(card.dataset.angle);
        const bob = Number(card.dataset.bob);
        const x0 = Math.cos(angle) * radius;
        const z0 = Math.sin(angle) * radiusZ;
        const y0 = bob + Math.sin(angle * 2 + dotSpin * 1.6) * 3.5;
        const p = rotatePoint(x0, y0, z0, cosY, sinY, cosX, sinX);

        const scale = perspective / Math.max(260, perspective - p.z);
        const depth = clamp((p.z / radiusZ + 1) / 2, 0, 1);
        const x = centerX + p.x * scale;
        const y = centerY + p.y * scale;

        card.style.left = `${x.toFixed(1)}px`;
        card.style.top = `${y.toFixed(1)}px`;
        card.style.setProperty('--card-scale', (0.82 + depth * 0.22).toFixed(3));
        card.style.setProperty('--card-opacity', (0.42 + depth * 0.58).toFixed(3));
        card.style.setProperty('--card-blur', depth < 0.3 ? `${((0.3 - depth) * 3).toFixed(2)}px` : '0px');
        card.style.zIndex = String(10 + Math.round(depth * 100));
    }
}

function frame(time) {
    const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67;
    lastTime = time;
    const step = dt / 16.67;

    if (!dragging) {
        if (Math.abs(velY) > 0.004 || Math.abs(velX) > 0.004) {
            rotY += velY * step;
            const nextRotX = clamp(rotX + velX * step, -18, 18);
            if (nextRotX !== rotX + velX * step) velX = 0;
            rotX = nextRotX;
            const decay = Math.pow(0.94, step);
            velY *= decay;
            velX *= decay;
        } else {
            velY = 0;
            velX = 0;
            rotY += 0.11 * step;
        }
    }

    dotSpin += 0.0009 * step;
    const ry = rotY * Math.PI / 180;
    const rx = rotX * Math.PI / 180;
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);

    object3d.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    updateCards(cosY, sinY, cosX, sinX);
    renderDots(cosY, sinY, cosX, sinX);
}

const wishLoop = createSmartLoop(frame);

function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('.wish-card')) return;
    dragging = true;
    pointerId = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    velX = 0;
    velY = 0;
    world.setPointerCapture?.(pointerId);
}

function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    rotY += dx * 0.34;
    const nextRotX = clamp(rotX + dy * 0.28, -18, 18);
    velY = dx * 0.34;
    velX = nextRotX === rotX + dy * 0.28 ? dy * 0.28 : 0;
    rotX = nextRotX;
}

function onPointerUp(event) {
    if (event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    world.releasePointerCapture?.(event.pointerId);
}

function onResize() {
    if (active) resizeParticles();
}

function onKeyDown(event) {
    if (event.key === 'Escape') closeWish();
}

export function initWish3D() {
    resizeParticles();
    buildCards();
    buildDots();

    world.addEventListener('pointerdown', onPointerDown);
    world.addEventListener('pointermove', onPointerMove);
    world.addEventListener('pointerup', onPointerUp);
    world.addEventListener('pointercancel', onPointerUp);
    world.addEventListener('pointerleave', onPointerUp);
    document.getElementById('btn-close-modal').addEventListener('click', closeWish);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeWish();
    });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('keydown', onKeyDown);
}

export function enterWish3D() {
    if (active) return;
    active = true;
    resizeParticles();
    lastTime = 0;
    wishLoop.start();
}

export function leaveWish3D() {
    active = false;
    wishLoop.stop();
    closeWish();
    ctx.clearRect(0, 0, particleW, particleH);
}
