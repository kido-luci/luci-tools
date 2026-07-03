// Wires the [data-hash-tool] block rendered by HashTool to the hashing
// engine. The algorithm is read from `data-algo`, so every hash page reuses
// this exact script — only the attribute differs.
import { md5, sha, type ShaAlgo } from '../lib/hash';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-hash-tool]');
  if (!root) return;

  const algo = root.dataset.algo ?? 'SHA-256';
  const input = root.querySelector<HTMLTextAreaElement>('[data-input]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy]');
  if (!input || !output || !copyBtn) return;

  const placeholder = `Start typing above to see the ${algo} hash.`;

  async function compute(text: string): Promise<string> {
    if (algo === 'MD5') return md5(text);
    return sha(algo as ShaAlgo, text);
  }

  // Guards against a slower async SHA digest resolving after a newer one
  // was already kicked off (e.g. fast typing).
  let requestId = 0;

  async function update(): Promise<void> {
    const text = input!.value;
    const id = ++requestId;

    if (text === '') {
      output!.textContent = placeholder;
      output!.classList.add('text-slate-500');
      output!.classList.remove('text-slate-900', 'dark:text-slate-100');
      copyBtn!.disabled = true;
      return;
    }

    const hash = await compute(text);
    if (id !== requestId) return; // a newer keystroke superseded this one

    output!.textContent = hash;
    output!.classList.remove('text-slate-500');
    output!.classList.add('text-slate-900', 'dark:text-slate-100');
    copyBtn!.disabled = false;
  }

  input.addEventListener('input', () => void update());

  copyBtn.addEventListener('click', () => {
    const text = output!.textContent ?? '';
    if (!text || text === placeholder) return;
    void navigator.clipboard.writeText(text).then(() => {
      const original = copyBtn!.textContent;
      copyBtn!.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn!.textContent = original;
      }, 1500);
    });
  });
}

init();
