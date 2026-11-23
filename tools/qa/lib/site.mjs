// Shared helpers: where the built site lives, and the list of built pages.
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const QA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = join(QA_DIR, '..', '..', 'apps', 'web', 'dist');
export const PORT = Number(process.env.QA_PORT || 4329);
export const ORIGIN = `http://127.0.0.1:${PORT}`;

/** Every file under a folder (recursive). */
export function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** URL path for a built HTML file: dist/games/logic/index.html -> /games/logic, dist/404.html -> /404. */
export function urlFor(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

/** Every built page, discovered from the HTML files in dist (puzzle JSON is skipped). */
export function pages() {
  if (!existsSync(DIST)) throw new Error(`No build found at ${DIST}. Run "pnpm qa" (it builds first) or build the web app.`);
  return walk(DIST).filter((f) => f.endsWith('.html')).map((file) => ({ file, url: urlFor(file) })).sort((a, b) => a.url.localeCompare(b.url));
}

/** Map a URL path to the file in dist that would serve it, or null. Mirrors static hosting (Cloudflare Pages). */
export function resolvePath(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.includes('..')) return null;
  const base = join(DIST, p);
  const tries = p.endsWith('/') ? [join(base, 'index.html')] : [base, base + '.html', join(base, 'index.html')];
  for (const t of tries) if (existsSync(t) && statSync(t).isFile()) return t;
  return null;
}
