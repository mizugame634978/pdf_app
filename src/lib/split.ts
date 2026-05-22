import { PDFDocument } from 'pdf-lib';
import type { PageRange } from '../types';

export async function splitPdf(
  buffer: ArrayBuffer,
  ranges: PageRange[]
): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buffer);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const doc = await PDFDocument.create();
    const start = range.start - 1;
    const end = Math.min(range.end - 1, src.getPageCount() - 1);
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages = await doc.copyPages(src, indices);
    for (const page of pages) {
      doc.addPage(page);
    }
    results.push(await doc.save());
  }

  return results;
}

export async function splitPdfByPage(buffer: ArrayBuffer): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buffer);
  const count = src.getPageCount();
  const ranges: PageRange[] = Array.from({ length: count }, (_, i) => ({
    start: i + 1,
    end: i + 1,
  }));
  return splitPdf(buffer, ranges);
}
