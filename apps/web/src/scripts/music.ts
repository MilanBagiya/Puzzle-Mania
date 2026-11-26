// Calm background music, made live in the browser (Web Audio): soft notes from a five-note scale that suits the
// season, with long gentle tails. No music files, so nothing to license. Off unless the player turns Music on in
// Options; browsers only allow sound after a tap or key press, so it starts on the first one.
import { loadProgress } from '@wild-daily/core';

const SCALES: Record<string, number[]> = {
  winter: [293.66, 349.23, 392.0, 440.0, 523.25, 587.33], // D minor pentatonic: quiet and wintry
  spring: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C major pentatonic: light
  summer: [196.0, 246.94, 293.66, 329.63, 392.0, 440.0], // G major pentatonic: warm
  autumn: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0], // A minor pentatonic: mellow
};
let ctx: AudioContext | null = null, master: GainNode | null = null, timer = 0, running = false;

function audio(): AudioContext | null {
  try { ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; }
  if (!master) {
    master = ctx.createGain(); master.gain.value = 0;
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 1800;
    master.connect(soft).connect(ctx.destination);
  }
  return ctx;
}
function note(freq: number, at: number, vol: number): void {
  const a = audio(); if (!a || !master) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
  o.connect(g).connect(master); o.start(at); o.stop(at + 3.3);
}
function step(): void {
  const a = audio(); if (!a || !running) return;
  const scale = SCALES[document.documentElement.dataset.season ?? 'winter'] ?? SCALES.winter!;
  const f = scale[Math.floor(Math.random() * scale.length)]!, t = a.currentTime + 0.05;
  note(f, t, 0.05);
  if (Math.random() < 0.35) note(f / 2, t, 0.03); // a soft low note now and then
  if (Math.random() < 0.25) note(scale[Math.floor(Math.random() * scale.length)]!, t + 0.6, 0.035);
  timer = window.setTimeout(step, 1400 + Math.random() * 1400);
}
export function startMusic(): void {
  const a = audio(); if (!a || !master || running) return;
  if (a.state === 'suspended') void a.resume();
  running = true;
  master.gain.cancelScheduledValues(a.currentTime); master.gain.setTargetAtTime(0.6, a.currentTime, 0.8); // fade in
  step();
}
export function stopMusic(): void {
  running = false; window.clearTimeout(timer);
  if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); // fade out
}
// Music that was on last time starts again on the first tap or key press (browsers block sound before one).
if (loadProgress().music) {
  const go = (): void => { if (loadProgress().music) startMusic(); };
  window.addEventListener('pointerdown', go, { once: true }); window.addEventListener('keydown', go, { once: true });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else if (loadProgress().music && ctx) startMusic(); });
