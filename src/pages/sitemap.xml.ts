import type { APIRoute } from 'astro';
import { SITE, TOOLS } from '../consts';

// Per-repo sitemap, emitted at /encode/sitemap.xml. tools-home references this
// from its sitemap index. Every URL uses a trailing slash to match canonicals.
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL; // /encode/
  const paths = [base, ...TOOLS.map((t) => `${base}${t.slug}/`)];
  const urls = paths.map((p) => new URL(p, SITE.url).href);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
