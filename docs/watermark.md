# 透かし・ページ番号追加（issue #7）

## 概要

PDFの全ページに任意テキストの透かしを追加する機能と、ページ番号をフッターに追加する機能。
`WatermarkTool` にタブ切り替えUIでまとめている。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/lib/watermark.ts` | 透かし・ページ番号追加のコアロジック |
| `src/components/ToolPanel/WatermarkTool.tsx` | タブ切り替えUI・オプション設定 |

## `watermark.ts` のAPI

### `addTextWatermark(buffer, options): Promise<Uint8Array>`

```ts
interface WatermarkOptions {
  text: string;
  fontSize?: number;          // デフォルト: 48
  opacity?: number;           // デフォルト: 0.3（0〜1）
  position?: WatermarkPosition; // デフォルト: 'center'
  color?: { r: number; g: number; b: number }; // デフォルト: グレー
}

type WatermarkPosition = 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
```

### `addPageNumbers(buffer, options): Promise<Uint8Array>`

```ts
interface PageNumberOptions {
  fontSize?: number;                              // デフォルト: 12
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center'; // デフォルト: 'bottom-center'
  format?: 'n' | 'n/total';                      // デフォルト: 'n/total'（例: "3 / 10"）
}
```

## 実装の仕組み

### テキスト描画

pdf-libの `page.drawText()` で各ページにテキストを重ねる。

```ts
page.drawText(text, {
  x, y,
  size: fontSize,
  font,
  color: rgb(r, g, b),
  opacity,
  rotate: degrees(45),  // 中央配置の場合のみ45°傾ける
});
```

### 配置ごとの座標計算

| 配置 | x | y | 回転 |
|---|---|---|---|
| 中央 | `(width - textWidth) / 2` | `(height - textHeight) / 2` | 45° |
| 左下 | `40` | `30` | 0° |
| 右下 | `width - textWidth - 40` | `30` | 0° |
| 下中央 | `(width - textWidth) / 2` | `30` | 0° |

テキスト幅は `font.widthOfTextAtSize(text, fontSize)` で取得する。
ページサイズは `page.getSize()` で取得するため、A4・レターサイズなどの違いを自動的に吸収する。

### ページ番号の座標

ページ番号はページごとに番号が変わるため、ループ内で毎回テキスト幅を再計算している。

```ts
for (let i = 0; i < pages.length; i++) {
  const text = format === 'n/total' ? `${i + 1} / ${total}` : `${i + 1}`;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  // ...
}
```

## フォントの制約

pdf-lib の標準フォント（`StandardFonts.Helvetica`）は **Latin-1（英数字・記号）のみ** に対応している。
日本語などの非ASCII文字を入力すると文字が描画されない（文字化けや空白になる）。

このため、入力テキストに非ASCII文字が含まれる場合は警告を表示する：

```ts
export function hasNonAscii(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}
```

日本語を使いたい場合は issue #13（Noto Sans JP 対応）で対応予定。

## UIの仕様

### 透かしタブ

| 設定項目 | コントロール | デフォルト |
|---|---|---|
| テキスト | `<input type="text">` | `CONFIDENTIAL` |
| 配置 | トグルボタン4択 | 中央（斜め） |
| フォントサイズ | `<input type="number">` | 48 |
| 透明度 | `<input type="range">` | 30% |
| 色 | `<input type="color">` | グレー（#808080） |

### ページ番号タブ

| 設定項目 | コントロール | デフォルト |
|---|---|---|
| 配置 | トグルボタン3択 | 下中央 |
| 形式 | トグルボタン2択 | 1 / 10 形式 |
| フォントサイズ | `<input type="number">` | 12 |
