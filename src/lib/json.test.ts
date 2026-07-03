import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson } from './json';

describe('formatJson', () => {
  it('formats with default indent of 2 spaces', () => {
    expect(formatJson('{"a":1,"b":[1,2]}')).toBe(
      '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}'
    );
  });

  it('formats with indent 4', () => {
    const result = formatJson('{"a":1}', 4);
    // at least one line should start with 4 spaces
    expect(result.split('\n').some((line) => line.startsWith('    '))).toBe(true);
  });

  it('formats with tab indent', () => {
    const result = formatJson('{"a":1}', '\t');
    expect(result.split('\n').some((line) => line.startsWith('\t'))).toBe(true);
  });

  it('default indent produces a 2-space-indented nested line', () => {
    const result = formatJson('{"key":{"inner":1}}');
    expect(result.split('\n').some((line) => line.startsWith('  '))).toBe(true);
  });

  // value-type round-trips
  it('preserves integer values', () => {
    expect(formatJson('{"n":42}')).toContain('"n": 42');
  });

  it('preserves float values', () => {
    expect(formatJson('{"f":3.14}')).toContain('"f": 3.14');
  });

  it('preserves exponent values (1e3 → 1000)', () => {
    // JSON.parse converts 1e3 to 1000; JSON.stringify re-serialises as 1000
    expect(formatJson('{"e":1e3}')).toContain('"e": 1000');
  });

  it('preserves boolean true', () => {
    expect(formatJson('{"ok":true}')).toContain('"ok": true');
  });

  it('preserves boolean false', () => {
    expect(formatJson('{"ok":false}')).toContain('"ok": false');
  });

  it('preserves null', () => {
    expect(formatJson('{"v":null}')).toContain('"v": null');
  });

  it('preserves unicode string', () => {
    expect(formatJson('{"s":"héllo 日本語"}')).toContain('"s": "héllo 日本語"');
  });

  it('preserves escaped characters in strings', () => {
    const raw = '{"s":"line1\\nline2\\ttab"}';
    const result = formatJson(raw);
    expect(result).toContain('"s": "line1\\nline2\\ttab"');
  });

  it('formats empty object', () => {
    expect(formatJson('{}')).toBe('{}');
  });

  it('formats empty array', () => {
    expect(formatJson('[]')).toBe('[]');
  });

  it('formats deeply nested structure', () => {
    const input = '{"a":{"b":{"c":{"d":1}}}}';
    const result = formatJson(input, 2);
    expect(result).toContain('"d": 1');
    // deepest value should be indented 8 spaces (4 levels × 2)
    expect(result.split('\n').some((line) => line.startsWith('        '))).toBe(true);
  });

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{bad')).toThrow();
  });

  it('throws on trailing comma', () => {
    expect(() => formatJson('{"a":1,}')).toThrow();
  });

  it('throws on unquoted key', () => {
    expect(() => formatJson('{a:1}')).toThrow();
  });

  it('throws on truncated JSON', () => {
    expect(() => formatJson('{"a":')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => formatJson('')).toThrow();
  });

  it('throws on plain text', () => {
    expect(() => formatJson('hello')).toThrow();
  });
});

describe('minifyJson', () => {
  it('removes all whitespace', () => {
    expect(minifyJson('{ "a": 1, "b": [1, 2] }')).toBe('{"a":1,"b":[1,2]}');
  });

  it('removes newlines and tabs', () => {
    const pretty = '{\n\t"a": 1\n}';
    expect(minifyJson(pretty)).toBe('{"a":1}');
  });

  it('minifies empty object', () => {
    expect(minifyJson('{  }')).toBe('{}');
  });

  it('minifies empty array', () => {
    expect(minifyJson('[  ]')).toBe('[]');
  });

  it('minifies boolean and null values', () => {
    expect(minifyJson('{ "a": true, "b": false, "c": null }')).toBe(
      '{"a":true,"b":false,"c":null}'
    );
  });

  it('throws on invalid JSON', () => {
    expect(() => minifyJson('{bad')).toThrow();
  });

  it('throws on trailing comma', () => {
    expect(() => minifyJson('{"a":1,}')).toThrow();
  });

  it('throws on unquoted key', () => {
    expect(() => minifyJson('{a:1}')).toThrow();
  });

  it('throws on truncated JSON', () => {
    expect(() => minifyJson('{"a":')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => minifyJson('')).toThrow();
  });

  it('throws on plain text', () => {
    expect(() => minifyJson('hello')).toThrow();
  });
});

describe('validateJson', () => {
  it('returns valid:true for valid input', () => {
    expect(validateJson('{"a":1,"b":[1,2]}')).toEqual({ valid: true });
  });

  it('returns valid:false with a non-empty error for malformed input', () => {
    const result = validateJson('{bad');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('round-trip', () => {
  it('minify(format(x)) === minify(x)', () => {
    expect(minifyJson(formatJson('{"x":[1,2,3]}'))).toBe('{"x":[1,2,3]}');
  });

  it('round-trips integer', () => {
    const x = '{"n":42}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips float', () => {
    const x = '{"f":3.14}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips boolean values', () => {
    const x = '{"a":true,"b":false}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips null', () => {
    const x = '{"v":null}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips unicode string', () => {
    const x = '{"s":"héllo 日本語"}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips empty object', () => {
    const x = '{}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips empty array', () => {
    const x = '[]';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips deeply nested structure', () => {
    const x = '{"a":{"b":{"c":{"d":1}}}}';
    expect(minifyJson(formatJson(x))).toBe(minifyJson(x));
  });

  it('round-trips with tab indent', () => {
    const x = '{"key":"value","num":7}';
    expect(minifyJson(formatJson(x, '\t'))).toBe(minifyJson(x));
  });
});
