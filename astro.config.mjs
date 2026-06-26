// @ts-check
import { defineConfig } from 'astro/config';

// Engine-prefix scheme: this repo owns /pdf/*. `base` makes every internal
// link, canonical and sitemap entry already match the production path, so the
// tools-router Worker is a pure pass-through (no rewriting).
export default defineConfig({
  site: 'https://tools.luci-studio.com',
  base: '/pdf',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
