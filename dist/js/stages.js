import { setFxStage } from './fx.js';

const handlers = new Map();
let currentStage = 0;

export const getStage = () => currentStage;

export function registerStage(number, { enter, leave } = {}) {
    handlers.set(number, { enter, leave });
}

function restartAnimations(stageEl) {
    stageEl.querySelectorAll('*').forEach((el) => {
        if (el.closest('#flower-bed')) return;
        const name = getComputedStyle(el).animationName;
        if (!name || name === 'none') return;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
    });
}

export function goToStage(number) {
    const target = document.getElementById(`stage-${number}`);
    if (!target || number === currentStage) return;

    const previous = handlers.get(currentStage);
    if (previous?.leave) previous.leave(number);

    document.querySelectorAll('.stage').forEach((stageEl) => {
        stageEl.classList.remove('active-stage');
        stageEl.classList.add('hidden-stage');
    });

    target.classList.remove('hidden-stage');
    target.classList.add('active-stage');
    currentStage = number;
    document.body.dataset.stage = String(number);
    setFxStage(number);

    requestAnimationFrame(() => {
        restartAnimations(target);
        const next = handlers.get(number);
        if (next?.enter) next.enter();
    });
}
