// Unit tests for the pure color-math helpers in color.ts. Everything here is
// plain arithmetic (no Canvas/DOM), so it's fully testable under Node.

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  relativeLuminance,
  contrastRatio,
  wcagLevel,
} from './color';

describe('hexToRgb', () => {
  it('parses a 6-digit hex with #', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses a 6-digit hex without #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses a 3-digit shorthand with #', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses a 3-digit shorthand without #', () => {
    expect(hexToRgb('000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#ABCDEF')).toEqual({ r: 0xab, g: 0xcd, b: 0xef });
  });

  it('trims surrounding whitespace', () => {
    expect(hexToRgb('  #ff0000  ')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('throws on an invalid hex string', () => {
    expect(() => hexToRgb('not-a-color')).toThrow();
  });
});

describe('rgbToHex', () => {
  it('formats pure red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('formats black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('formats white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('pads single-digit hex values with a leading zero', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });

  it('rounds and clamps out-of-range channel values', () => {
    expect(rgbToHex(-10, 128.6, 300)).toBe('#0081ff');
  });
});

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const { h, s, l } = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it('converts pure green', () => {
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts pure blue', () => {
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts black to 0 saturation and 0 lightness', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts white to 0 saturation and 100 lightness', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts a mid-gray to 0 saturation', () => {
    expect(rgbToHsl(128, 128, 128).s).toBe(0);
  });
});

describe('hslToRgb', () => {
  it('converts pure red (h:0 s:100 l:50)', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts pure green (h:120 s:100 l:50)', () => {
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts pure blue (h:240 s:100 l:50)', () => {
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts black (l:0)', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts white (l:100)', () => {
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('normalizes a hue outside 0-360', () => {
    expect(hslToRgb(480, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe('hex <-> hsl round trip', () => {
  it('hexToHsl matches rgbToHsl composed with hexToRgb', () => {
    expect(hexToHsl('#3366cc')).toEqual(rgbToHsl(0x33, 0x66, 0xcc));
  });

  it('hslToHex matches rgbToHex composed with hslToRgb', () => {
    expect(hslToHex(210, 50, 50)).toBe(
      rgbToHex(hslToRgb(210, 50, 50).r, hslToRgb(210, 50, 50).g, hslToRgb(210, 50, 50).b),
    );
  });

  it('round-trips an arbitrary color within rounding tolerance', () => {
    const original = '#3366cc';
    const { h, s, l } = hexToHsl(original);
    const back = hslToHex(h, s, l);
    const before = hexToRgb(original);
    const after = hexToRgb(back);
    expect(Math.abs(before.r - after.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(before.g - after.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(before.b - after.b)).toBeLessThanOrEqual(2);
  });

  it('round-trips black', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('round-trips white', () => {
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('is 1 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('is higher for green than blue at full saturation (WCAG weighting)', () => {
    const green = relativeLuminance({ r: 0, g: 255, b: 0 });
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 });
    expect(green).toBeGreaterThan(blue);
  });
});

describe('contrastRatio', () => {
  it('is ~21 for black vs white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('is symmetric regardless of argument order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(contrastRatio('#ffffff', '#000000'));
  });

  it('is greater than 1 for two distinct colors', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeGreaterThan(1);
  });
});

describe('wcagLevel', () => {
  it('classifies a 21:1 ratio as AAA', () => {
    expect(wcagLevel(21)).toBe('AAA');
  });

  it('classifies a 7:1 ratio as AAA (boundary)', () => {
    expect(wcagLevel(7)).toBe('AAA');
  });

  it('classifies a 4.5:1 ratio as AA (boundary)', () => {
    expect(wcagLevel(4.5)).toBe('AA');
  });

  it('classifies a 3:1 ratio as AA Large (boundary)', () => {
    expect(wcagLevel(3)).toBe('AA Large');
  });

  it('classifies below 3:1 as Fail', () => {
    expect(wcagLevel(1.5)).toBe('Fail');
  });
});
