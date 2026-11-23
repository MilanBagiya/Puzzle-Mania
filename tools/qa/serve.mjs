// Tiny static server for apps/web/dist (no dependencies). Serves index.html for folders and 404.html for misses.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { DIST, PORT, resolvePath } from './lib/site.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://x');
  const file = resolvePath(pathname);
  const send = (status, path) => {
    res.writeHead(status, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(path));
  };
  if (file) return send(200, file);
  const nf = join(DIST, '404.html');
  try { send(404, nf); } catch { res.writeHead(404); res.end('Not found'); }
}).listen(PORT, '127.0.0.1', () => console.log(`qa server: ${DIST} on http://127.0.0.1:${PORT}`));
