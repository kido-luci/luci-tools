// Wires the [data-color-tool] block rendered by ColorTool to the color-math
// engine. `data-mode` picks which recompute logic runs — every color page
// reuses this exact script, only the mode and markup subset differ.
import { hexToRgb, rgbToHex, rgbToHsl, contrastRatio, wcagLevel } from '../lib/color';

type Mode = 'hex-to-rgb' | 'rgb-to-hex' | 'hex-to-hsl' | 'contrast';

const RGB_FN = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i;

/** Parses either a hex string or an `rgb()`/`rgba()` function string. */
function parseColorInput(raw: string): { r: number; g: number; b: number } {
  const trimmed = raw.trim();
  const rgbMatch = trimmed.match(RGB_FN);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    const rn = Number(r);
    const gn = Number(g);
    const bn = Number(b);
    if ([rn, gn, bn].some((n) => n < 0 || n > 255)) {
      throw new Error('RGB channels must be between 0 and 255.');
    }
    return { r: rn, g: gn, b: bn };
  }
  return hexToRgb(trimmed);
}

function initConverter(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-input]');
  const picker = root.querySelector<HTMLInputElement>('[data-input-picker]');
  const error = root.querySelector<HTMLElement>('[data-error]');
  const swatch = root.querySelector<HTMLElement>('[data-swatch]');
  const outHex = root.querySelector<HTMLElement>('[data-out-hex]');
  const outRgb = root.querySelector<HTMLElement>('[data-out-rgb]');
  const outHsl = root.querySelector<HTMLElement>('[data-out-hsl]');
  if (!input) return;

  function recompute(): void {
    const raw = input!.value;
    if (error) error.textContent = '';

    let rgb: { r: number; g: number; b: number };
    try {
      rgb = parseColorInput(raw);
    } catch (err) {
      if (error) error.textContent = (err as Error).message || 'Enter a valid color.';
      if (outHex) outHex.textContent = '—';
      if (outRgb) outRgb.textContent = '—';
      if (outHsl) outHsl.textContent = '—';
      if (swatch) swatch.style.backgroundColor = 'transparent';
      return;
    }

    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (outHex) outHex.textContent = hex;
    if (outRgb) outRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (outHsl) outHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    if (swatch) swatch.style.backgroundColor = hex;
    if (picker) picker.value = hex;
  }

  input.addEventListener('input', recompute);
  if (picker) {
    picker.addEventListener('input', () => {
      input.value = picker.value;
      recompute();
    });
  }

  recompute();
}

function initContrast(root: HTMLElement): void {
  const fg = root.querySelector<HTMLInputElement>('[data-fg]');
  const bg = root.querySelector<HTMLInputElement>('[data-bg]');
  const fgPicker = root.querySelector<HTMLInputElement>('[data-fg-picker]');
  const bgPicker = root.querySelector<HTMLInputElement>('[data-bg-picker]');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const previewTexts = root.querySelectorAll<HTMLElement>('[data-preview-text]');
  const ratioEl = root.querySelector<HTMLElement>('[data-ratio]');
  const aa = root.querySelector<HTMLElement>('[data-aa]');
  const aaLarge = root.querySelector<HTMLElement>('[data-aa-large]');
  const aaa = root.querySelector<HTMLElement>('[data-aaa]');
  if (!fg || !bg) return;

  function badge(el: HTMLElement | null, pass: boolean): void {
    if (!el) return;
    el.textContent = pass ? 'Pass' : 'Fail';
    el.className = `mt-1 text-sm font-bold ${pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`;
  }

  function recompute(): void {
    let fgHex: string;
    let bgHex: string;
    try {
      const fgRgb = parseColorInput(fg!.value);
      const bgRgb = parseColorInput(bg!.value);
      fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
      bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
    } catch {
      if (ratioEl) ratioEl.textContent = '—';
      return;
    }

    const ratio = contrastRatio(fgHex, bgHex);
    const level = wcagLevel(ratio);

    if (ratioEl) ratioEl.textContent = `${ratio.toFixed(2)}:1`;
    badge(aa, level === 'AA' || level === 'AAA');
    badge(aaLarge, level !== 'Fail');
    badge(aaa, level === 'AAA');

    if (preview) preview.style.backgroundColor = bgHex;
    previewTexts.forEach((el) => (el.style.color = fgHex));
    if (fgPicker) fgPicker.value = fgHex;
    if (bgPicker) bgPicker.value = bgHex;
  }

  fg.addEventListener('input', recompute);
  bg.addEventListener('input', recompute);
  if (fgPicker) {
    fgPicker.addEventListener('input', () => {
      fg.value = fgPicker.value;
      recompute();
    });
  }
  if (bgPicker) {
    bgPicker.addEventListener('input', () => {
      bg.value = bgPicker.value;
      recompute();
    });
  }

  recompute();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-color-tool]');
  if (!root) return;

  const mode = (root.dataset.mode ?? 'hex-to-rgb') as Mode;
  if (mode === 'contrast') {
    initContrast(root);
  } else {
    initConverter(root);
  }
}

init();
