
import { setBoardHidden } from "./render";

type PauseListener = (paused: boolean) => void;
const listeners: PauseListener[] = [];
export function onPauseChange(fn: PauseListener) { listeners.push(fn); }

let startTime = 0;
let accumulatedMs = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let paused = true;
let running = false;

export function isPaused() { return paused || !running; }

function updateDisplay() {
    const el = document.querySelector<HTMLElement>("#timer-label");
    if (!el) return;
    const elapsedMs = paused ? accumulatedMs : accumulatedMs + (Date.now() - startTime);
    const totalSec = Math.floor(elapsedMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
}

export function resetTimer() {
    accumulatedMs = 0;
    startTime = Date.now();
    paused = false;
    running = true;
    setBoardHidden(false);
    updateDisplay();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateDisplay, 1000);
    listeners.forEach(fn => fn(paused));
}

export function pauseTimer() {
    if (!running || paused) return;
    accumulatedMs += Date.now() - startTime;
    paused = true;
    setBoardHidden(true);
    updateDisplay();
    listeners.forEach(fn => fn(paused));
}

export function resumeTimer() {
    if (!running || !paused) return;
    startTime = Date.now();
    paused = false;
    setBoardHidden(false);
    listeners.forEach(fn => fn(paused));
}

export function togglePause() {
    paused ? resumeTimer() : pauseTimer();
}

export function stopTimer() {
    if (!paused && running) accumulatedMs += Date.now() - startTime;
    running = false;
    paused = true;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    updateDisplay();
    listeners.forEach(fn => fn(paused));
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseTimer();
});

