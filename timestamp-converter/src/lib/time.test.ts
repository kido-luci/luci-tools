// Unit tests for the pure helpers in time.ts. `nowMs` wraps Date.now() for the
// UI only and is intentionally not unit-tested here.

import { describe, it, expect, vi } from 'vitest';
import { epochToDate, dateToEpoch } from './time';

// The date field is labelled UTC. Run in a zone ahead of UTC (+07:00) so that
// reading a zone-less date-time as local time fails here; CI's UTC would hide it.
// (vi.stubEnv sets process.env.TZ; this project has no Node types for `process`.)
vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');

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

  it('reads an ISO date-time without a zone as UTC, not local time', () => {
    expect(new Date(1700000000000).getTimezoneOffset()).toBe(-420); // the pinned zone is in effect
    expect(dateToEpoch('2023-11-14T22:13:20').seconds).toBe(1700000000);
    expect(dateToEpoch('2023-11-14 22:13:20').seconds).toBe(1700000000);
    expect(dateToEpoch('2023-11-14T22:13').seconds).toBe(1699999980);
    expect(dateToEpoch('2023-11-14T22:13:20.5').ms).toBe(1700000000500);
  });

  it('accepts a lowercase t separator (RFC 3339) and still reads it as UTC', () => {
    expect(dateToEpoch('2023-11-14t22:13:20').seconds).toBe(1700000000);
    expect(dateToEpoch('2023-11-14t22:13:20.5').ms).toBe(1700000000500);
  });

  it('still honours an explicit Z or offset', () => {
    expect(dateToEpoch('2023-11-14T22:13:20Z').seconds).toBe(1700000000);
    expect(dateToEpoch('2023-11-14T22:13:20+07:00').seconds).toBe(1699974800);
    expect(dateToEpoch('2023-11-14T22:13:20-05:00').seconds).toBe(1700018000);
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
