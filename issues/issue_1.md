# #1 ページサムネイルプレビューの実装

## 概要

各ツール画面で、アップロードしたPDFのページサムネイルを表示できるようにする。
ユーザーがページ内容を確認しながら操作できるため、分割・回転の設定ミスを防げる。

## 背景

DESIGN.md Phase 4 に対応。現状はファイル名と容量しか確認できず、ページの中身が見えない。

## やること

- PDF.js を導入してページのサムネイル画像を生成する
- `src/lib/preview.ts` にサムネイル生成関数を実装する
  - 入力: `ArrayBuffer`, `pageIndex`, `scale`
  - 出力: `HTMLCanvasElement` または `ImageBitmap`
- マージ画面の `PageList` にサムネイルを表示する
- 分割・回転画面のページ選択UIにサムネイルを表示する

## 技術メモ

- ライブラリ: PDF.js（Apache 2.0）
- pdf-lib との役割分担: 表示・プレビューは PDF.js、編集は pdf-lib
- サムネイル生成はメインスレッドでも可だが、重い場合は Worker 化を検討

## 受け入れ条件

- [x] アップロード直後にページサムネイルが表示される
- [x] サムネイルがない状態と比べてUIの応答性が損なわれていない
- [x] ファイルサイズが大きいPDFでもクラッシュしない

## 実装内容

- `src/lib/preview.ts`: PDF.js でページを Canvas にレンダリングしてデータURLに変換
- `src/hooks/useThumbnails.ts`: `useFirstPageThumbnail` / `useAllPageThumbnails` フック
- `PageList`: 各ファイルの1ページ目サムネイルを表示（マージ画面）
- `PageThumbnails`: 全ページをグリッド表示（分割・回転画面）
  - 回転画面ではクリックでページ選択 → テキスト入力から置き換え
- `SplitTool`: ページ数をファイル名横に表示（`pageCount` バグも修正）
