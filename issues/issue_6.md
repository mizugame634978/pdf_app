# #6 画像↔PDF変換ツールの実装

## 概要

画像ファイル（JPEG・PNG）をPDFに変換する機能、およびPDFを画像として書き出す機能を追加する。

## 背景

DESIGN.md 将来の拡張候補「画像→PDF変換 / PDF→画像変換」に対応。

## やること

### 画像→PDF
- JPEGおよびPNG の複数ファイルを1つのPDFに変換する
- `src/lib/imageToPdf.ts` を実装する
  - 入力: `File[]`（JPEG / PNG）
  - 出力: `Uint8Array`
- pdf-lib の `embedJpg()` / `embedPng()` を使用する

### PDF→画像
- PDFの各ページをPNG画像として書き出す
- `src/lib/pdfToImage.ts` を実装する
  - PDF.js で Canvas にレンダリングし、`canvas.toBlob()` でPNGに変換する
- 複数ページの場合はZIPでまとめてダウンロードする（issue #4 と共通処理）

## 技術メモ

- 画像→PDF は pdf-lib のみで対応可能
- PDF→画像 は PDF.js が必要（issue #1 と同じ依存）
- TIFF・GIF などは初期スコープ外

## 受け入れ条件

- [ ] JPEG / PNG を選択してPDFに変換・ダウンロードできる
- [ ] PDFの各ページをPNG画像としてダウンロードできる
- [ ] 非対応形式のファイルを選択したときにエラーメッセージを表示する
