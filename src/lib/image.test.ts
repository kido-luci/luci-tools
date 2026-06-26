// Unit tests for the pure helpers in image.ts.
// `convertImageFile` relies on Canvas / createImageBitmap (browser-only) and
// is verified manually in the browser — only `isHeic` and `outputFilename`
// are unit-tested here.

import { describe, it, expect } from 'vitest';
import { isHeic, outputFilename } from './image';

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
