// Wires the [data-qr-email] block rendered by QrEmail to the QR engine. Builds
// the mailto: payload from the fields, regenerates the preview on change, and
// serves PNG / SVG downloads.
import { buildEmailPayload, toPngDataUrl, toSvgString } from '../lib/qr';

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-qr-email]');
  if (!root) return;

  const to = root.querySelector<HTMLInputElement>('#email-to');
  const subject = root.querySelector<HTMLInputElement>('#email-subject');
  const body = root.querySelector<HTMLTextAreaElement>('#email-body');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const pngBtn = root.querySelector<HTMLButtonElement>('[data-download-png]');
  const svgBtn = root.querySelector<HTMLButtonElement>('[data-download-svg]');
  if (!to || !subject || !body) return;
  if (!preview || !actions || !pngBtn || !svgBtn) return;

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

  async function render(payload: string): Promise<void> {
    try {
      pngUrl = await toPngDataUrl(payload);
      svgMarkup = await toSvgString(payload);

      const img = document.createElement('img');
      img.src = pngUrl;
      img.alt = 'Email QR code';
      img.className = 'h-full w-full object-contain';
      preview!.innerHTML = '';
      preview!.appendChild(img);

      actions!.classList.remove('hidden');
      actions!.classList.add('flex');
    } catch {
      reset('Could not generate a QR code for these details.');
    }
  }

  function update(): void {
    const address = to!.value.trim();
    if (!address) {
      reset('Enter an email address to generate a QR code.');
      return;
    }

    const payload = buildEmailPayload({
      to: address,
      subject: subject!.value.trim(),
      body: body!.value.trim(),
    });
    void render(payload);
  }

  let timer: number | undefined;
  const debounced = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 200);
  };

  to.addEventListener('input', debounced);
  subject.addEventListener('input', debounced);
  body.addEventListener('input', debounced);

  pngBtn.addEventListener('click', () => {
    if (pngUrl) triggerDownload(pngUrl, 'email-qr-code.png');
  });

  svgBtn.addEventListener('click', () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, 'email-qr-code.svg');
    URL.revokeObjectURL(objectUrl);
  });
}

init();
