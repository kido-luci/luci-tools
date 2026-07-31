// Client-side image conversion engine. Runs entirely in the browser:
// Canvas for formats the browser can decode natively, and a lazily-loaded
// WASM decoder (heic2any) only when the input is HEIC/HEIF.

export type TargetFormat = 'jpeg' | 'png' | 'webp';

const MIME: Record<TargetFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXT: Record<TargetFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

export function isSvg(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

/* v8 ignore start -- browser-only (Canvas/createImageBitmap), verified via manual browser testing */
async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  if (isHeic(file)) {
    // Chrome/Firefox can't decode HEIC on canvas — convert via WASM first.
    // Dynamic import keeps the ~heavy decoder out of non-HEIC pages.
    const { default: heic2any } = await import('heic2any');
    const decoded = (await heic2any({ blob: file, toType: 'image/png' })) as Blob;
    return createImageBitmap(decoded);
  }
  return createImageBitmap(file);
}
/* v8 ignore stop */

const SVG_FALLBACK_WIDTH = 1024;

/* v8 ignore start -- browser-only (Image/Canvas), verified via manual browser testing */
// createImageBitmap on SVG is unreliable across browsers (Firefox in
// particular can rasterize at the wrong intrinsic size or reject it
// outright), so SVGs are rasterized via an HTMLImageElement + canvas instead.
export async function convertSvgToPng(
  file: File,
  opts: { width?: number } = {},
): Promise<ConvertResult> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();

    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    const aspect = naturalWidth && naturalHeight ? naturalHeight / naturalWidth : 1;

    const width = opts.width ?? naturalWidth ?? SVG_FALLBACK_WIDTH;
    const height = naturalWidth && naturalHeight ? Math.round(width * aspect) : width;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is unavailable in this browser.');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image conversion failed.'))),
        'image/png',
      );
    });

    return { blob, filename: outputFilename(file.name, 'png') };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
/* v8 ignore stop */

export function outputFilename(inputName: string, to: TargetFormat): string {
  const base = inputName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${EXT[to]}`;
}

export interface ConvertResult {
  blob: Blob;
  filename: string;
}

/* v8 ignore start -- browser-only (Canvas/createImageBitmap), verified via manual browser testing */
export async function convertImageFile(
  file: File,
  opts: { to: TargetFormat; quality?: number; background?: string; width?: number },
): Promise<ConvertResult> {
  // createImageBitmap on SVG is unreliable across browsers — rasterize via
  // an <img> + canvas instead (see convertSvgToPng).
  if (isSvg(file) && opts.to === 'png') {
    return convertSvgToPng(file, { width: opts.width });
  }

  const bitmap = await decodeToBitmap(file);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable in this browser.');

  // JPEG has no alpha channel — paint a background so transparency doesn't
  // render as black.
  if (opts.to === 'jpeg') {
    ctx.fillStyle = opts.background ?? '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const quality = opts.quality ?? 0.92;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image conversion failed.'))),
      MIME[opts.to],
      quality,
    );
  });

  return { blob, filename: outputFilename(file.name, opts.to) };
}
/* v8 ignore stop */
