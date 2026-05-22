# PDF Tools

ブラウザ上で動作するPDF編集Webアプリ。**ファイルはサーバーへ一切送信されません。**

## 機能一覧

| 機能 | 説明 |
|---|---|
| マージ | 複数のPDFを1つに結合。各ファイルの1ページ目サムネイルを確認しながら操作可能 |
| 分割 | 1ページずつ全分割、またはページ範囲を指定して分割。複数ファイルはZIPで一括ダウンロード |
| 回転 | 全ページまたは指定ページを 90° / 180° / 270° 回転。ページサムネイルでクリック選択可能 |
| 圧縮 | Ghostscript WASMによる本格圧縮。低/中/高の3段階の品質設定。圧縮前後のサイズ・削減率を表示 |
| ページ編集 | ドラッグ&ドロップでページを並び替え・削除。サムネイル付き一覧で視覚的に操作 |
| 画像変換 | JPEG/PNGをPDFに変換、またはPDFの各ページをPNG画像として書き出し（複数ページはZIP） |
| 透かし | 任意テキストを全ページに透かしとして追加（位置・サイズ・色・透明度を設定可能） |
| ページ番号 | フッターにページ番号を追加（位置・形式・フォントサイズを設定可能） |

## 開発環境のセットアップ

**必要なもの:** Node.js 18 以上

```bash
npm install
npm run dev
```

`http://localhost:5173` でアクセスできます。

## ビルド

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが生成されます。任意の静的ホスティング（GitHub Pages、Vercel、Netlify 等）にそのまま配置できます。

## 技術スタック

| レイヤー | 採用技術 | 用途 |
|---|---|---|
| フレームワーク | React 19 + TypeScript | UI全般 |
| ビルドツール | Vite | バンドル・開発サーバー |
| PDF編集 | pdf-lib | マージ・分割・回転・透かし・ページ編集 |
| PDFプレビュー | pdfjs-dist v4 | ページサムネイル生成 |
| PDF圧縮 | @okathira/ghostpdl-wasm | Ghostscript WASMによる本格圧縮（約15MB） |
| ZIP生成 | jszip | 分割・画像変換の複数ファイル一括ダウンロード |

## アーキテクチャ

```
src/
├── components/
│   ├── FileUploader/      ドラッグ&ドロップ対応ファイル入力（PDF / 画像モード切り替え）
│   ├── PageList/          ファイルリスト表示（マージ用）
│   ├── PageThumbnails/    ページサムネイルグリッド（分割・回転・ページ編集用）
│   └── ToolPanel/         各ツール画面・処理状態表示
├── lib/
│   ├── merge.ts           PDFの結合
│   ├── split.ts           PDFの分割
│   ├── rotate.ts          PDFのページ回転
│   ├── compress.ts        Ghostscript WASMによる圧縮
│   ├── reorder.ts         ページの並び替え・削除
│   ├── imageToPdf.ts      JPEG/PNG → PDF変換
│   ├── pdfToImage.ts      PDF → PNG変換（PDF.js使用）
│   ├── watermark.ts       透かし・ページ番号の追加
│   ├── preview.ts         PDF.jsによるサムネイル生成（直列化キュー）
│   └── download.ts        Blob生成・ダウンロード・ZIP出力
├── hooks/
│   ├── usePdfProcessor.ts  非同期処理の状態管理
│   └── useThumbnails.ts    サムネイル取得フック
├── types/
│   └── index.ts           型定義（ToolType等）
└── App.tsx                トップ画面・ツール切り替え
```

**設計の核:** UI層とPDF処理層を分離。処理関数は「`ArrayBuffer` を受け取り `Uint8Array` を返す純粋関数」として実装されており、UIとは独立している。

## 詳細ドキュメント

各機能の実装詳細は [`docs/`](./docs/) を参照してください。

| ドキュメント | 内容 |
|---|---|
| [page-thumbnails.md](./docs/page-thumbnails.md) | ページサムネイルプレビューの仕組み |
| [compress.md](./docs/compress.md) | PDF圧縮（Ghostscript WASM）の仕組み |
| [split-zip.md](./docs/split-zip.md) | 分割結果のZIPダウンロード |
| [reorder.md](./docs/reorder.md) | ページ編集（並び替え・削除）の仕組み |
| [image-convert.md](./docs/image-convert.md) | 画像↔PDF変換の仕組み |
| [watermark.md](./docs/watermark.md) | 透かし・ページ番号追加の仕組み |

## ライセンスに関する注意

圧縮機能は **@okathira/ghostpdl-wasm**（Ghostscript の WebAssembly ビルド）を使用しています。
このライブラリは **AGPL-3.0** ライセンスで提供されています。

- 個人・ホビー用途での利用は問題ありません
- 商用サービスとして配布・提供する場合は AGPL の条件（ソースコード開示等）を確認してください

## プライバシー

- 処理はすべてブラウザのメモリ内で完結
- ファイルの外部送信・サーバー保存は一切なし
- ダウンロード後に `URL.revokeObjectURL` でメモリを解放

## 注意事項

- パスワード付き（暗号化）PDFは処理できません
- 大容量ファイル（目安: 100MB超）は端末のメモリ上限に依存します
- 透かし・ページ番号の日本語テキストは現状英数字のみ対応です（pdf-lib標準フォントの制約）
- 対応ブラウザ: Chrome / Firefox / Safari / Edge の最新版
