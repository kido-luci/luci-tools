// Wires the [data-unit-tool] block rendered by UnitConverter to the conversion
// engine. Config (dimension + default units) is read from the dataset, so every
// converter page reuses this exact script — only the attributes differ.
import { convert, UNITS } from '../lib/units';

// Format a number cleanly: up to 6 significant-ish decimals, trailing zeros
// trimmed, so results read as "2.54" not "2.5399999999999996".
function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  // Big/whole numbers: round to 4 decimals; tiny numbers: keep more precision.
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  const fixed = n.toFixed(decimals);
  // Strip trailing zeros and a dangling decimal point.
  return fixed.replace(/\.?0+$/, '');
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-unit-tool]');
  if (!root) return;

  const valueInput = root.querySelector<HTMLInputElement>('[data-value]');
  const fromSel = root.querySelector<HTMLSelectElement>('[data-from-unit]');
  const toSel = root.querySelector<HTMLSelectElement>('[data-to-unit]');
  const result = root.querySelector<HTMLElement>('[data-result]');
  const formula = root.querySelector<HTMLElement>('[data-formula]');
  const swap = root.querySelector<HTMLButtonElement>('[data-swap]');
  if (!valueInput || !fromSel || !toSel || !result) return;

  function recompute(): void {
    const raw = parseFloat(valueInput!.value);
    const from = fromSel!.value;
    const to = toSel!.value;

    if (!Number.isFinite(raw)) {
      result!.textContent = '—';
      if (formula) formula.textContent = '';
      return;
    }

    try {
      const out = convert(raw, from, to);
      result!.textContent = formatNumber(out);
      if (formula) {
        const fromSym = UNITS[from]?.symbol ?? from;
        const toSym = UNITS[to]?.symbol ?? to;
        formula.textContent = `${formatNumber(raw)} ${fromSym} = ${formatNumber(out)} ${toSym}`;
      }
    } catch {
      result!.textContent = '—';
      if (formula) formula.textContent = '';
    }
  }

  valueInput.addEventListener('input', recompute);
  fromSel.addEventListener('change', recompute);
  toSel.addEventListener('change', recompute);

  if (swap) {
    swap.addEventListener('click', () => {
      const f = fromSel.value;
      fromSel.value = toSel.value;
      toSel.value = f;
      recompute();
    });
  }

  recompute();
}

init();
