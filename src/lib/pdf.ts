// Client-side PDF engine. Runs entirely in the browser using pdf-lib — no
// server, no upload. Each function takes the user's files and returns a single
// PDF Blob ready to download.
import { PDFDocument } from 'pdf-lib';

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
