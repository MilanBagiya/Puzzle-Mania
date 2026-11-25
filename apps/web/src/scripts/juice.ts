// "Game juice": sounds, little pops on taps, and a proper celebration when a puzzle is solved.
// Works for every game without changing the games: it watches taps, the coach message and the result panel.
import { buzz, play } from './sound';
import { BOARD_ROOT, selectorFor } from './focus';

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAP = '[data-fs],[data-g],[data-nb],[data-nb-act],[data-st],[data-st-act],[data-mr],[data-mr-act],[data-in],[data-out],[data-check],[data-hint],[data-clear],#tut [data-i]';

function pop(el: Element | null): void {
  if (!el || reduced() || !(el as HTMLElement).animate) return;
  (el as HTMLElement).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
}
function hop(el: Element | null): void {
  if (!el || reduced() || !(el as HTMLElement).animate) return;
  (el as HTMLElement).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], { duration: 520, easing: 'ease-out' });
}
const homes = (): number => document.querySelectorAll('.acard .home').length;
const coachBad = (root: Element): boolean => !!root.querySelector('.coach.bad');

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(TAP);
  if (!el || el.hasAttribute('disabled')) return;
  const root = el.closest(BOARD_ROOT) ?? document.body;
  const sel = selectorFor(el), act = `${el.getAttribute('data-g') ?? ''}${el.getAttribute('data-fs') ?? ''}${el.getAttribute('data-nb-act') ?? ''}${el.getAttribute('data-st-act') ?? ''}${el.getAttribute('data-mr-act') ?? ''}${el.hasAttribute('data-hint') ? 'hint' : ''}`;
  const snowy = el.getAttribute('data-fs') === 'cell' || !!el.closest('#tut');
  const homesBefore = homes(), badBefore = coachBad(root);
  // Games re-draw synchronously; look again on the next frame.
  requestAnimationFrame(() => {
    const now = sel ? root.querySelector(sel) ?? document.querySelector(sel) : null;
    if (act.includes('hint')) { play('hint'); return; }
    if (coachBad(root) && !badBefore) { play('wrong'); buzz([25, 40, 25]); return; }
    if (homes() > homesBefore) { play('home'); buzz(15); document.querySelectorAll('.acard .home').forEach((h) => hop(h.closest('.acard')?.querySelector('svg') ?? null)); pop(now); return; }
    play(snowy ? 'crunch' : 'tap'); buzz(8); pop(now);
  });
}, true);

// Celebrate when any result panel appears.
const celebrated = new WeakSet<Element>();
async function celebrate(panel: HTMLElement): Promise<void> {
  if (celebrated.has(panel)) return;
  celebrated.add(panel);
  const big = /Daily Set complete!|Chapter \d+ complete!/.test(panel.textContent ?? '');
  const badges = panel.querySelectorAll('.badge-tile').length;
  play(big ? 'fanfare' : 'win'); buzz(big ? [20, 30, 20, 30, 80] : [20, 30, 60]);
  if (reduced()) return;
  const [{ gsap }, confettiMod] = await Promise.all([import('gsap'), import('canvas-confetti')]);
  const confetti = confettiMod.default;
  const colors = ['#F2704D', '#F6C445', '#2F7D5B', '#3F86D3', '#FFFFFF'];
  confetti({ particleCount: big ? 140 : 80, spread: 75, startVelocity: 42, origin: { y: 0.35 }, colors, disableForReducedMotion: true });
  if (big) window.setTimeout(() => { confetti({ particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors }); confetti({ particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors }); }, 450);
  const cards = panel.querySelectorAll(':scope > section, :scope > div');
  const tl = gsap.timeline();
  tl.from(cards, { y: 26, opacity: 0, duration: 0.45, stagger: 0.12, ease: 'back.out(1.6)' });
  const first = panel.querySelector('section');
  if (first) tl.from(first.querySelectorAll('h2, .stats > *, .row .btn'), { y: 12, opacity: 0, duration: 0.3, stagger: 0.05 }, 0.15);
  panel.querySelectorAll<SVGElement>('.paws svg.on').forEach((paw, k) => {
    tl.fromTo(paw, { scale: 2.6, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(3)', onStart: () => play('stamp') }, 0.45 + k * 0.22);
  });
  if (badges) tl.call(() => play('badge'), [], 0.5 + 0.22 * 3);
  panel.querySelectorAll('.tilt-l').forEach((card) => tl.fromTo(card, { rotateY: 90, transformPerspective: 800 }, { rotateY: 0, duration: 0.6, ease: 'power2.out' }, 0.9));
}
const watch = new MutationObserver(() => {
  document.querySelectorAll<HTMLElement>('[id$="-result"]').forEach((p) => { if (!p.hidden && p.children.length) void celebrate(p); });
});
watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
