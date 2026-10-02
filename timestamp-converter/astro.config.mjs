// @ts-check
import { defineConfig } from 'astro/config';

// Engine-prefix scheme: this repo owns /time/*. `base` makes every internal
// link, canonical and sitemap entry already match the production path. It does
// not nest the build output, though: dist/ is served at the Pages origin root,
// so the tools-router Worker strips /time before proxying and re-adds it to
// redirect Location headers.
export default defineConfig({
  site: 'https://tools.luci-studio.com',
  base: '/time',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
