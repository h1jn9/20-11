import { isCoarsePointer } from './utils.js';

const grid = document.getElementById('calendar-grid');
const board = document.getElementById('calendar-board');
let active = false;

function buildCalendar() {
    grid.innerHTML = '';

    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((label) => {
        const cell = document.createElement('div');
        cell.className = 'cal-day-name';
        cell.textContent = label;
        grid.appendChild(cell);
    });

    for (let i = 0; i < 6; i++) grid.appendChild(document.createElement('div'));

    for (let day = 1; day <= 30; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell' + (day === 20 ? ' special-20' : '');
        cell.textContent = String(day);
        grid.appendChild(cell);
    }
}

function onPointerMove(event) {
    if (!active || isCoarsePointer()) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 9;
    const y = (event.clientY / window.innerHeight - 0.5) * 7;
    board.style.setProperty('--tilt-y', `${x.toFixed(2)}deg`);
    board.style.setProperty('--tilt-x', `${(-y).toFixed(2)}deg`);
}

export function initCalendar() {
    buildCalendar();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
}

export function enterCalendar() {
    active = true;
}

export function leaveCalendar() {
    active = false;
    board.style.setProperty('--tilt-x', '0deg');
    board.style.setProperty('--tilt-y', '0deg');
}
