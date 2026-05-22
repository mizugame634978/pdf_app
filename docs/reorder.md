# ページ編集（並び替え・削除）（issue #5）

## 概要

1つのPDF内でページをドラッグ&ドロップで並び替えたり、不要なページを削除する機能。
スキャンしたPDFに混入した不要ページの除去や、ページ順序の修正に使う。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/reorder.ts` | ページ並び替えのコアロジック |
| `src/components/ToolPanel/ReorderTool.tsx` | ドラッグ&ドロップUI |

## `reorder.ts` のAPI

```ts
reorderPages(buffer: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array>
```

`pageIndices` は0始まりのページインデックス配列。この配列の順序で新PDFを再構成する。
削除は「配列からインデックスを除くだけ」で実現できる（ページのコピーを省けばそのページは存在しない）。

### pdf-libでの実装

```ts
const srcDoc = await PDFDocument.load(buffer);
const dstDoc = await PDFDocument.create();
const pages = await dstDoc.copyPages(srcDoc, pageIndices);
for (const page of pages) dstDoc.addPage(page);
return dstDoc.save();
```

`copyPages()` に渡すインデックス配列の順序が、そのまま新PDFのページ順になる。

## UIの仕組み（`ReorderTool.tsx`）

### PageSlot型

```ts
type PageSlot = {
  key: string;     // React key（nanoid）。ドラッグ中の識別子
  srcIndex: number; // 元PDFでの0始まりページインデックス
}
```

`key` と `srcIndex` を分離することで、同一ページが複数ある場合も正しく追跡できる。

### ドラッグ&ドロップの実装

HTML5標準のDrag and Drop APIを使用（外部ライブラリなし）。

**ライブプレビュー（`onDragOver` での並び替え）:**

`onDrop` ではなく `onDragOver` でリストを更新することで、ドラッグ中にリアルタイムで並び順がプレビューされる。

```
dragStart → dragging アイテムのkeyを記憶
dragOver  → ホバー中アイテムの位置に dragging アイテムを挿入（setState）
drop      → 確定（すでにonDragOverで更新済みのため追加処理なし）
```

**オートスクロール:**

ドラッグ中にビューポートの端（上下80px以内）にカーソルが来たとき、`window.scrollBy()` で自動スクロールする。
ページ数が多い場合でも、離れたページ同士を入れ替えられる。

```ts
function autoScroll(clientY: number) {
  const margin = 80;
  if (clientY < margin) window.scrollBy(0, -10);
  else if (clientY > window.innerHeight - margin) window.scrollBy(0, 10);
}
```

### ロード中と「全ページ削除」の区別

`slots.length === 0` はロード完了前（初期状態）でも全ページ削除後でも同じ条件になってしまう。
これを `initialized: boolean` フラグで区別している：

```
initialized = false → ロード中（何も表示しない）
initialized = true  → ロード完了。slots.length === 0 なら「全ページ削除」警告を表示
```

## サムネイルの取得

`useAllPageThumbnails(file)` フックで全ページのサムネイルを取得し、各スロットに表示する。
サムネイルが取得できていないスロットはグレーのプレースホルダーを表示する。
