// Unit tests for the pure conversion engine in units.ts.

import { describe, it, expect } from 'vitest';
import { convert, unitsForDimension, UNITS } from './units';

describe('length', () => {
  it('1 in = 2.54 cm exactly', () => {
    expect(convert(1, 'in', 'cm')).toBe(2.54);
  });

  it('1 mi ≈ 1.609344 km', () => {
    expect(convert(1, 'mi', 'km')).toBeCloseTo(1.609344, 6);
  });

  it('1 m = 100 cm', () => {
    expect(convert(1, 'm', 'cm')).toBeCloseTo(100, 9);
  });

  it('1 ft = 12 in', () => {
    expect(convert(1, 'ft', 'in')).toBeCloseTo(12, 9);
  });

  it('1 yd = 3 ft', () => {
    expect(convert(1, 'yd', 'ft')).toBeCloseTo(3, 9);
  });

  it('round-trips cm → in → cm', () => {
    expect(convert(convert(42, 'cm', 'in'), 'in', 'cm')).toBeCloseTo(42, 9);
  });
});

describe('mass', () => {
  it('1 kg ≈ 2.2046226218 lb', () => {
    expect(convert(1, 'kg', 'lb')).toBeCloseTo(2.2046226218, 8);
  });

  it('1 kg = 1000 g', () => {
    expect(convert(1, 'kg', 'g')).toBeCloseTo(1000, 6);
  });

  it('1 lb = 16 oz (approximately)', () => {
    expect(convert(1, 'lb', 'oz')).toBeCloseTo(16, 4);
  });

  it('1 st = 14 lb (approximately)', () => {
    expect(convert(1, 'st', 'lb')).toBeCloseTo(14, 6);
  });

  it('round-trips lb → kg → lb', () => {
    expect(convert(convert(150, 'lb', 'kg'), 'kg', 'lb')).toBeCloseTo(150, 9);
  });
});

describe('temperature', () => {
  it('100 C = 212 F', () => {
    expect(convert(100, 'C', 'F')).toBe(212);
  });

  it('0 C = 32 F', () => {
    expect(convert(0, 'C', 'F')).toBe(32);
  });

  it('37 C ≈ 98.6 F', () => {
    expect(convert(37, 'C', 'F')).toBeCloseTo(98.6, 5);
  });

  it('0 C = 273.15 K', () => {
    expect(convert(0, 'C', 'K')).toBeCloseTo(273.15, 9);
  });

  it('212 F = 100 C', () => {
    expect(convert(212, 'F', 'C')).toBeCloseTo(100, 9);
  });

  it('round-trips C → F → C', () => {
    expect(convert(convert(21, 'C', 'F'), 'F', 'C')).toBeCloseTo(21, 9);
  });

  it('round-trips C → K → C', () => {
    expect(convert(convert(21, 'C', 'K'), 'K', 'C')).toBeCloseTo(21, 9);
  });
});

describe('errors', () => {
  it('throws when mixing dimensions', () => {
    expect(() => convert(1, 'kg', 'cm')).toThrow();
  });

  it('throws for an unknown from-unit', () => {
    expect(() => convert(1, 'furlong', 'cm')).toThrow();
  });

  it('throws for an unknown to-unit', () => {
    expect(() => convert(1, 'cm', 'furlong')).toThrow();
  });
});

describe('unitsForDimension', () => {
  it('returns all length units', () => {
    expect(unitsForDimension('length')).toEqual(['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in']);
  });

  it('returns all mass units', () => {
    expect(unitsForDimension('mass')).toEqual(['kg', 'g', 'lb', 'oz', 'st']);
  });

  it('returns all temperature units', () => {
    expect(unitsForDimension('temperature')).toEqual(['C', 'F', 'K']);
  });

  it('every returned unit reports the requested dimension', () => {
    for (const u of unitsForDimension('mass')) {
      expect(UNITS[u].dimension).toBe('mass');
    }
  });
});
