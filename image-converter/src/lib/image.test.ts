// Unit tests for the pure helpers in image.ts.
// `convertImageFile` relies on Canvas / createImageBitmap (browser-only) and
// is verified manually in the browser — only `isHeic`, `isSvg`,
// `svgRasterSize` and `outputFilename` are unit-tested here.

import { describe, it, expect } from 'vitest';
import { isHeic, isSvg, outputFilename, svgRasterSize } from './image';

describe('isHeic', () => {
  it('returns true for image/heic mime type', () => {
    expect(isHeic(new File([], 'photo.heic', { type: 'image/heic' }))).toBe(true);
  });

  it('returns true for image/heif mime type', () => {
    expect(isHeic(new File([], 'photo.x', { type: 'image/heif' }))).toBe(true);
  });

  it('returns true for .HEIC extension (case-insensitive) when type is empty', () => {
    expect(isHeic(new File([], 'IMG.HEIC', { type: '' }))).toBe(true);
  });

  it('returns true for .heif extension when type is empty', () => {
    expect(isHeic(new File([], 'photo.heif', { type: '' }))).toBe(true);
  });

  it('returns true for .Heif extension (mixed case) when type is empty', () => {
    expect(isHeic(new File([], 'x.Heif', { type: '' }))).toBe(true);
  });

  it('returns false for image/png', () => {
    expect(isHeic(new File([], 'photo.png', { type: 'image/png' }))).toBe(false);
  });

  it('returns false for image/jpeg', () => {
    expect(isHeic(new File([], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false);
  });

  it('returns false for .webp extension', () => {
    expect(isHeic(new File([], 'photo.webp', { type: 'image/webp' }))).toBe(false);
  });

  it('returns true when type is image/heic even if name has .jpg extension', () => {
    expect(isHeic(new File([], 'photo.jpg', { type: 'image/heic' }))).toBe(true);
  });

  it('returns true when name has .heic extension even if type is image/png', () => {
    expect(isHeic(new File([], 'photo.heic', { type: 'image/png' }))).toBe(true);
  });
});

describe('isSvg', () => {
  it('returns true for image/svg+xml mime type', () => {
    expect(isSvg(new File([], 'icon.svg', { type: 'image/svg+xml' }))).toBe(true);
  });

  it('returns true for .svg extension (case-insensitive) when type is empty', () => {
    expect(isSvg(new File([], 'ICON.SVG', { type: '' }))).toBe(true);
  });

  it('returns false for image/png', () => {
    expect(isSvg(new File([], 'photo.png', { type: 'image/png' }))).toBe(false);
  });

  it('returns false for a .png file even with an empty type', () => {
    expect(isSvg(new File([], 'photo.png', { type: '' }))).toBe(false);
  });
});

describe('svgRasterSize', () => {
  // What Chrome reports as the natural size of an SVG without width/height.
  const sizeless = { width: 300, height: 150 };

  it('keeps the natural size when the root svg sets width and height', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 20 10">';
    expect(svgRasterSize(svg, { width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });

  it('reads width and height spread over several lines', () => {
    const svg = '<?xml version="1.0"?>\n<svg\n  width="64px"\n  height=\'32\'\n>';
    expect(svgRasterSize(svg, { width: 64, height: 32 })).toEqual({ width: 64, height: 32 });
  });

  it('renders a viewBox-only SVG at 1024px on its longer side, in the viewBox ratio', () => {
    expect(svgRasterSize('<svg viewBox="0 0 200 100">', sizeless)).toEqual({ width: 1024, height: 512 });
    expect(svgRasterSize('<svg viewBox="0,0,200,100">', sizeless)).toEqual({ width: 1024, height: 512 });
  });

  it('keeps a tall viewBox tall', () => {
    expect(svgRasterSize('<svg viewBox="0 0 10 40">', { width: 38, height: 150 })).toEqual({ width: 256, height: 1024 });
  });

  it('renders a 1024px square when there is neither a size nor a viewBox', () => {
    expect(svgRasterSize('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>', sizeless)).toEqual({
      width: 1024,
      height: 1024,
    });
    // Some browsers report 0×0 for such an SVG.
    expect(svgRasterSize('<svg>', { width: 0, height: 0 })).toEqual({ width: 1024, height: 1024 });
    expect(svgRasterSize('not markup at all', sizeless)).toEqual({ width: 1024, height: 1024 });
  });

  it('treats a percentage width or height as no size', () => {
    const svg = '<svg width="100%" height="100%" viewBox="0 0 400 200">';
    expect(svgRasterSize(svg, sizeless)).toEqual({ width: 1024, height: 512 });
  });

  it('does not count stroke-width, or a child element width, as the svg width', () => {
    expect(svgRasterSize('<svg stroke-width="2" height="48" viewBox="0 0 24 24">', { width: 48, height: 48 })).toEqual({
      width: 1024,
      height: 1024,
    });
    expect(svgRasterSize('<svg viewBox="0 0 10 20"><rect width="10" height="20"/></svg>', sizeless)).toEqual({
      width: 512,
      height: 1024,
    });
  });

  it('falls back to the viewBox rule when a sized SVG reports no natural size', () => {
    expect(svgRasterSize('<svg width="0" height="0" viewBox="0 0 2 1">', { width: 0, height: 0 })).toEqual({
      width: 1024,
      height: 512,
    });
  });

  it('scales to a requested width, keeping the ratio', () => {
    expect(svgRasterSize('<svg viewBox="0 0 200 100">', sizeless, 500)).toEqual({ width: 500, height: 250 });
    expect(svgRasterSize('<svg width="40" height="10">', { width: 40, height: 10 }, 100)).toEqual({ width: 100, height: 25 });
  });
});

describe('outputFilename', () => {
  it('replaces extension: photo.png → photo.jpg for jpeg target', () => {
    expect(outputFilename('photo.png', 'jpeg')).toBe('photo.jpg');
  });

  it('handles multiple dots: a.b.c.HEIC → a.b.c.png for png target', () => {
    expect(outputFilename('a.b.c.HEIC', 'png')).toBe('a.b.c.png');
  });

  it('handles name with no extension: photo → photo.jpg for jpeg target', () => {
    expect(outputFilename('photo', 'jpeg')).toBe('photo.jpg');
  });

  it('handles empty name: falls back to image.png for png target', () => {
    expect(outputFilename('', 'png')).toBe('image.png');
  });

  it('produces .webp for webp target', () => {
    expect(outputFilename('shot.jpg', 'webp')).toBe('shot.webp');
  });
});
