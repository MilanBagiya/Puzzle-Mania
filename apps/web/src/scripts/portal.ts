// Portal behaviour: sidebar (collapse on desktop, drawer on smaller screens), live search, streak chip,
// "Solved today" badges on tiles, and sorting/filtering on game grids.
import { loadProgress, streakInfo, todayIso } from '@wild-daily/core';

const root = document.documentElement;
const wide = (): boolean => matchMedia('(min-width: 1100px)').matches;
// ---- sidebar ----
try { if (localStorage.getItem('wd-nav') === 'mini') root.setAttribute('data-nav', 'mini'); } catch { /* ignore */ }
function toggleNav(force?: boolean): void {
  const btn = document.querySelector<HTMLElement>('.topbar [data-act="nav"]'), scrim = document.querySelector<HTMLElement>('.navscrim');
  if (wide()) {
    const mini = root.getAttribute('data-nav') !== 'mini';
    if (mini) root.setAttribute('data-nav', 'mini'); else root.removeAttribute('data-nav');
    try { localStorage.setItem('wd-nav', mini ? 'mini' : 'full'); } catch { /* ignore */ }
    btn?.setAttribute('aria-expanded', String(!mini));
    return;
  }
  const open = force ?? !root.hasAttribute('data-drawer');
  if (open) root.setAttribute('data-drawer', ''); else root.removeAttribute('data-drawer');
  if (scrim) scrim.hidden = !open;
  btn?.setAttribute('aria-expanded', String(open));
  if (open) document.querySelector<HTMLElement>('#sidenav a')?.focus();
  else if (force === false || document.activeElement?.closest('#sidenav')) btn?.focus(); // closing: focus goes back to the menu button
}
document.addEventListener('click', (e) => { const t = (e.target as HTMLElement).closest('[data-act="nav"]'); if (t) { e.preventDefault(); toggleNav(); } });
document.addEventListener('keydown', (e) => {
  if (!root.hasAttribute('data-drawer')) return;
  if (e.key === 'Escape') { toggleNav(false); return; }
  if (e.key !== 'Tab') return;
  // The open drawer is modal: Tab cycles through its links and the menu button, never the page behind it.
  const items = [document.querySelector<HTMLElement>('.topbar [data-act="nav"]'), ...document.querySelectorAll<HTMLElement>('#sidenav a, #sidenav button')].filter((x): x is HTMLElement => !!x && x.offsetParent !== null);
  if (!items.length) return;
  const i = items.indexOf(document.activeElement as HTMLElement), n = items.length;
  e.preventDefault();
  items[i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + n) % n]!.focus();
});

// ---- streak chip ----
const p = loadProgress(), today = todayIso();
const chip = document.getElementById('tb-streak');
const st = streakInfo(p, today);
if (chip && st.current > 0) { chip.hidden = false; chip.querySelector('b')!.textContent = String(st.current); chip.title = `${st.current}-day streak`; }

// ---- solved-today badges on tiles ----
export function markSolved(scope: ParentNode = document): void {
  const day = p.days[today] ?? {};
  scope.querySelectorAll<HTMLElement>('.tile').forEach((t) => {
    const keys = (t.getAttribute('data-keys') ?? '').split(' ').filter(Boolean);
    const done = keys.length > 0 && keys.some((k) => (day as Record<string, unknown>)[k]);
    t.classList.toggle('done', done);
    const b = t.querySelector<HTMLElement>('.tbadge.solved'); if (b) b.hidden = !done;
  });
}
markSolved();

// ---- live search ----
type Hit = { id: string; n: string; h: string; c: string; b: string };
const idx: Hit[] = (() => { try { return JSON.parse(document.getElementById('wd-search')?.textContent ?? '[]') as Hit[]; } catch { return []; } })();
const q = document.getElementById('tb-q') as HTMLInputElement | null, box = document.getElementById('tb-results');
export const searchGames = (term: string): Hit[] => {
  const t = term.trim().toLowerCase(); if (!t) return [];
  return idx.map((h) => ({ h, s: h.n.toLowerCase().startsWith(t) ? 3 : h.n.toLowerCase().includes(t) ? 2 : h.c.toLowerCase().includes(t) ? 1.5 : h.b.toLowerCase().includes(t) ? 1 : 0 })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.h);
};
let sel = -1;
function renderResults(): void {
  if (!q || !box) return;
  const hits = searchGames(q.value).slice(0, 7);
  if (!q.value.trim()) { closeResults(); return; }
  box.innerHTML = hits.length
    ? hits.map((h, i) => `<a role="option" id="tbr-${i}" class="tb-hit${i === sel ? ' on' : ''}" href="${h.h}" aria-selected="${i === sel}"><b>${h.n}</b><small>${h.c}</small></a>`).join('') + `<a class="tb-all" href="/games?q=${encodeURIComponent(q.value.trim())}">See all results</a>`
    : `<p class="tb-none">No games match “${q.value.trim().replace(/[<>&"]/g, '')}”.</p>`;
  box.hidden = false;
  if (sel >= 0) q.setAttribute('aria-activedescendant', `tbr-${sel}`); else q.removeAttribute('aria-activedescendant');
  q.setAttribute('aria-expanded', 'true');
}
q?.addEventListener('input', () => { sel = -1; renderResults(); });
q?.addEventListener('focus', renderResults);
q?.addEventListener('keydown', (e) => {
  const n = box?.querySelectorAll('.tb-hit').length ?? 0;
  if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(n - 1, sel + 1); renderResults(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(-1, sel - 1); renderResults(); }
  else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); (box?.querySelectorAll<HTMLAnchorElement>('.tb-hit')[sel])?.click(); }
  else if (e.key === 'Escape') closeResults();
});
const closeResults = (): void => { if (box) box.hidden = true; q?.setAttribute('aria-expanded', 'false'); q?.removeAttribute('aria-activedescendant'); sel = -1; };
document.addEventListener('click', (e) => { if (box && q && !(e.target as HTMLElement).closest('.tb-search')) closeResults(); });
// Tabbing out of the search box (or its results) closes the list, so it never covers the page.
document.querySelector('.tb-search')?.addEventListener('focusout', (e) => { const to = (e as FocusEvent).relatedTarget as HTMLElement | null; if (!to?.closest('.tb-search')) closeResults(); });

// ---- game grids: sort, filter by category chips, search query ----
const grid = document.querySelector<HTMLElement>('[data-grid]');
if (grid) {
  const tiles = [...grid.querySelectorAll<HTMLElement>('.tile')];
  const sortSel = document.getElementById('grid-sort') as HTMLSelectElement | null;
  const params = new URLSearchParams(location.search || (window as unknown as { __wdSearch?: string }).__wdSearch || '');
  const term = params.get('q') ?? '';
  if (sortSel && params.get('sort')) sortSel.value = params.get('sort')!;
  const countEl = document.getElementById('grid-count');
  const apply = (): void => {
    const mode = sortSel?.value ?? 'featured';
    const ok = new Set(term ? searchGames(term).map((h) => h.id) : tiles.map((t) => t.getAttribute('data-id')));
    const sorted = tiles.slice().sort((a, b) => {
      const n = (el: HTMLElement, k: string): number => Number(el.getAttribute(k) ?? 0);
      if (mode === 'quick') return n(a, 'data-min') - n(b, 'data-min') || n(a, 'data-feat') - n(b, 'data-feat');
      if (mode === 'az') return (a.getAttribute('data-name') ?? '').localeCompare(b.getAttribute('data-name') ?? '');
      if (mode === 'new') return n(b, 'data-new') - n(a, 'data-new') || n(a, 'data-feat') - n(b, 'data-feat');
      return n(a, 'data-feat') - n(b, 'data-feat');
    });
    let shown = 0;
    sorted.forEach((t) => { const vis = ok.has(t.getAttribute('data-id')); t.hidden = !vis; if (vis) shown++; grid.appendChild(t); });
    if (countEl) countEl.textContent = term ? `${shown} ${shown === 1 ? 'game matches' : 'games match'} “${term}”` : `${shown} games`;
    const empty = document.getElementById('grid-empty'); if (empty) empty.hidden = shown > 0;
  };
  if (term && q) q.value = term;
  sortSel?.addEventListener('change', apply);
  apply();
}
