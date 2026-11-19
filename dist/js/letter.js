import { burstAt } from './fx.js';
import { isCoarsePointer, reducedMotion, wait } from './utils.js';

const wrapper = document.getElementById('envelope-wrapper');
const envelope = document.getElementById('envelope');
const paper = document.getElementById('letter-paper');
const actions = document.querySelector('.letter-actions');
const btnAgain = document.getElementById('btn-read-again');
const typedLines = Array.from(document.querySelectorAll('[data-type]'));
const originals = typedLines.map((el) => el.textContent);

let opened = false;
let typistToken = 0;
let timers = [];
let lastHoverBurst = 0;

function schedule(fn, delay) {
    timers.push(window.setTimeout(fn, delay));
}

function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
}

function resetLetter() {
    typistToken++;
    clearTimers();
    opened = false;
    envelope.classList.remove('is-open');
    wrapper.classList.remove('is-opening');
    wrapper.classList.remove('hidden');
    wrapper.style.setProperty('--env-x', '0deg');
    wrapper.style.setProperty('--env-y', '0deg');
    wrapper.style.setProperty('--env-lift', '0px');
    paper.classList.add('hidden');
    actions.classList.remove('is-visible');

    typedLines.forEach((el, index) => {
        el.textContent = originals[index];
        el.classList.remove('is-typing', 'is-active');
    });
}

async function typeLetter() {
    const token = ++typistToken;

    for (let i = 0; i < typedLines.length; i++) {
        if (token !== typistToken) return;
        const el = typedLines[i];
        const text = originals[i];
        el.classList.remove('is-active');
        el.classList.add('is-typing', 'is-active');
        el.textContent = '';

        for (let j = 0; j < text.length; j++) {
            if (token !== typistToken) return;
            el.textContent += text[j];
            const char = text[j];
            let delay = 24;
            if ('.,!?'.includes(char)) delay = 210;
            else if (char === ',') delay = 150;
            else if (char === ' ') delay = 18;
            if (reducedMotion()) delay = 0;
            await wait(delay);
        }

        el.classList.remove('is-active');
        await wait(reducedMotion() ? 0 : 260);
    }

    if (token !== typistToken) return;
    actions.classList.add('is-visible');
}

function openLetter() {
    if (opened) return;
    opened = true;

    envelope.classList.add('is-open');
    const rect = wrapper.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height * 0.42, { large: true });

    schedule(() => {
        wrapper.classList.add('is-opening');
        schedule(() => {
            wrapper.classList.add('hidden');
            paper.classList.remove('hidden');
            schedule(typeLetter, isCoarsePointer() ? 520 : 650);
        }, 720);
    }, 650);
}

function onPointerMove(event) {
    if (isCoarsePointer() || opened) return;
    const rect = wrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    wrapper.style.setProperty('--env-y', `${(x * 14).toFixed(2)}deg`);
    wrapper.style.setProperty('--env-x', `${(-y * 10).toFixed(2)}deg`);
    wrapper.style.setProperty('--env-lift', `${(-y * 7).toFixed(1)}px`);
}

function onPointerEnter() {
    if (opened || isCoarsePointer()) return;
    const now = Date.now();
    if (now - lastHoverBurst < 1800) return;
    lastHoverBurst = now;
    const rect = wrapper.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height * 0.42);
}

function onPointerLeave() {
    wrapper.style.setProperty('--env-x', '0deg');
    wrapper.style.setProperty('--env-y', '0deg');
    wrapper.style.setProperty('--env-lift', '0px');
}

function onKeyDown(event) {
    if (opened) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLetter();
    }
}

export function initLetter() {
    wrapper.addEventListener('click', openLetter);
    wrapper.addEventListener('keydown', onKeyDown);
    wrapper.addEventListener('pointerenter', onPointerEnter);
    wrapper.addEventListener('pointermove', onPointerMove, { passive: true });
    wrapper.addEventListener('pointerleave', onPointerLeave);
    btnAgain.addEventListener('click', resetLetter);
}

export function enterLetter() {
    resetLetter();
}

export function leaveLetter() {
    typistToken++;
    clearTimers();
}
