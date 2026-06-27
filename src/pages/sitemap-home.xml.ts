import type { APIRoute } from 'astro';
import { SITE } from '../consts';

// tools-home's own pages (hub + legal), referenced by the sitemap index. Every URL
// uses a trailing slash to match the canonical tags.
const PAGES = ['/', '/privacy/', '/terms/', '/about/', '/contact/'];

export const GET: APIRoute = () => {
  const urls = PAGES.map((p) => new URL(p, SITE.url).href);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
