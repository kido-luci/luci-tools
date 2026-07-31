// Wires the [data-qr-vcard] block rendered by QrVcard to the QR engine. Builds
// the vCard 3.0 payload from the fields, regenerates the preview on change, and
// serves PNG / SVG downloads.
import { buildVcardPayload, toPngDataUrl, toSvgString } from '../lib/qr';

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-qr-vcard]');
  if (!root) return;

  const firstName = root.querySelector<HTMLInputElement>('#vcard-first');
  const lastName = root.querySelector<HTMLInputElement>('#vcard-last');
  const phone = root.querySelector<HTMLInputElement>('#vcard-phone');
  const email = root.querySelector<HTMLInputElement>('#vcard-email');
  const org = root.querySelector<HTMLInputElement>('#vcard-org');
  const url = root.querySelector<HTMLInputElement>('#vcard-url');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const pngBtn = root.querySelector<HTMLButtonElement>('[data-download-png]');
  const svgBtn = root.querySelector<HTMLButtonElement>('[data-download-svg]');
  if (!firstName || !lastName || !phone || !email || !org || !url) return;
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
      img.alt = 'Contact vCard QR code';
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
    const first = firstName!.value.trim();
    const last = lastName!.value.trim();
    // Need at least a name before there is anything worth encoding.
    if (!first && !last) {
      reset('Enter a name to generate a contact QR code.');
      return;
    }

    const payload = buildVcardPayload({
      firstName: first,
      lastName: last,
      phone: phone!.value.trim(),
      email: email!.value.trim(),
      org: org!.value.trim(),
      url: url!.value.trim(),
    });
    void render(payload);
  }

  let timer: number | undefined;
  const debounced = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 200);
  };

  for (const field of [firstName, lastName, phone, email, org, url]) {
    field.addEventListener('input', debounced);
  }

  pngBtn.addEventListener('click', () => {
    if (pngUrl) triggerDownload(pngUrl, 'vcard-qr-code.png');
  });

  svgBtn.addEventListener('click', () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, 'vcard-qr-code.svg');
    URL.revokeObjectURL(objectUrl);
  });
}

init();
