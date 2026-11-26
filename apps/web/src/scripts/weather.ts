// Gentle weather behind the page: snow in winter, rain in spring, fireflies in summer, falling leaves in autumn.
// Pure decoration (aria-hidden, no clicks), drawn behind all content. Off with reduced motion or when the player turns
// Weather off in Options. Visual randomness only (where each flake starts); nothing here touches the puzzles.
import { loadProgress } from '@wild-daily/core';

type Kind = 'snow' | 'rain' | 'fireflies' | 'leaves';
const KIND: Record<string, Kind> = { winter: 'snow', spring: 'rain', summer: 'fireflies', autumn: 'leaves' };
const COUNT: Record<Kind, number> = { snow: 28, rain: 36, fireflies: 14, leaves: 12 };
const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

export function applyWeather(): void {
  document.querySelector('.weather')?.remove();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || loadProgress().weather === false) return;
  const kind = KIND[document.documentElement.dataset.season ?? 'winter'] ?? 'snow';
  const layer = document.createElement('div');
  layer.className = `weather wx-${kind}`;
  layer.setAttribute('aria-hidden', 'true');
  let html = '';
  for (let i = 0; i < COUNT[kind]; i++) {
    const style = `left:${rnd(0, 100).toFixed(1)}%; --d:${rnd(0, kind === 'rain' ? 2 : 14).toFixed(2)}s; --t:${(kind === 'rain' ? rnd(1.1, 1.8) : kind === 'fireflies' ? rnd(10, 18) : rnd(9, 17)).toFixed(2)}s; --s:${rnd(0.6, 1.2).toFixed(2)}; --x:${rnd(-40, 40).toFixed(0)}px`;
    html += kind === 'leaves'
      ? `<span class="wx" style="${style}"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#n-leaf"></use></svg></span>`
      : `<span class="wx" style="${style}"></span>`;
  }
  layer.innerHTML = html;
  document.body.prepend(layer);
}
applyWeather();
document.addEventListener('wd:season', applyWeather);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyWeather);
