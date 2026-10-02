import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson, jsonToCsv, csvToJson } from './json';

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

  it('preserves exponent values as written (1e3 stays 1e3)', () => {
    expect(formatJson('{"e":1e3}')).toContain('"e": 1e3');
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

  // Formatting must only change whitespace: every token is copied verbatim.
  it.each([
    ['a big integer', '{"id":12345678901234567890}', '{\n  "id": 12345678901234567890\n}'],
    ['a number beyond double range', '[1e400,-1e400]', '[\n  1e400,\n  -1e400\n]'],
    ['number spellings', '[1.0,-0,1E3,2.50e-1]', '[\n  1.0,\n  -0,\n  1E3,\n  2.50e-1\n]'],
    ['integer-like key order', '{"b":1,"2":"x","a":0}', '{\n  "b": 1,\n  "2": "x",\n  "a": 0\n}'],
    ['duplicate keys', '{"b":1,"b":2}', '{\n  "b": 1,\n  "b": 2\n}'],
    [
      'all of these at once',
      '{"id":12345678901234567890,"b":1,"2":"x","b":2}',
      '{\n  "id": 12345678901234567890,\n  "b": 1,\n  "2": "x",\n  "b": 2\n}',
    ],
    [
      'nested and empty containers',
      '{"a":[],"b":{},"c":[{},[[]],{"d":[1]}]}',
      '{\n  "a": [],\n  "b": {},\n  "c": [\n    {},\n    [\n      []\n    ],\n    {\n      "d": [\n        1\n      ]\n    }\n  ]\n}',
    ],
    [
      'escapes inside strings', // JSON text: {"s":"q\"t \\ \/ \u00e9 \n","k\\":"\\"}
      '{"s":"q\\"t \\\\ \\/ \\u00e9 \\n","k\\\\":"\\\\"}',
      '{\n  "s": "q\\"t \\\\ \\/ \\u00e9 \\n",\n  "k\\\\": "\\\\"\n}',
    ],
    [
      'structural characters and spaces inside strings',
      '{"a, b":"{[ : ]}  ,"}',
      '{\n  "a, b": "{[ : ]}  ,"\n}',
    ],
    ['whitespace between tokens', ' \r\n{ "a" :\t[ 1 , 2 ] }\n', '{\n  "a": [\n    1,\n    2\n  ]\n}'],
    ['a top-level number', '12345678901234567890', '12345678901234567890'],
  ])('keeps %s exactly as written', (_name, input, expected) => {
    expect(formatJson(input)).toBe(expected);
  });

  it('keeps tokens verbatim with a tab indent', () => {
    expect(formatJson('{"n":12345678901234567890,"a":[{"b":1e400}]}', '\t')).toBe(
      '{\n\t"n": 12345678901234567890,\n\t"a": [\n\t\t{\n\t\t\t"b": 1e400\n\t\t}\n\t]\n}'
    );
  });

  it('lays out values that survive a parse exactly like JSON.stringify', () => {
    const input = '{"a":[1,{"b":null,"c":[true,false]},[]],"d":{},"e":"x"}';
    for (const indent of [2, 4, '\t', 0, 12] as const) {
      expect(formatJson(input, indent)).toBe(JSON.stringify(JSON.parse(input), null, indent));
    }
  });
});

describe('minifyJson', () => {
  it.each([
    ['a big integer', '{ "id": 12345678901234567890 }', '{"id":12345678901234567890}'],
    ['a number beyond double range', '[ 1e400 ]', '[1e400]'],
    ['integer-like key order', '{ "b": 1, "2": "x" }', '{"b":1,"2":"x"}'],
    ['duplicate keys', '{ "b": 1, "b": 2 }', '{"b":1,"b":2}'],
    ['escapes and spaces inside strings', '{ "a b": " \\u00e9 \\" " }', '{"a b":" \\u00e9 \\" "}'],
  ])('keeps %s exactly as written', (_name, input, expected) => {
    expect(minifyJson(input)).toBe(expected);
  });

  it('handles nesting deeper than JSON.stringify can recurse', () => {
    const deep = '['.repeat(100_000) + ']'.repeat(100_000);
    expect(minifyJson(deep)).toBe(deep);
  });

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

describe('jsonToCsv', () => {
  it('converts a simple array of objects with a CRLF-joined body', () => {
    const input = '[{"a":1,"b":2},{"a":3,"b":4}]';
    expect(jsonToCsv(input)).toBe('a,b\r\n1,2\r\n3,4');
  });

  it('wraps a single object as one row', () => {
    expect(jsonToCsv('{"a":1,"b":2}')).toBe('a,b\r\n1,2');
  });

  it('uses the union of keys across rows in first-seen order', () => {
    const input = '[{"a":1,"b":2},{"a":3,"c":4}]';
    // header = a,b (first row) then c (new in second row); missing cells empty
    expect(jsonToCsv(input)).toBe('a,b,c\r\n1,2,\r\n3,,4');
  });

  it('leaves missing keys as empty cells', () => {
    const input = '[{"a":1},{"b":2}]';
    expect(jsonToCsv(input)).toBe('a,b\r\n1,\r\n,2');
  });

  it('quotes a field that contains a comma', () => {
    const input = '[{"name":"Smith, John"}]';
    expect(jsonToCsv(input)).toBe('name\r\n"Smith, John"');
  });

  it('quotes and doubles embedded double quotes', () => {
    const input = '[{"quote":"She said \\"hi\\""}]';
    // internal " becomes "" and the field is wrapped in quotes
    expect(jsonToCsv(input)).toBe('quote\r\n"She said ""hi"""');
  });

  it('quotes a field that contains a newline', () => {
    const input = '[{"note":"line1\\nline2"}]';
    expect(jsonToCsv(input)).toBe('note\r\n"line1\nline2"');
  });

  it('quotes a field that contains a CRLF', () => {
    const input = '[{"note":"line1\\r\\nline2"}]';
    expect(jsonToCsv(input)).toBe('note\r\n"line1\r\nline2"');
  });

  it('JSON-stringifies nested object cell values', () => {
    const input = '[{"a":{"x":1}}]';
    expect(jsonToCsv(input)).toBe('a\r\n"{""x"":1}"');
  });

  it('JSON-stringifies nested array cell values', () => {
    const input = '[{"tags":["x","y"]}]';
    expect(jsonToCsv(input)).toBe('tags\r\n"[""x"",""y""]"');
  });

  it('renders boolean, null and number primitives as plain cells', () => {
    const input = '[{"b":true,"n":null,"num":3.14}]';
    expect(jsonToCsv(input)).toBe('b,n,num\r\ntrue,,3.14');
  });

  it('quotes a header key that itself contains a comma', () => {
    const input = '[{"a,b":1}]';
    expect(jsonToCsv(input)).toBe('"a,b"\r\n1');
  });

  it('throws when the JSON is a bare primitive', () => {
    expect(() => jsonToCsv('42')).toThrow();
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToCsv('{bad')).toThrow();
  });

  it('throws when an array item is not an object', () => {
    expect(() => jsonToCsv('[1,2,3]')).toThrow();
  });

  it.each([
    ['a big integer', '[{"id":12345678901234567890}]', 'id\r\n12345678901234567890'],
    ['numbers beyond double range', '[{"x":1e400,"y":-1e400}]', 'x,y\r\n1e400,-1e400'],
    ['number spellings', '[{"a":1.0,"b":1E3,"c":-0}]', 'a,b,c\r\n1.0,1E3,-0'],
    ['a big integer inside a nested value', '[{"a":{"n":12345678901234567890}}]', 'a\r\n"{""n"":12345678901234567890}"'],
  ])('keeps %s exactly as written', (_name, input, expected) => {
    expect(jsonToCsv(input)).toBe(expected);
  });

  it('orders columns as the keys first appear, integer-like keys included', () => {
    expect(jsonToCsv('[{"b":1,"2":"x"},{"a":3}]')).toBe('b,2,a\r\n1,x,\r\n,,3');
  });

  it('uses the last value of a duplicate key, as JSON.parse does', () => {
    expect(jsonToCsv('{"a":1,"b":2,"a":3}')).toBe('a,b\r\n3,2');
  });
});

describe('csvToJson', () => {
  it('parses a simple CSV into an array of string objects', () => {
    const csv = 'a,b\r\n1,2\r\n3,4';
    expect(JSON.parse(csvToJson(csv))).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('parses LF line endings', () => {
    const csv = 'a,b\n1,2\n3,4';
    expect(JSON.parse(csvToJson(csv))).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('parses CRLF line endings', () => {
    const csv = 'a,b\r\n1,2';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('handles a comma inside a quoted field', () => {
    const csv = 'name,city\r\n"Smith, John",NYC';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ name: 'Smith, John', city: 'NYC' }]);
  });

  it('handles escaped double quotes inside a quoted field', () => {
    const csv = 'quote\r\n"She said ""hi"""';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ quote: 'She said "hi"' }]);
  });

  it('handles a newline inside a quoted field', () => {
    const csv = 'note\r\n"line1\nline2"';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ note: 'line1\nline2' }]);
  });

  it('handles a CRLF inside a quoted field', () => {
    const csv = 'note\r\n"line1\r\nline2"';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ note: 'line1\r\nline2' }]);
  });

  it('ignores a single trailing newline (no blank last row)', () => {
    const csv = 'a,b\r\n1,2\r\n';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('ignores a trailing LF newline', () => {
    const csv = 'a,b\n1,2\n';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('fills missing trailing fields with empty strings', () => {
    const csv = 'a,b,c\r\n1,2';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2', c: '' }]);
  });

  it('drops extra fields beyond the header width', () => {
    const csv = 'a,b\r\n1,2,3';
    // only header keys are emitted; the extra 3 has no key
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('returns an empty array for header-only CSV', () => {
    expect(JSON.parse(csvToJson('a,b'))).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(JSON.parse(csvToJson(''))).toEqual([]);
  });

  it('preserves an empty quoted field', () => {
    const csv = 'a,b\r\n"",x';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '', b: 'x' }]);
  });

  it.each([
    [
      'mid-field',
      'name,size\r\npizza,12" large\r\nsoda,small',
      [
        { name: 'pizza', size: '12" large' },
        { name: 'soda', size: 'small' },
      ],
    ],
    [
      'around a word',
      'a,b\nsay "hi",1\nnext,2',
      [
        { a: 'say "hi"', b: '1' },
        { a: 'next', b: '2' },
      ],
    ],
    ['after a closing quote', 'a,b\n"x"y",1', [{ a: 'xy"', b: '1' }]],
  ])('keeps a stray quote %s literal instead of swallowing the next rows', (_name, csv, expected) => {
    expect(JSON.parse(csvToJson(csv))).toEqual(expected);
  });
});

describe('CSV round-trip', () => {
  it('jsonToCsv then csvToJson preserves a simple case', () => {
    const json = '[{"a":"1","b":"2"},{"a":"3","b":"4"}]';
    const csv = jsonToCsv(json);
    expect(JSON.parse(csvToJson(csv))).toEqual(JSON.parse(json));
  });

  it('round-trips fields with commas, quotes and newlines', () => {
    const json =
      '[{"text":"a, b","quote":"say \\"hi\\"","note":"l1\\nl2"}]';
    const csv = jsonToCsv(json);
    expect(JSON.parse(csvToJson(csv))).toEqual(JSON.parse(json));
  });
});
