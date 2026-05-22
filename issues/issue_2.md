# #2 PDF圧縮機能の実装

## 概要

PDFのファイルサイズを削減するツールを追加する。

## 背景

DESIGN.md Phase 5 に対応。画像を多く含む PDF は容量が大きくなりがちで、メール添付やアップロード制限に引っかかるケースがある。

## やること

- トップ画面に「圧縮」カードを追加する
- Ghostscript WASM を使った圧縮処理を `src/lib/compress.ts` に実装する
  - 入力: `ArrayBuffer`, 品質設定（low / medium / high）
  - 出力: `Uint8Array`
- 圧縮前後のファイルサイズを画面に表示する
- `src/components/ToolPanel/CompressTool.tsx` を作成する

## 技術メモ

- ライブラリ: Ghostscript WASM（AGPL）
  - ホビー用途なら問題なし。商用展開時は要ライセンス確認
- WASM ファイルが大重量になるため、dynamic import で遅延ロードする
- pdf-lib の `save({ useObjectStreams: false })` で軽微な圧縮のみなら pdf-lib だけでも対応可

## 受け入れ条件

- [x] 圧縮後のファイルサイズが元より小さくなる（画像入りPDFで確認）
- [x] 圧縮前後のサイズ削減率が画面に表示される
- [x] テキストのみのPDFでもクラッシュしない
- [x] AGPLライセンスの旨をREADMEに明記する

## 実装内容

- `src/lib/compress.ts`: `@okathira/ghostpdl-wasm` を dynamic import で遅延ロードし `-dPDFSETTINGS` で品質制御
- `src/components/ToolPanel/CompressTool.tsx`: 低/中/高の3段階品質選択UI・圧縮前後のサイズと削減率を表示
- `src/App.tsx`: トップに「圧縮」カードを追加
- `README.md`: AGPL-3.0 ライセンス注意事項を追記
- ライブラリ: `@okathira/ghostpdl-wasm` (AGPL-3.0、約15MB WASM)
