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
 * The routing helpers live in routes.ts, pure so they can be unit-tested without a
 * network. This module exports only the handler: workerd treats every export of
 * the main module as an entrypoint and refuses to start on a plain value.
 */

import { resolveRoute, rewriteLocation } from './routes';

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
