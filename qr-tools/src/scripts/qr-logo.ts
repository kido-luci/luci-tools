// Wires the [data-qr-logo] block rendered by QrLogo to the QR engine. Renders
// a high-error-correction QR code onto a canvas, composites an uploaded logo
// (behind a white rounded pad) centered on top, and serves a PNG download of
// the final composited image.
import { toPngDataUrl, computeLogoLayout } from '../lib/qr';

const CANVAS_SIZE = 512;

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + size, y, x + size, y + size, radius);
  ctx.arcTo(x + size, y + size, x, y + size, radius);
  ctx.arcTo(x, y + size, x, y, radius);
  ctx.arcTo(x, y, x + size, y, radius);
  ctx.closePath();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-qr-logo]');
  if (!root) return;

  const input = root.querySelector<HTMLTextAreaElement>('#qr-logo-text-input');
  const logoInput = root.querySelector<HTMLInputElement>('#qr-logo-file-input');
  const preview = root.querySelector<HTMLElement>('[data-preview]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const pngBtn = root.querySelector<HTMLButtonElement>('[data-download-png]');
  if (!input || !logoInput || !preview || !canvas || !actions || !pngBtn) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  let text = '';
  let logoImg: HTMLImageElement | null = null;
  let hasOutput = false;

  function showCanvas(): void {
    canvas!.classList.remove('hidden');
    preview!.classList.add('hidden');
  }

  function reset(message: string): void {
    hasOutput = false;
    actions!.classList.add('hidden');
    actions!.classList.remove('flex');
    canvas!.classList.add('hidden');
    preview!.classList.remove('hidden');
    preview!.textContent = message;
  }

  async function render(): Promise<void> {
    if (!text) {
      reset('Enter text or a URL to generate a QR code.');
      return;
    }

    try {
      const qrDataUrl = await toPngDataUrl(text, { width: CANVAS_SIZE, errorCorrectionLevel: 'H' });
      const qrImg = await loadImage(qrDataUrl);

      ctx!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx!.drawImage(qrImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (logoImg) {
        const { logoSize, logoX, logoY, padSize, padX, padY, padRadius } = computeLogoLayout(CANVAS_SIZE);

        // Opaque white rounded pad so the logo doesn't blend into the modules.
        ctx!.fillStyle = '#ffffff';
        roundedRectPath(ctx!, padX, padY, padSize, padRadius);
        ctx!.fill();

        ctx!.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      }

      hasOutput = true;
      showCanvas();
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
      text = input.value.trim();
      void render();
    }, 200);
  });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      loadImage(dataUrl)
        .then((img) => {
          logoImg = img;
          void render();
        })
        .catch(() => {
          reset('Could not load that logo image.');
        });
    };
    reader.readAsDataURL(file);
  });

  pngBtn.addEventListener('click', () => {
    if (!hasOutput) return;
    triggerDownload(canvas!.toDataURL('image/png'), 'qr-code-with-logo.png');
  });
}

init();
