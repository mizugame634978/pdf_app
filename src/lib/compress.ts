export type CompressQuality = 'low' | 'medium' | 'high';

const QUALITY_SETTINGS: Record<CompressQuality, string> = {
  low: '/screen',    // 72 dpi — 最小サイズ
  medium: '/ebook',  // 150 dpi — バランス型
  high: '/printer',  // 300 dpi — 高品質
};

export async function compressPdf(
  buffer: ArrayBuffer,
  quality: CompressQuality
): Promise<Uint8Array> {
  const { default: loadWASM } = await import('@okathira/ghostpdl-wasm');
  const Module = await loadWASM();

  const input = new Uint8Array(buffer);
  Module.FS.writeFile('input.pdf', input);

  Module.callMain([
    '-sDEVICE=pdfwrite',
    `-dPDFSETTINGS=${QUALITY_SETTINGS[quality]}`,
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    '-sOutputFile=output.pdf',
    'input.pdf',
  ]);

  const output = Module.FS.readFile('output.pdf', { encoding: 'binary' });

  // FS をクリーンアップ
  try { Module.FS.unlink('input.pdf'); } catch { /* ignore */ }
  try { Module.FS.unlink('output.pdf'); } catch { /* ignore */ }

  return output;
}
