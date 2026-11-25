// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL (e.g. in Cloudflare Pages settings) once the domain is bought. Never hard-code it.
const site = process.env.SITE_URL || 'https://example.com';

// Pages marked noindex must stay out of the sitemap (`pnpm qa` checks this). /dev/ = internal design pages.
const NOINDEX = /\/(journal|stats|recent|trek\/play|dev\/.*)\/?$/;

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap({ filter: (page) => !NOINDEX.test(new URL(page).pathname) })],
});
