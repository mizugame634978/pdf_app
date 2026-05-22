二# #4 分割結果のZIPまとめダウンロード ✅ Closed

## 概要

PDF分割で複数ファイルが生成される場合、1つのZIPファイルとしてまとめてダウンロードできるようにする。

## 背景

DESIGN.md リスク「分割で多数ファイルが出る → ZIPにまとめてダウンロード」に対応。
現状は `downloadMultiplePdfs` で1ファイルずつ個別ダウンロードが走るため、ページ数が多い場合にブラウザのダウンロードダイアログが大量に出る問題がある。

## やること

- jszip を導入する
- `src/lib/download.ts` に `downloadAsZip(files, zipName)` 関数を追加する
- 分割結果が2ファイル以上の場合、ZIPダウンロードに切り替える
- 分割が1ファイルのみの場合は従来通り単体ダウンロードのまま

## 技術メモ

- ライブラリ: jszip（MIT/GPL dual license）
- ZIP生成はブラウザ内で完結するためサーバー不要
- `JSZip.generateAsync({ type: 'blob' })` で Blob を生成し `URL.createObjectURL` でダウンロード

## 受け入れ条件

- [x] 分割後に複数ファイルが生成される場合、ZIPで一括ダウンロードされる
- [x] ZIPの中身がページ順にナンバリングされたPDFになっている
- [x] 1ページのみ分割した場合は単体PDFとしてダウンロードされる

## 実装内容

- `jszip` を導入
- `src/lib/download.ts`: `downloadAsZip()` を追加、`downloadMultiplePdfs` を削除
- `SplitTool`: 結果が1件 → 単体PDF、2件以上 → ZIP (`{baseName}_split.zip`) に自動切り替え
