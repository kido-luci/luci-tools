// Pure unit-conversion engine. Length and mass convert through a base unit via
// fixed multiplicative factors; temperature is affine (offset + scale), so it
// converts through a Celsius pivot instead of a single factor.

export type Dimension = 'length' | 'mass' | 'temperature';

export interface UnitInfo {
  /** Human label, e.g. "Centimeters". */
  label: string;
  /** Short symbol, e.g. "cm". */
  symbol: string;
  /** Which quantity this unit measures. */
  dimension: Dimension;
}

// Metadata keyed by the canonical unit symbol used everywhere (pages, UI, TOOLS).
export const UNITS: Record<string, UnitInfo> = {
  // — length (base = metre) —
  m: { label: 'Meters', symbol: 'm', dimension: 'length' },
  km: { label: 'Kilometers', symbol: 'km', dimension: 'length' },
  cm: { label: 'Centimeters', symbol: 'cm', dimension: 'length' },
  mm: { label: 'Millimeters', symbol: 'mm', dimension: 'length' },
  mi: { label: 'Miles', symbol: 'mi', dimension: 'length' },
  yd: { label: 'Yards', symbol: 'yd', dimension: 'length' },
  ft: { label: 'Feet', symbol: 'ft', dimension: 'length' },
  in: { label: 'Inches', symbol: 'in', dimension: 'length' },
  // — mass (base = kilogram) —
  kg: { label: 'Kilograms', symbol: 'kg', dimension: 'mass' },
  g: { label: 'Grams', symbol: 'g', dimension: 'mass' },
  lb: { label: 'Pounds', symbol: 'lb', dimension: 'mass' },
  oz: { label: 'Ounces', symbol: 'oz', dimension: 'mass' },
  st: { label: 'Stones', symbol: 'st', dimension: 'mass' },
  // — temperature (affine, no factor) —
  C: { label: 'Celsius', symbol: '°C', dimension: 'temperature' },
  F: { label: 'Fahrenheit', symbol: '°F', dimension: 'temperature' },
  K: { label: 'Kelvin', symbol: 'K', dimension: 'temperature' },
};

// Multiplicative factor to the dimension's base unit (metre / kilogram).
const FACTORS: Record<string, number> = {
  // length → metre
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
  // mass → kilogram
  kg: 1,
  g: 0.001,
  lb: 0.45359237,
  oz: 0.0283495231,
  st: 6.35029318,
};

// Temperature via a Celsius pivot.
function toCelsius(unit: string, x: number): number {
  switch (unit) {
    case 'C':
      return x;
    case 'F':
      return ((x - 32) * 5) / 9;
    case 'K':
      return x - 273.15;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

function fromCelsius(unit: string, c: number): number {
  switch (unit) {
    case 'C':
      return c;
    case 'F':
      return (c * 9) / 5 + 32;
    case 'K':
      return c + 273.15;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

function dimensionOf(unit: string): Dimension {
  const info = UNITS[unit];
  if (!info) throw new Error(`Unknown unit: ${unit}`);
  return info.dimension;
}

/**
 * Convert `value` from unit `from` to unit `to`. Both units must belong to the
 * same dimension; throws otherwise (and for unknown units).
 */
export function convert(value: number, from: string, to: string): number {
  const fromDim = dimensionOf(from);
  const toDim = dimensionOf(to);
  if (fromDim !== toDim) {
    throw new Error(`Cannot convert ${from} (${fromDim}) to ${to} (${toDim}) — different dimensions.`);
  }

  if (fromDim === 'temperature') {
    return fromCelsius(to, toCelsius(from, value));
  }
  // length / mass: through the base unit.
  return (value * FACTORS[from]) / FACTORS[to];
}

/** All unit symbols belonging to a given dimension (registry order). */
export function unitsForDimension(dimension: Dimension): string[] {
  return Object.keys(UNITS).filter((u) => UNITS[u].dimension === dimension);
}
