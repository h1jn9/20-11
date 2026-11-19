export const AUDIO_CONFIG = {
    src: '',
    volume: 0.45,
    loop: true,
    fadeSeconds: 1.4
};

let audio = null;
let unlocked = false;
let faded = false;

function fadeIn() {
    if (faded || !audio) return;
    faded = true;
    const start = performance.now();
    const duration = Math.max(AUDIO_CONFIG.fadeSeconds, 0.01) * 1000;
    const tick = (now) => {
        if (!audio) return;
        const t = Math.min((now - start) / duration, 1);
        audio.volume = Math.min(AUDIO_CONFIG.volume, AUDIO_CONFIG.volume * t);
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function tryStart() {
    if (!AUDIO_CONFIG.src || unlocked) return;
    unlocked = true;

    audio = new Audio(AUDIO_CONFIG.src);
    audio.loop = AUDIO_CONFIG.loop;
    audio.volume = 0;
    audio.preload = 'auto';

    const play = audio.play();
    if (play && typeof play.then === 'function') {
        play.then(fadeIn).catch(() => {
            unlocked = false;
        });
    } else {
        fadeIn();
    }
}

export function setAudioSource(src) {
    AUDIO_CONFIG.src = src;
    if (unlocked && audio) {
        audio.src = src;
        audio.load();
        const play = audio.play();
        if (play?.then) play.then(fadeIn).catch(() => {});
    }
}

export function initAudio() {
    document.addEventListener('pointerdown', tryStart, { once: true, capture: true });
    document.addEventListener('keydown', tryStart, { once: true, capture: true });
}
