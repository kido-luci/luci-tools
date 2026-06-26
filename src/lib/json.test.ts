import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson } from './json';

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

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{bad')).toThrow();
  });
});

describe('minifyJson', () => {
  it('removes all whitespace', () => {
    expect(minifyJson('{ "a": 1, "b": [1, 2] }')).toBe('{"a":1,"b":[1,2]}');
  });

  it('throws on invalid JSON', () => {
    expect(() => minifyJson('{bad')).toThrow();
  });
});

describe('round-trip', () => {
  it('minify(format(x)) === minify(x)', () => {
    expect(minifyJson(formatJson('{"x":[1,2,3]}'))).toBe('{"x":[1,2,3]}');
  });
});
