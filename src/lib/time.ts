// Pure Unix-epoch <-> date conversion engine. No Date.now() here — every
// function takes its input explicitly so it stays deterministic and testable.

export type EpochUnit = 's' | 'ms';

export interface EpochToDateResult {
  /** ISO 8601, always UTC, e.g. "2023-11-14T22:13:20.000Z" */
  iso: string;
  /** RFC 1123 UTC string, e.g. "Tue, 14 Nov 2023 22:13:20 GMT" */
  utc: string;
}

/** Convert a Unix epoch value (seconds or milliseconds) to ISO + UTC strings. */
export function epochToDate(epoch: number, unit: EpochUnit): EpochToDateResult {
  const ms = unit === 's' ? epoch * 1000 : epoch;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid epoch value: ${epoch}`);
  }
  return { iso: date.toISOString(), utc: date.toUTCString() };
}

export interface DateToEpochResult {
  /** Whole Unix seconds (floored). */
  seconds: number;
  /** Unix milliseconds. */
  ms: number;
}

/** Parse an ISO/date string and return the equivalent epoch seconds + ms. */
export function dateToEpoch(iso: string): DateToEpochResult {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${iso}`);
  }
  const ms = date.getTime();
  return { seconds: Math.floor(ms / 1000), ms };
}

/** Current time in epoch milliseconds — the only impure call, for UI use only. */
export function nowMs(): number {
  return Date.now();
}
