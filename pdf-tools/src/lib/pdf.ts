// Client-side PDF engine. Runs entirely in the browser using pdf-lib — no
// server, no upload. Each function takes the user's files and returns a single
// PDF Blob ready to download.
import { PDFDocument, degrees } from 'pdf-lib';

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

/** Place each image (JPG/PNG) on its own page, producing one PDF. */
export async function imagesToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const img = isJpeg(file) ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
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
