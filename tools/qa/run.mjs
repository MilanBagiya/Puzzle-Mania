// `pnpm qa`: build the site, serve apps/web/dist, run every check, print a summary. Exits non-zero on any failure.
// Options: --no-build (check the existing dist as it is). Env: SITE_URL (used for the build; defaults to the local
// QA server address, since the checks only need a working build), QA_PORT, QA_WORKERS.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { QA_DIR, ORIGIN } from './lib/site.mjs';

const root = join(QA_DIR, '..', '..');
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts }).status ?? 1;

if (!process.argv.includes('--no-build')) {
  const env = { ...process.env, SITE_URL: process.env.SITE_URL || ORIGIN };
  console.log(`qa: building the site (SITE_URL=${env.SITE_URL})…`);
  if (run('pnpm', ['--filter', '@wild-daily/web', 'build'], { cwd: root, env }) !== 0) {
    console.error('qa: the build failed, so nothing was checked.');
    process.exit(1);
  }
}
process.exit(run('pnpm', ['exec', 'playwright', 'test', '--config', 'playwright.config.mjs'], { cwd: QA_DIR }));
