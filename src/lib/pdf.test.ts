import { describe, it, expect } from 'vitest';
import { mergePdfs, imagesToPdf } from './pdf';

// Build a minimal PDF file fixture with the given page count and page size.
async function makePdfFile(
  pageCount: number,
  name: string,
  width = 612,
  height = 792,
): Promise<File> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([width, height]);
  }
  const bytes = await doc.save();
  return new File([new Uint8Array(bytes)], name, { type: 'application/pdf' });
}

// 1×1 transparent PNG encoded as base64.
const PNG_1x1_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makePngFile(name: string): File {
  const raw = atob(PNG_1x1_B64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return new File([bytes], name, { type: 'image/png' });
}

// Minimal valid 1×1 JPEG that pdf-lib's embedJpg accepts (verified against pdf-lib CJS).
const JPEG_1x1_B64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAHwAAAQUBAQEB' +
  'AQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh' +
  'ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZ' +
  'WmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbH' +
  'yMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/2gAIAQEAAD8A+97K0//Z';

function makeJpegFile(name: string): File {
  const raw = atob(JPEG_1x1_B64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return new File([bytes], name, { type: 'image/jpeg' });
}

describe('mergePdfs', () => {
  it('returns a Blob with type application/pdf', async () => {
    const a = await makePdfFile(1, 'a.pdf');
    const b = await makePdfFile(2, 'b.pdf');
    const result = await mergePdfs([a, b]);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('merges a 1-page and a 2-page PDF into a 3-page PDF', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const a = await makePdfFile(1, 'a.pdf');
    const b = await makePdfFile(2, 'b.pdf');
    const result = await mergePdfs([a, b]);
    const merged = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(merged.getPageCount()).toBe(3);
  });

  it('preserves page order across three distinct-sized PDFs [100×100, 200×200 ×2, 300×300]', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const a = await makePdfFile(1, 'a.pdf', 100, 100);
    const b = await makePdfFile(2, 'b.pdf', 200, 200);
    const c = await makePdfFile(1, 'c.pdf', 300, 300);
    const result = await mergePdfs([a, b, c]);
    const merged = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(merged.getPageCount()).toBe(4);
    const { width: w0, height: h0 } = merged.getPage(0).getSize();
    expect(w0).toBeCloseTo(100, 0);
    expect(h0).toBeCloseTo(100, 0);
    const { width: w3, height: h3 } = merged.getPage(3).getSize();
    expect(w3).toBeCloseTo(300, 0);
    expect(h3).toBeCloseTo(300, 0);
  });

  it('merging a single PDF returns the same page count', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const a = await makePdfFile(3, 'a.pdf');
    const result = await mergePdfs([a]);
    const merged = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(merged.getPageCount()).toBe(3);
  });

  it('rejects when given an invalid PDF file', async () => {
    const bad = new File([new Uint8Array([1, 2, 3])], 'bad.pdf', { type: 'application/pdf' });
    await expect(mergePdfs([bad])).rejects.toThrow();
  });
});

describe('imagesToPdf', () => {
  it('returns a Blob with type application/pdf for a single PNG', async () => {
    const png = makePngFile('p.png');
    const result = await imagesToPdf([png]);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('produces a 1-page PDF from one PNG', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const png = makePngFile('p.png');
    const result = await imagesToPdf([png]);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(doc.getPageCount()).toBe(1);
  });

  it('produces a 2-page PDF from two PNGs', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const png1 = makePngFile('p1.png');
    const png2 = makePngFile('p2.png');
    const result = await imagesToPdf([png1, png2]);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(doc.getPageCount()).toBe(2);
  });

  it('PNG page size matches image dimensions (1×1)', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const png = makePngFile('p.png');
    const result = await imagesToPdf([png]);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(1, 0);
    expect(height).toBeCloseTo(1, 0);
  });

  it('produces a 1-page PDF from one JPEG', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const jpeg = makeJpegFile('photo.jpg');
    const result = await imagesToPdf([jpeg]);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(doc.getPageCount()).toBe(1);
  });

  it('result Blob type is application/pdf for a JPEG input', async () => {
    const jpeg = makeJpegFile('photo.jpg');
    const result = await imagesToPdf([jpeg]);
    expect(result.type).toBe('application/pdf');
  });

  it('produces a 2-page PDF from one PNG and one JPEG (mixed)', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const png = makePngFile('p.png');
    const jpeg = makeJpegFile('photo.jpg');
    const result = await imagesToPdf([png, jpeg]);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(doc.getPageCount()).toBe(2);
  });
});
