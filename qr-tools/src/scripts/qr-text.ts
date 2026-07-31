// Wires the [data-qr-text] block rendered by QrText to the QR engine. Generates
// a fresh preview as the user types (debounced) and serves PNG / SVG downloads.
import { toPngDataUrl, toSvgString } from '../lib/qr';

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-qr-text]');
  if (!root) return;

  const input = root.querySelector<HTMLTextAreaElement>('#qr-text-input');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const pngBtn = root.querySelector<HTMLButtonElement>('[data-download-png]');
  const svgBtn = root.querySelector<HTMLButtonElement>('[data-download-svg]');
  if (!input || !preview || !actions || !pngBtn || !svgBtn) return;

  // Latest generated outputs, kept for the download buttons.
  let pngUrl = '';
  let svgMarkup = '';

  function reset(message: string): void {
    pngUrl = '';
    svgMarkup = '';
    actions!.classList.add('hidden');
    actions!.classList.remove('flex');
    preview!.innerHTML = '';
    preview!.textContent = message;
  }

  async function render(text: string): Promise<void> {
    try {
      pngUrl = await toPngDataUrl(text);
      svgMarkup = await toSvgString(text);

      const img = document.createElement('img');
      img.src = pngUrl;
      img.alt = 'QR code';
      img.className = 'h-full w-full object-contain';
      preview!.innerHTML = '';
      preview!.appendChild(img);

      actions!.classList.remove('hidden');
      actions!.classList.add('flex');
    } catch {
      reset('That text is too long to fit in a QR code.');
    }
  }

  let timer: number | undefined;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const text = input.value.trim();
      if (!text) {
        reset('Your QR code will appear here.');
        return;
      }
      void render(text);
    }, 200);
  });

  pngBtn.addEventListener('click', () => {
    if (pngUrl) triggerDownload(pngUrl, 'qr-code.png');
  });

  svgBtn.addEventListener('click', () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'qr-code.svg');
    URL.revokeObjectURL(url);
  });
}

init();
