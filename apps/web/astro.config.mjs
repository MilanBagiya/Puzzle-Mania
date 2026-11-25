// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL (e.g. in Cloudflare Pages settings) once the domain is bought. Never hard-code it.
const site = process.env.SITE_URL || 'https://example.com';
// On Cloudflare Pages (CF_PAGES is set) a missing SITE_URL means canonical links, the sitemap and structured data
// all point at example.com. Warn loudly, but don't fail: the domain isn't bought yet. Switch to failing once it is.
if (process.env.CF_PAGES && !process.env.SITE_URL) {
  const line = '!'.repeat(78);
  console.warn(`\n${line}\n!! SITE_URL is not set in this Cloudflare Pages build.\n!! Canonical links, the sitemap and structured data will point at ${site}.\n!! Set SITE_URL in Cloudflare Pages > Settings > Environment variables.\n${line}\n`);
}

// Pages marked noindex must stay out of the sitemap (`pnpm qa` checks this). /dev/ = internal design pages.
const NOINDEX = /\/(journal|stats|recent|trek\/play|dev\/.*)\/?$/;

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap({ filter: (page) => !NOINDEX.test(new URL(page).pathname) })],
});
