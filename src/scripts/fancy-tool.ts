// Wires the [data-fancy-tool] block rendered by ToolShell to the styling
// engine. The style is read from `data-style`, so every generator page reuses
// this exact script — only the attribute differs.
import { styleText, type Style } from '../lib/fancy';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-fancy-tool]');
  if (!root) return;

  const style = (root.dataset.style ?? 'bold') as Style;
  const input = root.querySelector<HTMLTextAreaElement>('[data-input]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  const copy = root.querySelector<HTMLButtonElement>('[data-copy]');
  if (!input || !output) return;

  function render(): void {
    output!.textContent = styleText(input!.value, style);
  }

  input.addEventListener('input', render);
  render();

  if (copy) {
    const label = copy.textContent ?? 'Copy';
    let timer: number | undefined;

    copy.addEventListener('click', () => {
      const text = output!.textContent ?? '';
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => {
        copy.textContent = 'Copied!';
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          copy.textContent = label;
        }, 1500);
      });
    });
  }
}

init();
