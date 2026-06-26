import { describe, it, expect } from 'vitest';
import { mergePdfs, imagesToPdf } from './pdf';

// Build a minimal PDF file fixture with the given page count.
async function makePdfFile(pageCount: number, name: string): Promise<File> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage();
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
});
