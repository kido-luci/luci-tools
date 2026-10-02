import { describe, it, expect, vi, afterEach } from 'vitest';
import worker, { resolveRoute, rewriteLocation, ORIGINS, HOME_ORIGIN, HOST } from './index';

// First segments that `in` finds on Object.prototype; each used to crash the Worker.
const PROTOTYPE_PATHS = ['/constructor/x', '/__proto__/x', '/valueOf', '/toString/', '/hasOwnProperty'];

describe('resolveRoute', () => {
  it('routes each engine prefix to its suffixed origin and strips the prefix', () => {
    expect(resolveRoute('/image/heic-to-jpg/')).toEqual({
      host: 'image-converter-69t.pages.dev',
      prefix: '/image',
      originPath: '/heic-to-jpg/',
    });
    expect(resolveRoute('/fancy-text/bold-text-generator/')).toEqual({
      host: 'fancy-text-generator-2p7.pages.dev',
      prefix: '/fancy-text',
      originPath: '/bold-text-generator/',
    });
    expect(resolveRoute('/json/json-formatter/').host).toBe('json-tools-b17.pages.dev');
    expect(resolveRoute('/qr/qr-code-generator/').host).toBe('qr-tools-3u8.pages.dev');
    expect(resolveRoute('/pdf/merge-pdf/').host).toBe('pdf-tools-bh7.pages.dev');
    expect(resolveRoute('/unit/cm-to-inches/').host).toBe('unit-converter-ebc.pages.dev');
    expect(resolveRoute('/hash/md5-hash-generator/').host).toBe('hash-tools.pages.dev');
    expect(resolveRoute('/time/unix-timestamp-converter/').host).toBe('timestamp-converter-anq.pages.dev');
    expect(resolveRoute('/encode/base64-encode/').host).toBe('encode-decode-9qm.pages.dev');
    expect(resolveRoute('/color/hex-to-rgb/').host).toBe('color-tools-8h2.pages.dev');
    expect(resolveRoute('/password/password-generator/').host).toBe('password-tools.pages.dev');
  });

  it('maps an engine hub (prefix root, with or without trailing slash) to the origin root', () => {
    expect(resolveRoute('/image/')).toEqual({
      host: 'image-converter-69t.pages.dev',
      prefix: '/image',
      originPath: '/',
    });
    expect(resolveRoute('/image').originPath).toBe('/');
  });

  it('strips the prefix for assets and the per-engine sitemap', () => {
    expect(resolveRoute('/image/_astro/app.js').originPath).toBe('/_astro/app.js');
    expect(resolveRoute('/pdf/sitemap.xml').originPath).toBe('/sitemap.xml');
  });

  it('sends root, legal and unknown prefixes to the home project unchanged', () => {
    expect(resolveRoute('/')).toEqual({ host: HOME_ORIGIN, prefix: '', originPath: '/' });
    expect(resolveRoute('/privacy/').originPath).toBe('/privacy/');
    expect(resolveRoute('/sitemap.xml').host).toBe(HOME_ORIGIN);
    expect(resolveRoute('/ads.txt').host).toBe(HOME_ORIGIN);
    expect(resolveRoute('/unknown/x')).toEqual({ host: HOME_ORIGIN, prefix: '', originPath: '/unknown/x' });
  });

  it('sends Object.prototype names to the home project, not up the prototype chain', () => {
    for (const p of PROTOTYPE_PATHS) {
      expect(resolveRoute(p)).toEqual({ host: HOME_ORIGIN, prefix: '', originPath: p });
    }
  });
});

describe('rewriteLocation', () => {
  it('rewrites an absolute origin redirect to the public host, re-adding the prefix', () => {
    expect(
      rewriteLocation(
        'https://image-converter-69t.pages.dev/heic-to-jpg/',
        'image-converter-69t.pages.dev',
        '/image',
      ),
    ).toBe('https://tools.luci-studio.com/image/heic-to-jpg/');
  });

  it('re-adds the prefix to a root-relative redirect', () => {
    expect(rewriteLocation('/heic-to-jpg/', 'image-converter-69t.pages.dev', '/image')).toBe(
      '/image/heic-to-jpg/',
    );
  });

  it('leaves home-project redirects on the public host (empty prefix)', () => {
    expect(rewriteLocation('/privacy/', HOME_ORIGIN, '')).toBe('/privacy/');
    expect(rewriteLocation('https://tools-home.pages.dev/privacy/', HOME_ORIGIN, '')).toBe(
      'https://tools.luci-studio.com/privacy/',
    );
  });

  it('leaves an external Location untouched', () => {
    expect(rewriteLocation('https://example.com/x', 'image-converter-69t.pages.dev', '/image')).toBe(
      'https://example.com/x',
    );
  });
});

describe('ORIGINS', () => {
  it('covers exactly the eleven engine prefixes', () => {
    expect(Object.keys(ORIGINS).sort()).toEqual([
      'color', 'encode', 'fancy-text', 'hash', 'image', 'json', 'password', 'pdf', 'qr', 'time', 'unit',
    ]);
  });
});

type SentInit = RequestInit & { duplex?: string };

/** Run the Worker against a stubbed origin; returns its response and the one upstream call. */
async function proxy(request: Request, origin: Response = new Response('ok')) {
  const upstream = vi.fn(async (_target: string, _init: SentInit) => origin);
  vi.stubGlobal('fetch', upstream);
  const res = await worker.fetch(request);
  expect(upstream).toHaveBeenCalledTimes(1);
  const [target, sent] = upstream.mock.calls[0];
  return { res, target, sent };
}

const get = (path: string, init?: RequestInit) => new Request(`https://${HOST}${path}`, init);

describe('fetch handler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('proxies an engine path to its origin, prefix stripped and query string kept', async () => {
    const { target, sent } = await proxy(get('/image/heic-to-jpg/?q=1&x=y'));
    expect(target).toBe('https://image-converter-69t.pages.dev/heic-to-jpg/?q=1&x=y');
    expect(sent.method).toBe('GET');
    expect(sent.redirect).toBe('manual');
    expect(sent.body).toBeUndefined();
    expect(sent).not.toHaveProperty('duplex');
  });

  it('sends root and legal paths to tools-home unchanged', async () => {
    expect((await proxy(get('/'))).target).toBe(`https://${HOME_ORIGIN}/`);
    expect((await proxy(get('/privacy/?a=1'))).target).toBe(`https://${HOME_ORIGIN}/privacy/?a=1`);
  });

  it('proxies Object.prototype names to tools-home instead of crashing', async () => {
    for (const p of PROTOTYPE_PATHS) {
      expect((await proxy(get(p))).target).toBe(`https://${HOME_ORIGIN}${p}`);
    }
  });

  it('drops the inbound Host header and forwards the others', async () => {
    const { sent } = await proxy(get('/pdf/merge-pdf/', { headers: { host: HOST, 'accept-language': 'vi' } }));
    const headers = new Headers(sent.headers);
    expect(headers.get('host')).toBeNull();
    expect(headers.get('accept-language')).toBe('vi');
  });

  it('streams a POST body to the origin with duplex: half', async () => {
    const request = get('/json/json-formatter/', { method: 'POST', body: 'payload' });
    const { sent } = await proxy(request);
    expect(sent.method).toBe('POST');
    expect(sent.duplex).toBe('half');
    expect(sent.body).toBe(request.body);
    expect(await new Response(sent.body).text()).toBe('payload');
  });

  it("passes the origin's status, headers and body through", async () => {
    const origin = new Response('missing', { status: 404, headers: { 'content-type': 'text/html' } });
    const { res } = await proxy(get('/qr/nope/'), origin);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/html');
    expect(await res.text()).toBe('missing');
  });

  it('rewrites an absolute origin redirect onto the public host and prefix', async () => {
    const origin = new Response(null, {
      status: 307,
      headers: { location: 'https://image-converter-69t.pages.dev/heic-to-jpg/' },
    });
    const { res } = await proxy(get('/image/heic-to-jpg'), origin);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`https://${HOST}/image/heic-to-jpg/`);
  });

  it('re-adds the prefix to a root-relative redirect', async () => {
    const origin = new Response(null, { status: 308, headers: { location: '/merge-pdf/' } });
    const { res } = await proxy(get('/pdf/merge-pdf'), origin);
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/pdf/merge-pdf/');
  });
});
