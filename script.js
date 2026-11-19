import { initFx, setFxStage } from './js/fx.js';
import { goToStage, getStage, registerStage } from './js/stages.js';
import { enterFlowers, initFlowers, leaveFlowers } from './js/flowers.js';
import { enterCalendar, initCalendar, leaveCalendar } from './js/calendar.js';
import { enterWish3D, initWish3D, leaveWish3D } from './js/wish3d.js';
import { enterLetter, initLetter, leaveLetter } from './js/letter.js';
import { bindFallback, ASSETS } from './js/assets.js';
import { wait } from './js/utils.js';

const introOverlay = document.getElementById('intro-overlay');
const branchImg = document.getElementById('phuong-branch-img');
const bgMusic = document.getElementById('bg-music');

const MUSIC_VOLUME = 0.55;
const IGNORE_FX = 'button, a, input, textarea, select, .wish-modal, .wish-card, .letter-inner, #envelope-wrapper, .calendar-sheet';

function playMusic() {
    if (!bgMusic) return;
    bgMusic.volume = MUSIC_VOLUME;
    bgMusic.loop = true;
    if (!bgMusic.paused) return;

    try {
        const playPromise = bgMusic.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    } catch (_) {}
}

function initMusic() {
    playMusic();
    window.addEventListener('load', playMusic, { once: true });
    ['pointerdown', 'click', 'touchstart', 'keydown'].forEach((eventName) => {
        document.addEventListener(eventName, playMusic, { once: true, capture: true });
    });
}

function initRipples() {
    document.querySelectorAll('.touch-feedback').forEach((button) => {
        button.addEventListener('pointerdown', (event) => {
            const rect = button.getBoundingClientRect();
            const ink = document.createElement('span');
            ink.className = 'ripple-ink';
            ink.style.left = `${event.clientX - rect.left}px`;
            ink.style.top = `${event.clientY - rect.top}px`;
            button.appendChild(ink);
            window.setTimeout(() => ink.remove(), 700);
        });
    });
}

function initBranchParallax() {
    window.addEventListener('pointermove', (event) => {
        if (getStage() !== 1) return;
        const x = (event.clientX / window.innerWidth - 0.5) * 18;
        const y = (event.clientY / window.innerHeight - 0.5) * 12;
        branchImg.style.setProperty('--branch-x', `${x.toFixed(2)}px`);
        branchImg.style.setProperty('--branch-y', `${y.toFixed(2)}px`);
        branchImg.style.setProperty('--branch-rot', `${(-2 + x * 0.06).toFixed(2)}deg`);
    }, { passive: true });
}

function wireButtons() {
    document.getElementById('btn-enter').addEventListener('click', () => goToStage(2));
    document.getElementById('btn-bloom-next').addEventListener('click', () => goToStage(3));
    document.getElementById('btn-calendar-next').addEventListener('click', () => goToStage(4));
    document.getElementById('btn-wish-next').addEventListener('click', () => goToStage(5));
    document.getElementById('btn-restart').addEventListener('click', () => goToStage(1));
}

async function runIntro() {
    const lines = [
        { id: 'line-1', hold: 2400 },
        { id: 'line-2', hold: 1500 },
        { id: 'line-3', hold: 2800 }
    ];
    const fadeOut = 1350;

    await wait(560);
    for (const item of lines) {
        const el = document.getElementById(item.id);
        el.classList.add('active');
        await wait(item.hold);
        el.classList.remove('active');
        el.classList.add('exit');
        await wait(fadeOut);
    }

    await wait(180);
    goToStage(1);
    await wait(320);
    introOverlay.classList.add('is-done');
}

function init() {
    bindFallback(branchImg, ASSETS.branch.fallback);

    initFx({ ignore: (event) => Boolean(event.target.closest(IGNORE_FX)), branch: branchImg });
    setFxStage(0);

    registerStage(2, { enter: enterFlowers, leave: leaveFlowers });
    registerStage(3, { enter: enterCalendar, leave: leaveCalendar });
    registerStage(4, { enter: enterWish3D, leave: leaveWish3D });
    registerStage(5, { enter: enterLetter, leave: leaveLetter });

    initFlowers();
    initCalendar();
    initWish3D();
    initLetter();
    initRipples();
    initMusic();
    initBranchParallax();
    wireButtons();

    runIntro();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
