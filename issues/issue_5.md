# #5 ページの削除・並び替えツールの実装 ✅ Closed

## 概要

1つのPDF内でページを削除したり順序を入れ替えるツールを追加する。

## 背景

DESIGN.md 将来の拡張候補「ページの削除・並び替え（pdf-lib で対応可能）」に対応。
スキャンしたPDFで不要なページが混入している場合などに有用。

## やること

- トップ画面に「ページ編集」カードを追加する
- `src/lib/reorder.ts` を実装する
  - `reorderPages(buffer, newOrder)`: 指定した順序でページを並び替える
  - `deletePages(buffer, pageIndices)`: 指定ページを削除する
- `src/components/ToolPanel/ReorderTool.tsx` を作成する
- ページサムネイル（issue #1）があると使いやすいが、なくても動作するようにする
- ページ一覧を縦リストで表示し、ドラッグ&ドロップで並び替え・削除ボタンで削除できるUI

## 技術メモ

- pdf-lib の `copyPages()` + `addPage()` で任意の順序で再構成するだけで実現できる
- 既存の `PageList` コンポーネントを流用・拡張できる可能性がある

## 受け入れ条件

- [x] ページをドラッグ&ドロップで並び替えられる
- [x] 任意のページを削除できる
- [x] 編集後のPDFをダウンロードできる
- [x] 全ページ削除した状態で実行しようとするとエラーメッセージを表示する

## 実装内容

- `src/lib/reorder.ts`: `reorderPages(buffer, pageIndices)` — 指定順で新PDFを生成（削除は配列から除くだけ）
- `ReorderTool`: サムネイル付きドラッグ&ドロップページリスト・削除ボタン・残ページ数表示
- `App.tsx`: 「ページ編集」カードを追加
