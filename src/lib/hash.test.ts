// Unit tests for the hashing engine: MD5 (pure-TS, RFC 1321 test vectors)
// and the SubtleCrypto-backed sha() helper.

import { describe, it, expect } from 'vitest';
import { md5, sha } from './hash';

describe('md5', () => {
  it('hashes the empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('hashes "abc"', () => {
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('hashes a full sentence spanning multiple 64-byte blocks', () => {
    expect(md5('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    );
  });

  it('hashes a 55-byte string (boundary: last byte before the 56-mod-64 pad point)', () => {
    const input = 'a'.repeat(55);
    expect(md5(input)).toBe('ef1772b6dff9a122358552954ad0df65');
  });

  it('hashes a 56-byte string (boundary: needs a full extra block for padding)', () => {
    const input = 'a'.repeat(56);
    expect(md5(input)).toBe('3b0c8ac703f828b04c6c197006d17218');
  });

  it('hashes a 64-byte string (exactly one block)', () => {
    const input = 'a'.repeat(64);
    expect(md5(input)).toBe('014842d480b571495a4a0363793f7367');
  });

  it('hashes multi-byte UTF-8 text', () => {
    expect(md5('日本語')).toBe('00110af8b4393ef3f72c50be5b332bec');
  });
});

describe('sha', () => {
  it('computes SHA-1 of "abc"', async () => {
    expect(await sha('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('computes SHA-256 of "abc"', async () => {
    expect(await sha('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes SHA-384 of "abc"', async () => {
    expect(await sha('SHA-384', 'abc')).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    );
  });

  it('computes SHA-512 of "abc"', async () => {
    expect(await sha('SHA-512', 'abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });

  it('computes SHA-256 of the empty string', async () => {
    expect(await sha('SHA-256', '')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
