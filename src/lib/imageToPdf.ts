import { PDFDocument } from 'pdf-lib';

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const isJpeg = file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name);

    const image = isJpeg
      ? await doc.embedJpg(buffer)
      : await doc.embedPng(buffer);

    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return doc.save();
}
