// Tiny sound synthesizer (Web Audio). No sound files: every effect is generated in the browser.
// Sounds only play when the player has turned them on in Options.
import { loadProgress } from '@wild-daily/core';

export type Sfx = 'tap' | 'crunch' | 'wrong' | 'hint' | 'home' | 'stamp' | 'win' | 'fanfare' | 'badge';
let ctx: AudioContext | null = null;
const ac = (): AudioContext | null => {
  try { ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, slideTo?: number): void {
  const a = ac(); if (!a) return;
  const t = a.currentTime + start, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(start: number, dur: number, cutoff: number, vol = 0.12): void {
  const a = ac(); if (!a) return;
  const t = a.currentTime + start, len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination); src.start(t);
}
const RECIPES: Record<Sfx, () => void> = {
  tap: () => tone(660, 0, 0.05, 'sine', 0.05),
  crunch: () => { noise(0, 0.07, 2400, 0.1); noise(0.03, 0.05, 1600, 0.06); },
  wrong: () => tone(220, 0, 0.16, 'triangle', 0.09, 140),
  hint: () => { tone(988, 0, 0.09, 'sine', 0.05); tone(1480, 0.07, 0.12, 'sine', 0.04); },
  home: () => { tone(523, 0, 0.1, 'triangle', 0.07); tone(784, 0.09, 0.16, 'triangle', 0.07); },
  stamp: () => { noise(0, 0.05, 700, 0.14); tone(180, 0, 0.08, 'sine', 0.1, 110); },
  win: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, k * 0.09, 0.22, 'triangle', 0.07)),
  fanfare: () => { [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, k * 0.1, 0.3, 'triangle', 0.07)); [523, 659, 784].forEach((f) => tone(f, 0.55, 0.7, 'sine', 0.05)); },
  badge: () => [1175, 1568, 2093].forEach((f, k) => tone(f, k * 0.07, 0.14, 'sine', 0.045)),
};
export function play(s: Sfx, force = false): void {
  if (!force && !loadProgress().sound) return;
  try { RECIPES[s](); } catch { /* audio unavailable */ }
}
export function buzz(pattern: number | number[]): void {
  if (!loadProgress().vibrate) return;
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}
