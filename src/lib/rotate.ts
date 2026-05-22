import { PDFDocument, degrees } from 'pdf-lib';
import type { RotationAngle } from '../types';

export async function rotatePdf(
  buffer: ArrayBuffer,
  angle: RotationAngle,
  pageIndices: number[] | 'all'
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer);
  const pages = doc.getPages();
  const targets = pageIndices === 'all'
    ? pages
    : pageIndices.map((i) => pages[i]).filter(Boolean);

  for (const page of targets) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }

  return doc.save();
}
