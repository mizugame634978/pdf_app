import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvas, viewport }).promise;
  page.cleanup();

  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function renderFirstPage(
  buffer: ArrayBuffer,
  scale = 0.25
): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const url = await renderPage(pdf, 1, scale);
  await pdf.destroy();
  return url;
}

export async function renderAllPages(
  buffer: ArrayBuffer,
  scale = 0.25
): Promise<{ urls: string[]; pageCount: number }> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageCount = pdf.numPages;
  const urls: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    urls.push(await renderPage(pdf, i, scale));
  }

  await pdf.destroy();
  return { urls, pageCount };
}
