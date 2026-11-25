// Keep keyboard focus on the board. Games re-draw by replacing their HTML, which throws away the
// focused button and sends keyboard and screen-reader players back to the top of the page.
// This puts focus back on the same button (or the first usable one) after every re-draw.

/** Game containers whose contents get re-drawn. */
export const BOARD_ROOT = '[id$="-game"], #dc, #tut, #hx';

const VALUED = ['data-fs', 'data-g', 'data-nb', 'data-nb-act', 'data-st', 'data-st-act', 'data-mr', 'data-mr-act', 'data-in', 'data-out', 'data-i'];
const FLAGS = ['data-check', 'data-hint', 'data-clear'];

/** Selector that finds the "same" control again after the game re-draws its board. */
export function selectorFor(el: Element): string | null {
  for (const a of VALUED) {
    const v = el.getAttribute(a);
    if (v !== null) { const extra = a === 'data-fs' && el.getAttribute('data-i') ? `[data-i="${CSS.escape(el.getAttribute('data-i')!)}"]` : ''; return `[${a}="${CSS.escape(v)}"]${extra}`; }
  }
  for (const a of FLAGS) if (el.hasAttribute(a)) return `[${a}]`;
  return null;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"]):not(svg *)'; // a[href], not [href]: SVG <use> has href too
let last: { root: Element; sel: string | null } | null = null;

document.addEventListener('focusin', (e) => {
  const el = e.target as Element;
  const root = el.closest?.(BOARD_ROOT);
  last = root ? { root, sel: selectorFor(el) } : null;
});
// Leaving on purpose (Tab away, clicking empty space): stop restoring. A control removed by a
// re-draw, or disabled by the move (it can no longer hold focus), keeps `last`.
document.addEventListener('focusout', (e) => {
  const el = e.target as Element;
  const root = el.closest?.(BOARD_ROOT);
  if (!root) return; // focus leaving a non-board control (e.g. the top bar) says nothing about the board
  queueMicrotask(() => { if (el.isConnected && !el.matches(':disabled') && last?.root === root && !root.contains(document.activeElement)) last = null; });
});

new MutationObserver(() => {
  if (!last) return;
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) return;
  const { root, sel } = last;
  if (!root.isConnected) { last = null; return; }
  // The same control may now be disabled (a picked egg, a wrong guess): it can't take focus, so use the first usable one.
  const same = sel ? root.querySelector<HTMLElement>(sel) : null;
  const next = same && !same.matches(':disabled') ? same : root.querySelector<HTMLElement>(FOCUSABLE);
  next?.focus({ preventScroll: true });
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
