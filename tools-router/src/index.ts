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

/** Engine URL prefix (first path segment) -> the real (suffixed) Pages origin host. */
export const ORIGINS: Record<string, string> = {
  image: 'image-converter-69t.pages.dev',
  'fancy-text': 'fancy-text-generator-2p7.pages.dev',
  json: 'json-tools-b17.pages.dev',
  qr: 'qr-tools-3u8.pages.dev',
  pdf: 'pdf-tools-bh7.pages.dev',
  unit: 'unit-converter-ebc.pages.dev',
  hash: 'hash-tools.pages.dev',
  time: 'timestamp-converter-anq.pages.dev',
  encode: 'encode-decode-9qm.pages.dev',
  color: 'color-tools-8h2.pages.dev',
  password: 'password-tools.pages.dev',
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
  // Own keys only: `in` also finds Object.prototype names (/constructor, /__proto__…).
  if (Object.hasOwn(ORIGINS, seg)) {
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

/**
 * The Content-Security-Policy every page gets, sent as Report-Only until the live
 * consoles are clean. 'unsafe-inline' because Astro's inline scripts change per build
 * and Cloudflare's injected loader per request (no hash or nonce can match them);
 * the data:/blob: sources cover inline fonts, images, downloads and heic2any's
 * worker. Only /image allows 'unsafe-eval': that worker runs `new Function`.
 */
function contentSecurityPolicy(prefix: string): string {
  const unsafeEval = prefix === '/image' ? " 'unsafe-eval'" : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${unsafeEval} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' data: blob: https://cloudflareinsights.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
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

    // Headers on a fetch() result are immutable in Workers, so copy the response first.
    const res = new Response(originRes.body, originRes);

    // Pass the response through, fixing only a leaking or unprefixed redirect,
    // and add the security headers Pages does not send.
    const location = res.headers.get('location');
    if (location) res.headers.set('location', rewriteLocation(location, host, prefix));
    res.headers.set('Content-Security-Policy-Report-Only', contentSecurityPolicy(prefix));
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('Strict-Transport-Security', 'max-age=31536000');
    return res;
  },
};
