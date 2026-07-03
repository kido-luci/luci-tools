// Wires the [data-password-tool] widget rendered by PasswordTool.astro to the
// generation engine. `mode` (password | passphrase) is read from `data-mode`,
// so every page reuses this exact script — only the attribute differs.
import { generatePassword, generatePassphrase, estimateStrength } from '../lib/password';

const STRENGTH_COLOR: Record<string, string> = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-lime-500',
  strong: 'bg-green-600',
};

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-password-tool]');
  if (!root) return;

  const mode = (root.dataset.mode ?? 'password') as 'password' | 'passphrase';

  const output = root.querySelector<HTMLElement>('[data-output]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy]');
  const regenerateBtn = root.querySelector<HTMLButtonElement>('[data-regenerate]');
  const strengthFill = root.querySelector<HTMLElement>('[data-strength-fill]');
  const strengthLabel = root.querySelector<HTMLElement>('[data-strength-label]');
  const lengthInput = root.querySelector<HTMLInputElement>('[data-length]');
  const lengthValue = root.querySelector<HTMLElement>('[data-length-value]');
  const lengthFieldLabel = root.querySelector<HTMLElement>('[data-length-field-label]');
  const classControls = root.querySelector<HTMLElement>('[data-class-controls]');
  const classInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-class]'));

  if (!output || !lengthInput || !lengthValue) return;

  // Passphrases are word-based: the "length" slider becomes a word count and
  // the character-class checkboxes don't apply.
  if (mode === 'passphrase') {
    lengthInput.min = '3';
    lengthInput.max = '10';
    lengthInput.value = '5';
    if (lengthFieldLabel) lengthFieldLabel.textContent = 'Word count';
    if (classControls) classControls.style.display = 'none';
  }

  function currentOptions() {
    const length = Number(lengthInput!.value);
    const enabled = Object.fromEntries(
      classInputs.map((el) => [el.dataset.class, el.checked]),
    ) as Record<'upper' | 'lower' | 'digits' | 'symbols', boolean>;
    return { length, ...enabled };
  }

  function render(): void {
    const value =
      mode === 'passphrase'
        ? generatePassphrase(Number(lengthInput!.value))
        : generatePassword(currentOptions());

    output!.textContent = value;

    const { bits, label } = estimateStrength(value);
    if (strengthFill) {
      const pct = Math.min(100, Math.round((bits / 128) * 100));
      strengthFill.style.width = `${pct}%`;
      strengthFill.className = `h-full rounded-full transition-all ${STRENGTH_COLOR[label]}`;
    }
    if (strengthLabel) {
      strengthLabel.textContent = `${label} · ${Math.round(bits)} bits`;
    }
  }

  function updateLengthDisplay(): void {
    lengthValue!.textContent =
      mode === 'passphrase' ? `${lengthInput!.value} words` : `${lengthInput!.value} chars`;
  }

  lengthInput.addEventListener('input', () => {
    updateLengthDisplay();
    render();
  });

  for (const el of classInputs) {
    el.addEventListener('change', () => {
      // Guard against unchecking every class — silently re-check this one.
      const anyChecked = classInputs.some((c) => c.checked);
      if (!anyChecked) el.checked = true;
      render();
    });
  }

  regenerateBtn?.addEventListener('click', render);

  copyBtn?.addEventListener('click', () => {
    const text = output!.textContent ?? '';
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 1500);
    });
  });

  updateLengthDisplay();
  render();
}

init();
