/**
 * tools-router — Cloudflare Worker. A pure reverse proxy for tools.luci-studio.com.
 *
 * The first path segment selects the origin Cloudflare Pages project; everything
 * else (the hub, legal pages, ads.txt, robots.txt, sitemap.xml) is served by
 * tools-home. Each engine repo sets Astro `base: '/<engine>'`, so the request path
 * already matches the origin — no path rewriting is needed. The one non-trivial
 * bit is rewriting redirect `Location` headers that would otherwise leak the
 * `*.pages.dev` hostname (Pages 307s the no-slash form to the slash form).
 *
 * The routing logic is factored into pure helpers so it can be unit-tested without
 * a network or the Workers runtime (see index.test.ts).
 */

export const HOST = 'tools.luci-studio.com';

/** URL prefix (first path segment) → Cloudflare Pages project name. */
export const PROJECT_MAP: Record<string, string> = {
  image: 'image-converter',
  'fancy-text': 'fancy-text-generator',
  json: 'json-tools',
  qr: 'qr-tools',
  pdf: 'pdf-tools',
};

/** Anything not owned by an engine is served by the root project. */
export const HOME_PROJECT = 'tools-home';

/** Pick the origin Pages project for a pathname (first segment, else the home project). */
export function pickProject(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return PROJECT_MAP[segment] ?? HOME_PROJECT;
}

/** Build the origin URL on `<project>.pages.dev`, preserving path and query. */
export function buildTarget(project: string, url: URL): string {
  return `https://${project}.pages.dev${url.pathname}${url.search}`;
}

/** Rewrite a redirect `Location` that points at the origin back to the public host. */
export function rewriteLocation(location: string, project: string): string {
  return location.replace(`https://${project}.pages.dev`, `https://${HOST}`);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const project = pickProject(url.pathname);
    const target = buildTarget(project, url);

    // Strip the inbound Host so fetch derives the origin's own Host from the URL.
    const headers = new Headers(request.headers);
    headers.delete('host');

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const originRes = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit);

    // Pass the response straight through, fixing only a leaking redirect target.
    const location = originRes.headers.get('location');
    if (!location) return originRes;

    const fixedHeaders = new Headers(originRes.headers);
    fixedHeaders.set('location', rewriteLocation(location, project));
    return new Response(originRes.body, {
      status: originRes.status,
      statusText: originRes.statusText,
      headers: fixedHeaders,
    });
  },
};
