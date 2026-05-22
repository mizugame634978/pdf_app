import { PDFDocument, StandardFonts, rgb, degrees, grayscale } from 'pdf-lib';

export type WatermarkPosition = 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;
  position?: WatermarkPosition;
  color?: { r: number; g: number; b: number };
}

export interface PageNumberOptions {
  fontSize?: number;
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  format?: 'n' | 'n/total';
}

function hasNonAscii(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

export async function addTextWatermark(
  buffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const { text, fontSize = 48, opacity = 0.3, position = 'center', color = { r: 0.5, g: 0.5, b: 0.5 } } = options;

  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x: number;
    let y: number;
    let rotate = degrees(0);

    if (position === 'center') {
      x = (width - textWidth) / 2;
      y = (height - textHeight) / 2;
      rotate = degrees(45);
    } else if (position === 'bottom-left') {
      x = 40;
      y = 30;
    } else if (position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 30;
    } else {
      // bottom-center
      x = (width - textWidth) / 2;
      y = 30;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate,
    });
  }

  return doc.save();
}

export async function addPageNumbers(
  buffer: ArrayBuffer,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  const { fontSize = 12, position = 'bottom-center', format = 'n/total' } = options;

  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width } = page.getSize();
    const pageNum = i + 1;
    const text = format === 'n/total' ? `${pageNum} / ${total}` : `${pageNum}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number;
    if (position === 'bottom-left') {
      x = 40;
    } else if (position === 'bottom-right') {
      x = width - textWidth - 40;
    } else {
      x = (width - textWidth) / 2;
    }

    page.drawText(text, {
      x,
      y: 20,
      size: fontSize,
      font,
      color: grayscale(0.3),
      opacity: 1,
    });
  }

  return doc.save();
}

export { hasNonAscii };
