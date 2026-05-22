# PDF Tools

ブラウザ上で動作するPDF編集Webアプリ。**ファイルはサーバーへ一切送信されません。**

## 機能

| 機能 | 説明 |
|---|---|
| マージ | 複数のPDFを1つに結合。ドラッグで順序変更可能 |
| 分割 | 1ページずつ全分割、またはページ範囲を指定して分割 |
| 回転 | 全ページまたは指定ページを 90° / 180° / 270° 回転 |

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

| レイヤー | 採用技術 |
|---|---|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| PDF処理エンジン | pdf-lib |
| プレビュー | pdfjs-dist |
| PDF圧縮 | @okathira/ghostpdl-wasm |

## ライセンスに関する注意

圧縮機能は **@okathira/ghostpdl-wasm**（Ghostscript の WebAssembly ビルド）を使用しています。
このライブラリは **AGPL-3.0** ライセンスで提供されています。

- 個人・ホビー用途での利用は問題ありません
- 商用サービスとして配布・提供する場合は AGPL の条件（ソースコード開示等）を確認してください

## アーキテクチャ

```
src/
├── components/
│   ├── FileUploader/     ドラッグ&ドロップ対応ファイル入力
│   ├── PageList/         並び替え可能なファイルリスト（マージ用）
│   └── ToolPanel/        各ツール画面・処理状態表示
├── lib/
│   ├── merge.ts          PDFの結合処理
│   ├── split.ts          PDFの分割処理
│   ├── rotate.ts         PDFの回転処理
│   └── download.ts       Blob生成・ダウンロード
├── hooks/
│   └── usePdfProcessor.ts  非同期処理の状態管理
├── types/
│   └── index.ts          型定義
└── App.tsx               ルーティング・トップ画面
```

**設計の核:** UI層とPDF処理層を分離。処理関数は「`ArrayBuffer` を受け取り `Uint8Array` を返す純粋関数」として実装されており、UIとは独立している。

## プライバシー

- 処理はすべてブラウザのメモリ内で完結
- ファイルの外部送信・サーバー保存は一切なし
- ダウンロード後に `URL.revokeObjectURL` でメモリを解放

## 注意事項

- パスワード付き（暗号化）PDFは処理できません
- 大容量ファイル（目安: 100MB超）は端末のメモリ上限に依存します
- 対応ブラウザ: Chrome / Firefox / Safari / Edge の最新版
