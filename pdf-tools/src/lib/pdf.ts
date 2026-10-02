// Client-side PDF engine. Runs entirely in the browser using pdf-lib — no
// server, no upload. Each function takes the user's files and returns a single
// PDF Blob ready to download.
import {
  PDFDocument,
  degrees,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
} from 'pdf-lib';

// pdf-lib's save() returns a Uint8Array whose backing buffer is typed as
// ArrayBufferLike; copy it into a fresh ArrayBuffer-backed array so it satisfies
// the strict BlobPart type and is safe to hand to Blob.
function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/** Combine several PDFs into one, preserving the given file order. */
export async function mergePdfs(files: File[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return pdfBlob(await out.save());
}

function isJpeg(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg');
}

/**
 * The EXIF orientation (1–8) of a JPEG: tag 0x0112 in IFD0 of its APP1 Exif
 * block. Every read is bounds-checked; anything missing or malformed gives 1.
 */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength;
  if (end < 4 || view.getUint16(0) !== 0xffd8) return 1;

  let pos = 2;
  while (pos + 4 <= end) {
    const marker = view.getUint16(pos);
    // Stop at a non-marker, or at start-of-scan / end-of-image: no Exif left to find.
    if (marker >> 8 !== 0xff || marker === 0xffda || marker === 0xffd9) return 1;
    const segEnd = pos + 2 + view.getUint16(pos + 2);
    if (segEnd > end || segEnd < pos + 4) return 1;

    const exif = pos + 4; // "Exif\0\0", then the TIFF header
    const isExif =
      marker === 0xffe1 &&
      exif + 6 <= segEnd &&
      view.getUint32(exif) === 0x45786966 &&
      view.getUint16(exif + 4) === 0;
    if (!isExif) {
      pos = segEnd;
      continue;
    }

    const tiff = exif + 6;
    if (tiff + 8 > segEnd) return 1;
    const order = view.getUint16(tiff);
    if (order !== 0x4949 && order !== 0x4d4d) return 1;
    const le = order === 0x4949;
    if (view.getUint16(tiff + 2, le) !== 42) return 1;

    const ifd = tiff + view.getUint32(tiff + 4, le);
    if (ifd + 2 > segEnd) return 1;
    const count = view.getUint16(ifd, le);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > segEnd) return 1;
      if (view.getUint16(entry, le) !== 0x0112) continue;
      const value = view.getUint16(entry + 8, le);
      return value >= 1 && value <= 8 ? value : 1;
    }
    return 1;
  }
  return 1;
}

type Matrix = [number, number, number, number, number, number];

/** The PDF matrix that draws a w×h stored image upright for EXIF orientation 1–8. */
function orientationMatrix(orientation: number, w: number, h: number): Matrix {
  switch (orientation) {
    case 2: return [-1, 0, 0, 1, w, 0];
    case 3: return [-1, 0, 0, -1, w, h];
    case 4: return [1, 0, 0, -1, 0, h];
    case 5: return [0, -1, -1, 0, h, w];
    case 6: return [0, -1, 1, 0, 0, w];
    case 7: return [0, 1, 1, 0, 0, 0];
    case 8: return [0, 1, -1, 0, h, 0];
    default: return [1, 0, 0, 1, 0, 0];
  }
}

/** Place each image (JPG/PNG) on its own page, producing one PDF. */
export async function imagesToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const img = isJpeg(file) ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    // PDF ignores EXIF, so a phone photo stored sideways is turned upright here;
    // orientations 5–8 swap the page's width and height.
    const orientation = isJpeg(file) ? jpegOrientation(new Uint8Array(bytes)) : 1;
    const { width: w, height: h } = img;
    const page = doc.addPage(orientation >= 5 ? [h, w] : [w, h]);
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...orientationMatrix(orientation, w, h)));
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    page.pushOperators(popGraphicsState());
  }
  return pdfBlob(await doc.save());
}

/** Rotate every page of a PDF by 90/180/270°, added to its existing rotation. */
export async function rotatePdf(file: File, deg: 90 | 180 | 270): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer());
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + deg) % 360));
  }
  return pdfBlob(await doc.save());
}

/** Strip the `.pdf` extension (case-insensitive) from a file name. */
function baseName(name: string): string {
  return name.replace(/\.pdf$/i, '');
}

/** Split a PDF into one single-page PDF per page. */
export async function splitPdf(file: File): Promise<{ name: string; blob: Blob }[]> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const base = baseName(file.name);
  const out: { name: string; blob: Blob }[] = [];
  const indices = src.getPageIndices();
  for (const i of indices) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    out.push({ name: `${base}-page-${i + 1}.pdf`, blob: pdfBlob(await doc.save()) });
  }
  return out;
}
