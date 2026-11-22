// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL (e.g. in Cloudflare Pages settings) once the domain is bought. Never hard-code it.
const site = process.env.SITE_URL || 'https://example.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap({ filter: (page) => !/\/journal\/?$/.test(page) })],
});
