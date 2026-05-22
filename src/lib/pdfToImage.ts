import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

async function renderPageToBlob(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<Blob> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const canvasContext = canvas.getContext('2d')!;
  await page.render({ canvasContext, viewport }).promise;
  page.cleanup();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('toBlob failed')); return; }
      resolve(blob);
    }, 'image/png');
  });
}

export async function pdfToImages(
  buffer: ArrayBuffer,
  baseName: string,
  scale = 2.0
): Promise<void> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageCount = pdf.numPages;

  if (pageCount === 1) {
    const blob = await renderPageToBlob(pdf, 1, scale);
    await pdf.destroy();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_page1.png`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();
  for (let i = 1; i <= pageCount; i++) {
    const blob = await renderPageToBlob(pdf, i, scale);
    const pad = String(i).padStart(String(pageCount).length, '0');
    zip.file(`${baseName}_page${pad}.png`, blob);
  }
  await pdf.destroy();

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_images.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
