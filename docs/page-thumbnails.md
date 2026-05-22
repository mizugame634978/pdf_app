# ページサムネイルプレビュー（issue #1）

## 概要

PDF.js を使って各ツール画面でページのサムネイル画像を表示する機能。
ユーザーがページの中身を確認しながら操作できるため、分割・回転の設定ミスを減らせる。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/preview.ts` | PDF.jsを使ったサムネイル生成ロジック |
| `src/hooks/useThumbnails.ts` | Reactフック（マージ用・全ページ用） |
| `src/components/PageThumbnails/PageThumbnails.tsx` | 全ページをグリッド表示するUIコンポーネント |

## アーキテクチャ

### 直列化キュー（`src/lib/preview.ts`）

PDF.js のレンダリングWorkerは同時並列リクエストを処理しきれず競合が発生する。
これを防ぐため、モジュールレベルの `renderQueue` でレンダリング処理を直列化している。

```
renderQueue: Promise<unknown> = Promise.resolve()

enqueue(fn) → renderQueue.then(fn)
```

新しいレンダリングリクエストが来るたびに `renderQueue` の末尾につなぐことで、
どれだけ多くのファイルを一度に追加しても、Worker への同時アクセスが起きない。

### サムネイル生成フロー

```
ArrayBuffer
  → pdfjsLib.getDocument()  // PDFをロード
  → pdf.getPage(n)          // ページ取得
  → page.getViewport({ scale })
  → canvas.getContext('2d')
  → page.render({ canvasContext, viewport })
  → canvas.toDataURL('image/jpeg', 0.8)  // JPEG データURL
```

スケールはデフォルト `0.25`（元サイズの25%）。サムネイル用途では十分な解像度。

### ライブラリのバージョン固定

pdfjs-dist v5 では `Map.getOrInsertComputed()` を内部で使用しているが、
この API は一部の現行ブラウザで未サポートのためランタイムエラーが発生する。
そのため v4 系（`^4.10.38`）を使用している。

v4 と v5 では Canvas へのレンダリング API が異なる：

| バージョン | API |
|---|---|
| v4 | `page.render({ canvasContext, viewport })` |
| v5 | `page.render({ canvas, viewport })` |

## フック

### `useFirstPageThumbnailMap(files: PdfFile[])`

マージ画面用。複数ファイルの1ページ目サムネイルをまとめて管理する。

- 返り値: `Map<id, dataURL>`
- ファイルが追加されるたびに差分のみレンダリング（`prev.has(id)` でスキップ）
- React Strict Mode でのダブル実行による競合を防ぐため、単一フックで一元管理している

### `useAllPageThumbnails(file: PdfFile | null)`

分割・回転・ページ編集画面用。1ファイルの全ページサムネイルを取得する。

- 返り値: `{ thumbnails: string[], pageCount: number, loading: boolean }`
- `loading` フラグで「取得中」と「ページなし」を区別する

## コンポーネント

### `PageThumbnails`

```tsx
<PageThumbnails
  thumbnails={string[]}
  loading={boolean}
  selectedPages?: Set<number>   // 回転画面でのページ選択状態
  onToggle?: (index: number) => void  // クリック時のコールバック
/>
```

- `selectedPages` / `onToggle` が渡されるとクリックで選択/解除できる（回転画面で使用）
- 渡されない場合は表示専用（分割・ページ編集画面で使用）
