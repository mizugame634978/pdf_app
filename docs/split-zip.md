# 分割結果のZIPダウンロード（issue #4）

## 概要

PDF分割で複数ファイルが生成される場合、jszip を使って1つのZIPファイルにまとめてダウンロードする機能。
単体ファイルの場合はZIPにせず直接PDFをダウンロードする。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/download.ts` | ダウンロード処理全般（単体PDF・ZIP） |
| `src/components/ToolPanel/SplitTool.tsx` | 分割UI（結果件数に応じてダウンロード方式を切り替え） |

## `download.ts` のAPI

### `downloadPdf(data: Uint8Array, filename: string)`

単体PDFをダウンロードする。

```ts
const blob = new Blob([data.buffer], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
a.href = url; a.download = filename; a.click();
URL.revokeObjectURL(url);  // メモリ解放
```

### `downloadAsZip(files: { data: Uint8Array; name: string }[], zipName: string)`

複数ファイルをZIPにまとめてダウンロードする。

```ts
const zip = new JSZip();
for (const f of files) {
  zip.file(f.name, f.data);  // ZIPにファイルを追加
}
const blob = await zip.generateAsync({ type: 'blob' });
// → 以降はdownloadPdfと同じフロー
```

## 分割ツールでの切り替えロジック

```
分割結果が1件 → downloadPdf()  で単体PDFをダウンロード
分割結果が2件以上 → downloadAsZip() でZIPをダウンロード
```

ZIPファイル名は `{元のファイル名}_split.zip`。
ZIP内のファイル名は `{元のファイル名}_p001.pdf`、`_p002.pdf` のようにゼロ埋めナンバリングされる。

## 分割モード

| モード | 動作 |
|---|---|
| 全ページ分割 | 各ページを個別PDFに。2ページ以上なら必ずZIP |
| ページ範囲指定 | カンマ区切りで複数範囲を指定（例: `1-3,5,7-9`）。範囲が1つなら単体PDF |

## なぜ1件の場合はZIPにしないか

ユーザーが1ページのみ取り出したい場合にZIPを解凍する手間を省くため。
「結果が1ファイル = ZIP不要」というシンプルなルールで実装している。
