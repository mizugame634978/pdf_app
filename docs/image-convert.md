# 画像↔PDF変換（issue #6）

## 概要

JPEG/PNG画像をPDFに変換する機能と、PDFの各ページをPNG画像として書き出す機能。
`ImageConvertTool` にタブ切り替えUIでまとめている。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/imageToPdf.ts` | JPEG/PNG → PDF変換 |
| `src/lib/pdfToImage.ts` | PDF → PNG変換（PDF.js使用） |
| `src/components/ToolPanel/ImageConvertTool.tsx` | タブ切り替えUI |
| `src/components/FileUploader/FileUploader.tsx` | 画像モード対応（`mode='image'`） |

## 画像 → PDF（`imageToPdf.ts`）

### API

```ts
imagesToPdf(files: File[]): Promise<Uint8Array>
```

### 実装

pdf-libの `embedJpg()` / `embedPng()` を使って各画像を1ページとして埋め込む。

```ts
for (const file of files) {
  const buffer = await file.arrayBuffer();
  const isJpeg = file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name);
  const image = isJpeg ? await doc.embedJpg(buffer) : await doc.embedPng(buffer);

  // ページサイズを画像のピクセルサイズに合わせる（1pt = 1px）
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
}
```

ページサイズを画像のピクセル寸法と一致させているため、余白や余分なスケーリングが発生しない。

### ファイル形式の判定

MIME typeを優先し、取得できない場合はファイル名の拡張子でフォールバックする。
これによりドラッグ&ドロップで拡張子のみのファイルも正しく処理できる。

## PDF → 画像（`pdfToImage.ts`）

### API

```ts
pdfToImages(buffer: ArrayBuffer, baseName: string, scale?: number): Promise<void>
```

### 実装

PDF.jsでCanvasにレンダリングし、`canvas.toBlob()` でPNGに変換する。

```ts
async function renderPageToBlob(pdf, pageNumber, scale): Promise<Blob> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
```

デフォルトスケールは `2.0`（元PDFの2倍解像度）。サムネイル用の `0.25` より高く、実用的な品質を確保。

### ダウンロード方式の切り替え

| ページ数 | ダウンロード形式 |
|---|---|
| 1ページ | `{baseName}_page1.png` として直接ダウンロード |
| 複数ページ | `{baseName}_images.zip` にまとめてダウンロード |

ZIP内のファイル名はページ番号をゼロ埋めして `_page01.png`、`_page02.png` のように命名する。
ゼロ埋め桁数は総ページ数の桁数に合わせる（例: 100ページなら3桁）。

## FileUploaderの拡張

```tsx
// PDF用（デフォルト）
<FileUploader onFiles={handleFiles} />

// 画像用
<FileUploader mode="image" multiple onFiles={handleFiles} />
```

`mode='image'` にすると：
- `accept` 属性が `.jpg,.jpeg,.png,image/jpeg,image/png` になる
- MIME typeと拡張子でJPEG/PNGのみフィルタリングされる
- ラベルが「JPEG / PNG を追加」に変わる
