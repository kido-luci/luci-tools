// @ts-check
import { defineConfig } from 'astro/config';

// Root project (tools-home): owns the hub, legal pages, ads.txt, robots.txt and the
// sitemap index. base: '/' — the tools-router Worker sends every path NOT owned by
// an engine (/, /privacy, /ads.txt, /sitemap.xml, …) here.
export default defineConfig({
  site: 'https://tools.luci-studio.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
