import { describe, it, expect } from 'vitest';
import type { PDFRawStream } from 'pdf-lib';
import { mergePdfs, imagesToPdf, rotatePdf, splitPdf, jpegOrientation } from './pdf';

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

// A minimal JPEG: SOI, an optional APP1 Exif block holding the orientation tag,
// SOF0 and EOI. pdf-lib only reads the header, so no scan data is needed.
function syntheticJpeg(width: number, height: number, orientation?: number, order: 'II' | 'MM' = 'II'): Uint8Array {
  const le = order === 'II';
  const u16 = (n: number) => (le ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
  const u32 = (n: number) => (le ? [...u16(n & 0xffff), ...u16(n >>> 16)] : [...u16(n >>> 16), ...u16(n & 0xffff)]);
  const bytes = [0xff, 0xd8];
  if (orientation !== undefined) {
    // TIFF header, then IFD0 at offset 8 with one entry: 0x0112, SHORT, count 1.
    const tiff = [
      ...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8),
      ...u16(1), ...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0,
      ...u32(0),
    ];
    const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]; // "Exif\0\0"
    bytes.push(0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 0xff, ...app1);
  }
  bytes.push(0xff, 0xc0, 0, 11, 8, height >> 8, height & 0xff, width >> 8, width & 0xff, 1, 1, 0x11, 0);
  bytes.push(0xff, 0xd9);
  return new Uint8Array(bytes);
}

const jpegFile = (bytes: Uint8Array) => new File([new Uint8Array(bytes)], 'photo.jpg', { type: 'image/jpeg' });

// The decoded content-stream operators of a PDF's first page.
async function firstPageOperators(pdf: Blob): Promise<string> {
  const { PDFDocument, PDFArray, decodePDFRawStream } = await import('pdf-lib');
  const doc = await PDFDocument.load(new Uint8Array(await pdf.arrayBuffer()));
  const contents = doc.getPage(0).node.Contents();
  const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => doc.context.lookup(ref)) : [contents];
  return streams.map((s) => new TextDecoder().decode(decodePDFRawStream(s as PDFRawStream).decode())).join('\n');
}

describe('jpegOrientation', () => {
  it('reads every orientation from little- and big-endian Exif', () => {
    for (const order of ['II', 'MM'] as const) {
      for (let o = 1; o <= 8; o++) expect(jpegOrientation(syntheticJpeg(4, 2, o, order))).toBe(o);
    }
  });

  it('returns 1 when there is no Exif block', () => {
    expect(jpegOrientation(syntheticJpeg(4, 2))).toBe(1);
  });

  it('skips a non-Exif APP1 (XMP) that comes first', () => {
    const exif = syntheticJpeg(4, 2, 6, 'MM');
    const xmpBody = [...new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0<x/>')];
    const xmp = [0xff, 0xe1, (xmpBody.length + 2) >> 8, (xmpBody.length + 2) & 0xff, ...xmpBody];
    expect(jpegOrientation(new Uint8Array([0xff, 0xd8, ...xmp, ...exif.slice(2)]))).toBe(6);
  });

  it('reads a Uint8Array view that starts past the buffer start', () => {
    const jpeg = syntheticJpeg(4, 2, 8);
    const padded = new Uint8Array(jpeg.length + 7);
    padded.set(jpeg, 7);
    expect(jpegOrientation(padded.subarray(7))).toBe(8);
  });

  it('returns 1 for anything malformed', () => {
    const good = syntheticJpeg(4, 2, 6);
    const tweak = (at: number, ...values: number[]) => {
      const copy = good.slice();
      copy.set(values, at);
      return copy;
    };
    // APP1 marker at 2, its length at 4, "Exif\0\0" at 6; the TIFF header at 12
    // (byte order 12, magic 14, IFD0 offset 16); IFD0's entry count at 20, the
    // entry's tag at 22 and its value at 30.
    expect(good[30]).toBe(6);
    expect(jpegOrientation(new Uint8Array())).toBe(1);
    expect(jpegOrientation(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(1);
    expect(jpegOrientation(good.slice(0, 20))).toBe(1); // segment cut short
    expect(jpegOrientation(tweak(2, 0x00))).toBe(1); // not a marker
    expect(jpegOrientation(tweak(4, 0, 1))).toBe(1); // segment length below 2
    expect(jpegOrientation(tweak(4, 0, 12))).toBe(1); // segment ends inside the TIFF header
    expect(jpegOrientation(tweak(10, 0x58))).toBe(1); // not "Exif\0\0"
    expect(jpegOrientation(tweak(12, 0x58, 0x58))).toBe(1); // byte order "XX"
    expect(jpegOrientation(tweak(14, 0, 0))).toBe(1); // TIFF magic is not 42
    expect(jpegOrientation(tweak(16, 0xff, 0xff))).toBe(1); // IFD0 past the segment
    expect(jpegOrientation(tweak(22, 0x00, 0x01))).toBe(1); // no orientation tag
    expect(jpegOrientation(tweak(20, 2, 0, 0x00, 0x01))).toBe(1); // 2nd entry past the segment
    expect(jpegOrientation(tweak(30, 9))).toBe(1); // value out of range
    expect(jpegOrientation(tweak(30, 0))).toBe(1);
  });
});

describe('imagesToPdf orientation', () => {
  it('turns a 4×2 JPEG with orientation 6 or 8 into a 2×4 page', async () => {
    const { PDFDocument } = await import('pdf-lib');
    for (const order of ['II', 'MM'] as const) {
      for (const o of [6, 8]) {
        const result = await imagesToPdf([jpegFile(syntheticJpeg(4, 2, o, order))]);
        const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
        expect(doc.getPage(0).getSize()).toEqual({ width: 2, height: 4 });
      }
    }
  });

  it('keeps a 4×2 page for orientation 1 or no Exif', async () => {
    const { PDFDocument } = await import('pdf-lib');
    for (const bytes of [syntheticJpeg(4, 2, 1), syntheticJpeg(4, 2, 1, 'MM'), syntheticJpeg(4, 2)]) {
      const result = await imagesToPdf([jpegFile(bytes)]);
      const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
      expect(doc.getPage(0).getSize()).toEqual({ width: 4, height: 2 });
    }
  });

  it('draws the image through the matrix for each orientation', async () => {
    const { PDFDocument } = await import('pdf-lib');
    // [matrix, page width, page height] for a JPEG stored 4×2.
    const expected: Record<number, [string, number, number]> = {
      1: ['1 0 0 1 0 0', 4, 2],
      2: ['-1 0 0 1 4 0', 4, 2],
      3: ['-1 0 0 -1 4 2', 4, 2],
      4: ['1 0 0 -1 0 2', 4, 2],
      5: ['0 -1 -1 0 2 4', 2, 4],
      6: ['0 -1 1 0 0 4', 2, 4],
      7: ['0 1 1 0 0 0', 2, 4],
      8: ['0 1 -1 0 2 0', 2, 4],
    };
    for (const [o, [matrix, width, height]] of Object.entries(expected)) {
      const result = await imagesToPdf([jpegFile(syntheticJpeg(4, 2, Number(o)))]);
      expect(await firstPageOperators(result)).toMatch(new RegExp(`^q\\n${matrix} cm\\n`));
      const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
      expect(doc.getPage(0).getSize()).toEqual({ width, height });
    }
  });
});

describe('rotatePdf', () => {
  it('returns a non-empty Blob with type application/pdf', async () => {
    const a = await makePdfFile(1, 'a.pdf');
    const result = await rotatePdf(a, 90);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
    expect(result.size).toBeGreaterThan(0);
  });

  it('rotates every page by 90° added to the existing rotation', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const a = await makePdfFile(2, 'a.pdf');
    const result = await rotatePdf(a, 90);
    const doc = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(doc.getPageCount()).toBe(2);
    doc.getPages().forEach((p) => expect(p.getRotation().angle).toBe(90));
  });

  it('wraps past 360° (270 + 180 = 90)', async () => {
    const { PDFDocument, degrees } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]).setRotation(degrees(270));
    const bytes = await doc.save();
    const file = new File([new Uint8Array(bytes)], 'r.pdf', { type: 'application/pdf' });
    const result = await rotatePdf(file, 180);
    const out = await PDFDocument.load(new Uint8Array(await result.arrayBuffer()));
    expect(out.getPage(0).getRotation().angle).toBe(90);
  });
});

describe('splitPdf', () => {
  it('returns one blob per page for an N-page PDF', async () => {
    const a = await makePdfFile(3, 'doc.pdf');
    const parts = await splitPdf(a);
    expect(parts).toHaveLength(3);
    parts.forEach((part) => {
      expect(part.blob).toBeInstanceOf(Blob);
      expect(part.blob.type).toBe('application/pdf');
      expect(part.blob.size).toBeGreaterThan(0);
    });
  });

  it('names each part <basename>-page-<n>.pdf', async () => {
    const a = await makePdfFile(2, 'report.pdf');
    const parts = await splitPdf(a);
    expect(parts.map((p) => p.name)).toEqual(['report-page-1.pdf', 'report-page-2.pdf']);
  });

  it('each part is a valid single-page PDF', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const a = await makePdfFile(2, 'doc.pdf');
    const parts = await splitPdf(a);
    for (const part of parts) {
      const doc = await PDFDocument.load(new Uint8Array(await part.blob.arrayBuffer()));
      expect(doc.getPageCount()).toBe(1);
    }
  });
});
