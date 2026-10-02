/**
 * Routing for tools-router: which origin serves a public path, and how an origin
 * redirect maps back onto the public host. Pure, so it is unit-tested without a
 * network. It lives outside index.ts because workerd treats every export of the
 * Worker's main module as an entrypoint and refuses to start on a plain value.
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
