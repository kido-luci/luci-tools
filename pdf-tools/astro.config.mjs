// @ts-check
import { defineConfig } from 'astro/config';

// Engine-prefix scheme: this repo owns /pdf/*. `base` makes every internal
// link, canonical and sitemap entry already match the production path. It does
// not nest the build output, though: dist/ is served at the Pages origin root,
// so the tools-router Worker strips /pdf before proxying and re-adds it to
// redirect Location headers.
export default defineConfig({
  site: 'https://tools.luci-studio.com',
  base: '/pdf',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
