export function downloadPdf(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMultiplePdfs(
  files: { data: Uint8Array; name: string }[]
): void {
  for (const f of files) {
    downloadPdf(f.data, f.name);
  }
}
