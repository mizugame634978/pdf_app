# PDF圧縮（issue #2）

## 概要

Ghostscript の WebAssembly ビルドを使ってPDFのファイルサイズを削減する機能。
pdf-lib の単純な再書き出しとは異なり、画像の再エンコードを伴う本格的な圧縮を行う。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/compress.ts` | Ghostscript WASMの呼び出しロジック |
| `src/components/ToolPanel/CompressTool.tsx` | 品質選択UI・サイズ表示 |

## 品質設定

Ghostscript の `-dPDFSETTINGS` オプションで3段階の品質を切り替える。

| 設定値 | オプション | 解像度 | 主な用途 |
|---|---|---|---|
| `low` | `/screen` | 72 dpi | 最小サイズ。Web閲覧用 |
| `medium` | `/ebook` | 150 dpi | バランス型。デフォルト |
| `high` | `/printer` | 300 dpi | 高品質。印刷用途 |

## 実装の仕組み

### 遅延ロード

Ghostscript WASMは約15MBと大きいため、`compress.ts` を `import()` の動的インポートで遅延ロードしている。
初回実行時のみダウンロードが発生し、2回目以降はブラウザキャッシュが使われる。

### ファイルの受け渡し

Ghostscript WASMはファイルシステムAPIを通じて入出力を行う。
ブラウザ内のメモリ上にある仮想ファイルシステム（Emscripten FS）を使って以下の流れで処理する：

```
1. Module.FS.writeFile('input.pdf', inputBytes)   // 仮想FSに書き込み
2. Module.callMain([...gs引数...])                 // Ghostscript実行
3. Module.FS.readFile('output.pdf')               // 結果を読み出し
4. Module.FS.unlink('input.pdf')                  // 仮想FSをクリーンアップ
   Module.FS.unlink('output.pdf')
```

実際のファイルはブラウザのメモリ内にのみ存在し、ディスクやサーバーには書き込まれない。

### Ghostscript の実行引数

```
gs -dNOPAUSE -dBATCH -dSAFER
   -sDEVICE=pdfwrite
   -dPDFSETTINGS=/ebook       ← 品質設定
   -sOutputFile=output.pdf
   input.pdf
```

## UIの仕様

- ファイルアップロード後に品質を選択して実行
- 処理中は「初回はWASMのロードに時間がかかる場合があります」の注記を表示
- 完了後に圧縮前後のサイズ・削減率を表示
  - 削減率がマイナス（サイズが増えた）場合も正直に表示する

## ライセンス

`@okathira/ghostpdl-wasm` は **AGPL-3.0** ライセンス。
ホビー・個人用途では問題ないが、商用サービスとして配布する場合はソースコード開示義務が発生する可能性がある。
