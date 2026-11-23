// Game tile markup, shared by server-rendered pages and client scripts.
import { cover } from '@wild-daily/ui';
import type { Entry } from '../data/catalog';

export interface TileOpts { label?: string; sub?: string; href?: string; coverId?: string; key?: string }
export function tileHtml(e: Entry, o: TileOpts = {}): string {
  const badges = [
    e.daily ? '<span class="tbadge daily">Daily</span>' : '',
    e.isNew ? '<span class="tbadge new">New</span>' : '',
    `<span class="tbadge season">In season</span>`,
  ].join('');
  return `<a class="tile" href="${o.href ?? e.href}" data-id="${e.id}" data-keys="${(o.key ? [o.key] : e.keys).join(' ')}" data-season="${e.season}" data-cat="${e.cat}" data-min="${e.minutes}" data-feat="${e.featured}" data-new="${e.isNew ? 1 : 0}" data-name="${e.name}">
<span class="tile-art">${cover(o.coverId ?? e.id, e.name)}</span>
<span class="tile-badges">${badges}<span class="tbadge solved" hidden>✓ Solved</span></span>
<span class="tile-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14l11-7z" fill="currentColor"></path></svg></span>
<span class="tile-name"><b>${o.label ?? e.name}</b><small>${o.sub ?? e.time}</small></span>
</a>`;
}
