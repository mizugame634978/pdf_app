import { PDFDocument } from 'pdf-lib';

// pageIndices: 0-based の元ページ番号を出力順に並べた配列
// 配列から除かれたページは削除扱いになる
export async function reorderPages(
  buffer: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const src = await PDFDocument.load(buffer);
  const dst = await PDFDocument.create();
  const pages = await dst.copyPages(src, pageIndices);
  for (const page of pages) {
    dst.addPage(page);
  }
  return dst.save();
}
