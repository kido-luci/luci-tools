// Wires the [data-qr-wifi] block rendered by QrWifi to the QR engine. Builds the
// WIFI: payload from the fields, regenerates the preview on change, hides the
// password field for open networks, and serves PNG / SVG downloads.
import { buildWifiPayload, toPngDataUrl, toSvgString, type WifiEncryption } from '../lib/qr';

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-qr-wifi]');
  if (!root) return;

  const ssid = root.querySelector<HTMLInputElement>('#wifi-ssid');
  const password = root.querySelector<HTMLInputElement>('#wifi-password');
  const encryption = root.querySelector<HTMLSelectElement>('#wifi-encryption');
  const hidden = root.querySelector<HTMLInputElement>('#wifi-hidden');
  const passwordField = root.querySelector<HTMLElement>('[data-password-field]');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const pngBtn = root.querySelector<HTMLButtonElement>('[data-download-png]');
  const svgBtn = root.querySelector<HTMLButtonElement>('[data-download-svg]');
  if (!ssid || !password || !encryption || !hidden || !passwordField) return;
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
      img.alt = 'WiFi QR code';
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
    const enc = encryption!.value as WifiEncryption;
    // Open networks have no password — hide the field so it can't confuse users.
    passwordField!.classList.toggle('hidden', enc === 'nopass');

    const name = ssid!.value.trim();
    if (!name) {
      reset('Enter your network name to generate a QR code.');
      return;
    }

    const payload = buildWifiPayload({
      ssid: name,
      password: password!.value,
      encryption: enc,
      hidden: hidden!.checked,
    });
    void render(payload);
  }

  let timer: number | undefined;
  const debounced = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 200);
  };

  ssid.addEventListener('input', debounced);
  password.addEventListener('input', debounced);
  encryption.addEventListener('change', update);
  hidden.addEventListener('change', update);

  pngBtn.addEventListener('click', () => {
    if (pngUrl) triggerDownload(pngUrl, 'wifi-qr-code.png');
  });

  svgBtn.addEventListener('click', () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'wifi-qr-code.svg');
    URL.revokeObjectURL(url);
  });
}

init();
