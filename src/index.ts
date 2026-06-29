/**
 * tools-router — Cloudflare Worker. A reverse proxy for tools.luci-studio.com.
 *
 * The first path segment selects the origin Cloudflare Pages project; everything
 * else is served by tools-home. Two wrinkles the original design missed:
 *
 *  1. `<engine>.pages.dev` subdomains are globally unique, so the plain names were
 *     already taken — Cloudflare assigned suffixed hosts (image-converter-69t…).
 *  2. Astro's `base: '/<engine>'` does NOT nest the build output, so each engine's
 *     dist is served at the origin ROOT (/heic-to-jpg/, not /image/heic-to-jpg/).
 *     The Worker therefore strips the /<engine> prefix before proxying, and
 *     re-adds it when rewriting redirect Location headers.
 *
 * The routing helpers are pure so they can be unit-tested without a network.
 */

export const HOST = 'tools.luci-studio.com';

/**
 * Cloudflare Web Analytics beacon. Injected here (once, at the host root) rather
 * than per engine: edge auto-inject does not survive this Worker proxy, so the
 * single shared token is appended to every HTML response instead.
 */
const CF_BEACON =
  `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" ` +
  `data-cf-beacon='{"token":"af2d0f79084a4fa5a118b88ae59c2be3"}'></script>`;

/** Engine URL prefix (first path segment) -> the real (suffixed) Pages origin host. */
export const ORIGINS: Record<string, string> = {
  image: 'image-converter-69t.pages.dev',
  'fancy-text': 'fancy-text-generator-2p7.pages.dev',
  json: 'json-tools-b17.pages.dev',
  qr: 'qr-tools-3u8.pages.dev',
  pdf: 'pdf-tools-bh7.pages.dev',
};

/** Everything not owned by an engine is served by the root project (base '/'). */
export const HOME_ORIGIN = 'tools-home.pages.dev';

export interface Route {
  /** origin hostname to proxy to */
  host: string;
  /** the public prefix that was stripped ('' for the home project) */
  prefix: string;
  /** path to request on the origin (engine prefix removed) */
  originPath: string;
}

/**
 * Resolve a public pathname to its origin host + path. Engine dist is served at
 * the origin root, so the /<engine> segment is stripped; the home project keeps
 * the path unchanged.
 */
export function resolveRoute(pathname: string): Route {
  const seg = pathname.split('/')[1] ?? '';
  if (seg in ORIGINS) {
    return {
      host: ORIGINS[seg],
      prefix: `/${seg}`,
      originPath: pathname.slice(seg.length + 1) || '/',
    };
  }
  return { host: HOME_ORIGIN, prefix: '', originPath: pathname };
}

/**
 * Map an origin redirect `Location` back to the public host + prefix:
 *  - absolute to the origin -> swap host and re-add the prefix
 *  - root-relative path     -> re-add the prefix
 *  - anything else          -> unchanged
 */
export function rewriteLocation(location: string, host: string, prefix: string): string {
  const originBase = `https://${host}`;
  if (location.startsWith(originBase)) {
    return `https://${HOST}${prefix}${location.slice(originBase.length)}`;
  }
  if (location.startsWith('/')) {
    return `${prefix}${location}`;
  }
  return location;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { host, prefix, originPath } = resolveRoute(url.pathname);
    const target = `https://${host}${originPath}${url.search}`;

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

    // Pass the response through, fixing only a leaking or unprefixed redirect.
    const location = originRes.headers.get('location');
    if (!location) {
      // Inject the Web Analytics beacon into HTML; leave assets/JSON untouched.
      const contentType = originRes.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) {
        return new HTMLRewriter()
          .on('body', { element(el) { el.append(CF_BEACON, { html: true }); } })
          .transform(originRes);
      }
      return originRes;
    }

    const fixedHeaders = new Headers(originRes.headers);
    fixedHeaders.set('location', rewriteLocation(location, host, prefix));
    return new Response(originRes.body, {
      status: originRes.status,
      statusText: originRes.statusText,
      headers: fixedHeaders,
    });
  },
};
