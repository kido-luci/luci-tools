import { describe, it, expect } from 'vitest';
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  htmlEntityEncode,
  htmlEntityDecode,
  jwtDecode,
} from './codec';

describe('base64Encode / base64Decode', () => {
  it('round-trips unicode text', () => {
    const input = 'héllo wörld 🎉';
    expect(base64Decode(base64Encode(input))).toBe(input);
  });

  it('round-trips plain ASCII', () => {
    const input = 'hello world';
    expect(base64Decode(base64Encode(input))).toBe(input);
  });

  it('encodes a known ASCII string correctly', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
  });

  it('decodes a known base64 string correctly', () => {
    expect(base64Decode('aGVsbG8=')).toBe('hello');
  });

  it('round-trips an empty string', () => {
    expect(base64Decode(base64Encode(''))).toBe('');
  });
});

describe('urlEncode / urlDecode', () => {
  it('encodes special characters correctly', () => {
    expect(urlEncode('a b&c=d')).toBe('a%20b%26c%3Dd');
  });

  it('round-trips through encode/decode', () => {
    const input = 'a b&c=d?e#f';
    expect(urlDecode(urlEncode(input))).toBe(input);
  });

  it('decodes a known percent-encoded string', () => {
    expect(urlDecode('a%20b%26c%3Dd')).toBe('a b&c=d');
  });
});

describe('htmlEntityEncode / htmlEntityDecode', () => {
  it('encodes the 5 predefined entities', () => {
    expect(htmlEntityEncode('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;');
  });

  it('round-trips encode -> decode', () => {
    const input = '<a href="x">it\'s & <b>bold</b></a>';
    expect(htmlEntityDecode(htmlEntityEncode(input))).toBe(input);
  });

  it('decodes numeric entities like &#39;', () => {
    expect(htmlEntityDecode('it&#39;s')).toBe("it's");
  });

  it('decodes hex numeric entities like &#x27;', () => {
    expect(htmlEntityDecode('it&#x27;s')).toBe("it's");
  });

  it('decodes one level only: &amp;#60; becomes &#60;, not <', () => {
    expect(htmlEntityDecode('&amp;#60;')).toBe('&#60;');
    expect(htmlEntityDecode('&amp;lt;b&amp;gt;')).toBe('&lt;b&gt;');
  });

  it('decodes numeric entities past U+FFFF, such as emoji', () => {
    expect(htmlEntityDecode('&#128512;')).toBe('😀');
    expect(htmlEntityDecode('&#x1F600;')).toBe('😀');
  });

  it('leaves numeric entities beyond U+10FFFF unchanged', () => {
    expect(htmlEntityDecode('&#99999999;')).toBe('&#99999999;');
    expect(htmlEntityDecode('&#x110000;')).toBe('&#x110000;');
  });

  it('still matches named entities in any case', () => {
    expect(htmlEntityDecode('&LT;b&Gt; &AMP; &Quot;x&APOS;')).toBe('<b> & "x\'');
  });
});

describe('jwtDecode', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('decodes the payload', () => {
    const { payload } = jwtDecode(token);
    expect((payload as { name: string }).name).toBe('John Doe');
  });

  it('decodes the header', () => {
    const { header } = jwtDecode(token);
    expect((header as { alg: string }).alg).toBe('HS256');
  });

  it('throws a clear error when the token does not have 3 parts', () => {
    expect(() => jwtDecode('only.two')).toThrow(/3 dot-separated parts/);
  });

  it('throws a clear error when a part is not valid JSON', () => {
    expect(() => jwtDecode('not-json.not-json.sig')).toThrow(/not valid/);
  });
});
