// Keep keyboard focus on the same control when a game redraws its board.
// Boards re-render by replacing their HTML, which destroys the focused button: focus fell back to <body> and a
// keyboard player had to Tab through the whole page again after every move. This watches `root`; when a redraw
// removes the focused control, it focuses the matching control in the new markup (same tag and data-* attributes),
// or, if that control no longer exists, the control now in the same position.
// It never steals focus: if the player has moved focus elsewhere, nothing happens.

/** CSS selectors for an element, most specific first: id, then all data-* attributes, then the first data-* (+ data-i). */
function selectorsFor(el: Element): string[] {
  const esc = (v: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(v) : v.replace(/["\\]/g, '\\$&'));
  const data = Array.from(el.attributes).filter((a) => a.name.startsWith('data-'));
  const attr = (a: Attr): string => `[${a.name}="${esc(a.value)}"]`;
  const tag = el.tagName.toLowerCase(), out: string[] = [];
  if (el.id) out.push(`#${esc(el.id)}`);
  if (data.length) out.push(tag + data.map(attr).join(''));
  if (data.length > 1) {
    const i = data.find((a) => a.name === 'data-i');
    out.push(tag + attr(data[0]!) + (i && i !== data[0] ? attr(i) : ''));
  }
  return out;
}

const focusable = (el: Element | null): el is HTMLElement =>
  !!el && el instanceof HTMLElement && !(el as HTMLButtonElement).disabled && el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length > 0;

/** Start keeping focus inside `root`. Returns a function that stops it. */
export function keepFocus(root: HTMLElement): () => void {
  let last: { el: Element; sels: string[]; pos: number } | null = null;
  const controls = (): HTMLElement[] => Array.from(root.querySelectorAll('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')).filter(focusable);
  const lost = (): boolean => { const a = document.activeElement; return !a || a === document.body || !a.isConnected; };

  const onIn = (e: FocusEvent): void => {
    const t = e.target as Element;
    last = { el: t, sels: selectorsFor(t), pos: controls().indexOf(t as HTMLElement) };
  };
  // Focus moved on purpose (Tab away, click elsewhere): forget it. A redraw removes the element instead.
  const onOut = (): void => { queueMicrotask(() => { if (last?.el.isConnected && document.activeElement !== last.el) last = null; }); };
  const restore = (): void => {
    if (!last || last.el.isConnected || !lost()) return;
    for (const s of last.sels) {
      const next = root.querySelector(s);
      if (focusable(next)) { next.focus({ preventScroll: true }); last = { ...last, el: next }; return; }
    }
    // The control is gone for good (a trail moved into the answer, the quiz moved on): focus whatever now sits in
    // the same place, so the player continues from there instead of from the top of the page.
    const all = controls();
    if (last.pos >= 0 && all.length) { const next = all[Math.min(last.pos, all.length - 1)]!; next.focus({ preventScroll: true }); last = { el: next, sels: selectorsFor(next), pos: all.indexOf(next) }; }
  };
  const mo = new MutationObserver(restore);
  root.addEventListener('focusin', onIn);
  root.addEventListener('focusout', onOut);
  mo.observe(root, { childList: true, subtree: true });
  return () => { mo.disconnect(); root.removeEventListener('focusin', onIn); root.removeEventListener('focusout', onOut); };
}

/** Containers whose buttons form a board that arrow keys can move around. */
export const ARROW_BOARDS = '.board, .hexboard, .lineup, [role="grid"], [data-arrows]';
const DIRS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
/**
 * Pick the control to move to from `from` in direction (dx, dy): the nearest one whose centre lies that way,
 * preferring ones in the same row or column. Works for square grids, hex boards and lines alike.
 */
export function nearestInDirection(from: DOMRect, items: { rect: DOMRect }[], dx: number, dy: number): number {
  const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
  let best = -1, bestScore = Infinity;
  items.forEach((it, i) => {
    const x = it.rect.left + it.rect.width / 2 - cx, y = it.rect.top + it.rect.height / 2 - cy;
    const along = x * dx + y * dy, across = Math.abs(x * dy) + Math.abs(y * dx);
    if (along <= 1) return; // not in that direction
    const score = along + across * 2;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}
/** Arrow keys move focus between the buttons of a game board inside `root`. Returns a cleanup function. */
export function arrowNav(root: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent): void => {
    const d = DIRS[e.key]; if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.matches('input, textarea, select, [contenteditable]')) return;
    const board = t.closest<HTMLElement>(ARROW_BOARDS); if (!board || !root.contains(board)) return;
    const items = Array.from(board.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'))
      .filter((x) => x !== t && !(x as HTMLButtonElement).disabled && x.getClientRects().length > 0)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }));
    const k = nearestInDirection(t.getBoundingClientRect(), items, d[0], d[1]);
    e.preventDefault(); // stay put at an edge rather than scrolling the page
    if (k >= 0) items[k]!.el.focus();
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}
