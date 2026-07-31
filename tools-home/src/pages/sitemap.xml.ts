import type { APIRoute } from 'astro';
import { SITE, ENGINES } from '../consts';

// Sitemap INDEX (served at /sitemap.xml). It references tools-home's own pages
// sitemap plus every engine repo's own /<engine>/sitemap.xml. A sitemap index may
// only point at other sitemaps, so the home pages live in /sitemap-home.xml.
export const GET: APIRoute = () => {
  const sitemaps = [
    new URL('/sitemap-home.xml', SITE.url).href,
    ...ENGINES.map((e) => new URL(`/${e.prefix}/sitemap.xml`, SITE.url).href),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>\n    <loc>${s}</loc>\n  </sitemap>`).join('\n')}
</sitemapindex>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
