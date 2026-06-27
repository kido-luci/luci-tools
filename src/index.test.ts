import { describe, it, expect } from 'vitest';
import { pickProject, buildTarget, rewriteLocation, PROJECT_MAP, HOME_PROJECT } from './index';

describe('pickProject', () => {
  it('routes each engine prefix to its Pages project', () => {
    expect(pickProject('/image/heic-to-jpg/')).toBe('image-converter');
    expect(pickProject('/fancy-text/bold-text-generator/')).toBe('fancy-text-generator');
    expect(pickProject('/json/json-formatter/')).toBe('json-tools');
    expect(pickProject('/qr/qr-code-generator/')).toBe('qr-tools');
    expect(pickProject('/pdf/merge-pdf/')).toBe('pdf-tools');
  });

  it('maps an engine hub (prefix root) to that engine', () => {
    expect(pickProject('/image/')).toBe('image-converter');
  });

  it('falls back to the home project for root, legal and unknown prefixes', () => {
    expect(pickProject('/')).toBe(HOME_PROJECT);
    expect(pickProject('/privacy/')).toBe(HOME_PROJECT);
    expect(pickProject('/ads.txt')).toBe(HOME_PROJECT);
    expect(pickProject('/sitemap.xml')).toBe(HOME_PROJECT);
    expect(pickProject('/robots.txt')).toBe(HOME_PROJECT);
    expect(pickProject('/totally-unknown/x')).toBe(HOME_PROJECT);
  });
});

describe('buildTarget', () => {
  it('builds the pages.dev origin URL preserving path and query', () => {
    const url = new URL('https://tools.luci-studio.com/image/heic-to-jpg/?a=1&b=2');
    expect(buildTarget('image-converter', url)).toBe(
      'https://image-converter.pages.dev/image/heic-to-jpg/?a=1&b=2',
    );
  });

  it('builds root-level targets for the home project', () => {
    const url = new URL('https://tools.luci-studio.com/sitemap.xml');
    expect(buildTarget('tools-home', url)).toBe('https://tools-home.pages.dev/sitemap.xml');
  });
});

describe('rewriteLocation', () => {
  it('rewrites a pages.dev redirect back to the public host', () => {
    expect(
      rewriteLocation('https://image-converter.pages.dev/image/heic-to-jpg/', 'image-converter'),
    ).toBe('https://tools.luci-studio.com/image/heic-to-jpg/');
  });

  it('leaves a relative Location untouched', () => {
    expect(rewriteLocation('/image/heic-to-jpg/', 'image-converter')).toBe('/image/heic-to-jpg/');
  });
});

describe('PROJECT_MAP', () => {
  it('covers exactly the five engine prefixes', () => {
    expect(Object.keys(PROJECT_MAP).sort()).toEqual(['fancy-text', 'image', 'json', 'pdf', 'qr']);
  });
});
