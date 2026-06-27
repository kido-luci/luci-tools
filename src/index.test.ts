import { describe, it, expect } from 'vitest';
import { resolveRoute, rewriteLocation, ORIGINS, HOME_ORIGIN } from './index';

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
  it('covers exactly the five engine prefixes', () => {
    expect(Object.keys(ORIGINS).sort()).toEqual(['fancy-text', 'image', 'json', 'pdf', 'qr']);
  });
});
