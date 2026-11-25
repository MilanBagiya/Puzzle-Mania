// Game tile markup, shared by server-rendered pages and client scripts.
// A papercraft card: the cover print on top, then the name, the game's one-line hook, and a footer
// with the category, time and a Play tab ("Again" once solved today).
import { cover } from '@wild-daily/ui';
import { CATS, ICON, type Entry } from '../data/catalog';

export interface TileOpts { label?: string; sub?: string; hook?: string; href?: string; coverId?: string; key?: string }

const svg = (d: string, size: number): string =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;

const CHECK = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
/** "3 animals · 3–5 min": each part may move to a new line, but never splits (no orphan "min"). */
const keepTogether = (s: string): string => s.split(' · ').map((p) => `<span class="nw">${p}</span>`).join('<span class="sep"> · </span>');

export function tileHtml(e: Entry, o: TileOpts = {}): string {
  const cat = CATS.find((c) => c.id === e.cat);
  const badges = [
    e.daily ? '<span class="tbadge daily">Daily</span>' : '',
    e.isNew ? '<span class="tbadge new">New</span>' : '',
    '<span class="tbadge season">In season</span>',
  ].join('');
  return `<a class="tile" href="${o.href ?? e.href}" data-id="${e.id}" data-keys="${(o.key ? [o.key] : e.keys).join(' ')}" data-season="${e.season}" data-cat="${e.cat}" data-min="${e.minutes}" data-feat="${e.featured}" data-new="${e.isNew ? 1 : 0}" data-name="${e.name}">
<span class="tile-art">${cover(o.coverId ?? e.id, e.name)}<span class="tile-badges">${badges}<span class="tbadge solved" hidden>${CHECK}Solved</span></span></span>
<span class="tile-body">
<b class="tile-title">${o.label ?? e.name}</b>
<span class="tile-hook">${o.hook ?? e.hook ?? e.blurb}</span>
<span class="tile-foot"><span class="tile-info">${cat ? `<span class="tile-cat">${svg(ICON[cat.icon] ?? '', 14)}${cat.name}</span>` : ''}<span class="tile-time">${keepTogether(o.sub ?? e.time)}</span></span><span class="tile-go" aria-hidden="true"><span class="go-play">Play</span><span class="go-again">Again</span><svg viewBox="0 0 24 24" width="12" height="12"><path d="M8 5v14l11-7z" fill="currentColor"></path></svg></span></span>
</span>
</a>`;
}
