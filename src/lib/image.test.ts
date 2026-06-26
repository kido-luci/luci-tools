// Unit tests for the pure helpers in image.ts.
// `convertImageFile` relies on Canvas / createImageBitmap (browser-only) and
// is verified manually in the browser — only `isHeic` is unit-tested here.

import { describe, it, expect } from 'vitest';
import { isHeic } from './image';

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

  it('returns false for image/png', () => {
    expect(isHeic(new File([], 'photo.png', { type: 'image/png' }))).toBe(false);
  });

  it('returns false for image/jpeg', () => {
    expect(isHeic(new File([], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false);
  });
});
