// 8. Crawl rules: the sitemap may only list real, indexable pages, and robots.txt must not block a
// noindex page (crawlers have to fetch a page to see its noindex). Reads the built files; no browser.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, pages, resolvePath } from './site.mjs';

const isNoindex = (html) => /<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b/i.test(html);

export function checkSeo() {
  const fails = [];
  const notes = [];
  const all = pages();
  const noindex = new Set(all.filter((p) => isNoindex(readFileSync(p.file, 'utf8'))).map((p) => p.url));

  const maps = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (!maps.length) fails.push('no sitemap-N.xml file in the build');
  const listed = new Set();
  for (const f of maps) {
    for (const m of readFileSync(join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = new URL(m[1]).pathname.replace(/(.)\/$/, '$1');
      listed.add(path);
      const file = resolvePath(path);
      if (!file) fails.push(`${f} lists ${path}, which is not a built page`);
      else if (isNoindex(readFileSync(file, 'utf8'))) fails.push(`${f} lists ${path}, which is noindex`);
    }
  }
  for (const p of all) if (!noindex.has(p.url) && p.url !== '/404' && !listed.has(p.url)) notes.push(`${p.url} is indexable but not in the sitemap`);

  const robotsFile = join(DIST, 'robots.txt');
  if (!existsSync(robotsFile)) fails.push('robots.txt is missing');
  else {
    for (const m of readFileSync(robotsFile, 'utf8').matchAll(/^Disallow:\s*(\S+)/gim)) {
      const blocked = m[1].replace(/(.)\/$/, '$1');
      for (const url of noindex) if (url === blocked || url.startsWith(blocked + '/')) fails.push(`robots.txt blocks ${url}, so crawlers can't see its noindex`);
    }
  }
  return { fails, notes, listed: listed.size, noindex: [...noindex] };
}
