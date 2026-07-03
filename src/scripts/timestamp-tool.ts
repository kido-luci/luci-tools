// Wires the [data-timestamp-tool] block rendered by TimestampTool to the
// conversion engine. Every converter page reuses this exact script — the
// epoch field, the date field and the unit selector stay in sync live, and
// "Now" fills the current time.
import { epochToDate, dateToEpoch, nowMs, type EpochUnit } from '../lib/time';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-timestamp-tool]');
  if (!root) return;

  const epochInput = root.querySelector<HTMLInputElement>('[data-epoch-input]');
  const epochUnit = root.querySelector<HTMLSelectElement>('[data-epoch-unit]');
  const dateInput = root.querySelector<HTMLInputElement>('[data-date-input]');
  const resultIso = root.querySelector<HTMLElement>('[data-result-iso]');
  const resultUtc = root.querySelector<HTMLElement>('[data-result-utc]');
  const errorEl = root.querySelector<HTMLElement>('[data-error]');
  const nowBtn = root.querySelector<HTMLButtonElement>('[data-now]');
  if (!epochInput || !epochUnit || !dateInput || !resultIso || !resultUtc) return;

  function setError(message: string): void {
    if (errorEl) errorEl.textContent = message;
  }

  function showResult(iso: string, utc: string): void {
    resultIso!.textContent = iso;
    resultUtc!.textContent = utc;
    setError('');
  }

  // Epoch field (or its unit) changed — recompute the date side.
  function fromEpoch(): void {
    const raw = epochInput!.value.trim();
    if (raw === '') {
      setError('');
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      setError('Enter a valid number.');
      return;
    }
    try {
      const unit = epochUnit!.value as EpochUnit;
      const { iso } = epochToDate(value, unit);
      dateInput!.value = iso;
      showResult(iso, epochToDate(value, unit).utc);
    } catch {
      setError('That timestamp is out of range.');
    }
  }

  // Date field changed — recompute the epoch side.
  function fromDate(): void {
    const raw = dateInput!.value.trim();
    if (raw === '') {
      setError('');
      return;
    }
    try {
      const { seconds, ms } = dateToEpoch(raw);
      const unit = epochUnit!.value as EpochUnit;
      epochInput!.value = String(unit === 's' ? seconds : ms);
      const { iso, utc } = epochToDate(seconds, 's');
      showResult(iso, utc);
    } catch {
      setError('Enter a valid date (e.g. 2023-11-14T22:13:20.000Z).');
    }
  }

  epochInput.addEventListener('input', fromEpoch);
  epochUnit.addEventListener('change', fromEpoch);
  dateInput.addEventListener('input', fromDate);

  nowBtn?.addEventListener('click', () => {
    const ms = nowMs();
    const unit = epochUnit!.value as EpochUnit;
    epochInput!.value = String(unit === 's' ? Math.floor(ms / 1000) : ms);
    fromEpoch();
  });

  // Initial paint from whichever seed value the page provided.
  fromEpoch();
}

init();
