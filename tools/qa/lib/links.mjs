// 1. Links: every internal href in the built HTML must resolve to a built file. Also scans built JS for
// page paths (links made by scripts) and lists orphan pages that nothing links to.
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, pages, resolvePath, walk } from './site.mjs';

const ORIGIN = 'http://qa.local';
const keyOf = (file) => relative(DIST, file).split(sep).join('/');

export function checkLinks() {
  const all = pages();
  const broken = [];          // failures
  const falsePositives = [];  // reported, not failures
  const inbound = new Map(all.map((p) => [keyOf(p.file), new Set()]));

  for (const page of all) {
    const html = readFileSync(page.file, 'utf8');
    for (const m of html.matchAll(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const raw = (m[1] ?? m[2] ?? '').trim();
      if (!raw || raw.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue; // hash, mailto:, https:, //cdn
      const url = new URL(raw.replace(/&amp;/g, '&'), ORIGIN + (page.url.endsWith('/') ? page.url : page.url + '/'));
      const target = resolvePath(url.pathname);
      if (!target) { broken.push(`${page.url} links to ${raw} (no such page or file)`); continue; }
      const k = keyOf(target);
      if (inbound.has(k) && target !== page.file) inbound.get(k).add(page.url);
    }
  }

  // Page paths written inside built JavaScript (for example search results or "Next" buttons).
  const jsFiles = walk(DIST).filter((f) => /\.m?js$/.test(f));
  const jsSeen = new Set();
  for (const f of jsFiles) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(["'`])(\/(?:[a-z0-9][a-z0-9-]*)(?:\/[a-z0-9][a-z0-9-]*)*\/?)(\1|\$\{|\?|#)/g)) {
      const [, , path, end] = m;
      const where = keyOf(f);
      if (path.startsWith('/_astro') || path.startsWith('/puzzles')) continue; // assets and data files, not pages
      const key = path + end;
      if (jsSeen.has(key)) continue; jsSeen.add(key);
      if (end === '${') { // template string: the rest of the path is filled in at run time
        falsePositives.push(`"${path}" in ${where} is the start of a template string (\`${path}\${…}\`), filled in at run time`);
        continue;
      }
      const target = resolvePath(path);
      if (!target) { broken.push(`script ${where} contains page path "${path}" (no such page)`); continue; }
      const k = keyOf(target);
      if (inbound.has(k)) inbound.get(k).add(`script:${where}`);
    }
  }

  const orphans = [...inbound].filter(([k, from]) => from.size === 0 && k !== '404.html').map(([k]) => '/' + k.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, ''));
  return { pages: all.length, broken, falsePositives, orphans };
}
