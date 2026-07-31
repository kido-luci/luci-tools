// Unit tests for the pure helpers in time.ts. `nowMs` wraps Date.now() for the
// UI only and is intentionally not unit-tested here.

import { describe, it, expect } from 'vitest';
import { epochToDate, dateToEpoch } from './time';

describe('epochToDate', () => {
  it('converts epoch 0 seconds to the Unix epoch start', () => {
    const result = epochToDate(0, 's');
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('converts a known epoch in seconds', () => {
    const result = epochToDate(1700000000, 's');
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('converts a known epoch in milliseconds', () => {
    const result = epochToDate(1700000000000, 'ms');
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('returns a matching RFC 1123 UTC string', () => {
    const result = epochToDate(1700000000, 's');
    expect(result.utc).toBe('Tue, 14 Nov 2023 22:13:20 GMT');
  });

  it('handles negative epoch values (before 1970)', () => {
    const result = epochToDate(-1, 's');
    expect(result.iso).toBe('1969-12-31T23:59:59.000Z');
  });

  it('throws on a non-finite epoch value', () => {
    expect(() => epochToDate(NaN, 's')).toThrow();
  });
});

describe('dateToEpoch', () => {
  it('parses an ISO string back to the matching epoch seconds', () => {
    const result = dateToEpoch('2023-11-14T22:13:20.000Z');
    expect(result.seconds).toBe(1700000000);
  });

  it('parses an ISO string back to the matching epoch milliseconds', () => {
    const result = dateToEpoch('2023-11-14T22:13:20.000Z');
    expect(result.ms).toBe(1700000000000);
  });

  it('parses a date-only string', () => {
    const result = dateToEpoch('1970-01-01');
    expect(result.seconds).toBe(0);
  });

  it('throws on an invalid date string', () => {
    expect(() => dateToEpoch('not-a-date')).toThrow();
  });

  it('throws on an empty string', () => {
    expect(() => dateToEpoch('')).toThrow();
  });
});

describe('round-trip', () => {
  it('epochToDate -> dateToEpoch returns the original epoch seconds', () => {
    const { iso } = epochToDate(1700000000, 's');
    const { seconds } = dateToEpoch(iso);
    expect(seconds).toBe(1700000000);
  });

  it('dateToEpoch -> epochToDate returns the original ISO string', () => {
    const { seconds } = dateToEpoch('2023-11-14T22:13:20.000Z');
    const { iso } = epochToDate(seconds, 's');
    expect(iso).toBe('2023-11-14T22:13:20.000Z');
  });
});
