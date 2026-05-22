# #3 重い処理のWeb Worker化

## 概要

マージ・分割・回転の処理を Web Worker に移し、処理中もUIが操作可能な状態を維持する。

## 背景

DESIGN.md 非機能要件「大きなPDFでもUIが固まらないこと」に対応。
現状はメインスレッドで pdf-lib を実行しているため、大容量ファイルを処理するとブラウザがフリーズすることがある。

## やること

- `src/workers/pdfWorker.ts` を作成し、pdf-lib の処理をすべてここに移す
- `usePdfProcessor` フックを Worker 経由の非同期通信に対応させる
- Vite の `worker` オプション設定を `vite.config.ts` に追加する
- Worker へのメッセージ型を `src/types/worker.ts` に定義する

## 技術メモ

- Vite は `new Worker(new URL('./workers/pdfWorker.ts', import.meta.url))` でWorker を扱える
- `ArrayBuffer` は `Transferable` なので `postMessage` のゼロコピー転送が使える
- pdf-lib は Worker 内でも動作する（DOM 非依存）

## 受け入れ条件

- [ ] 50MB 以上のPDFを処理してもUIが操作可能な状態を維持する
- [ ] 処理中はスピナーが表示される（既存挙動を維持）
- [ ] 処理完了後・エラー時のハンドリングが既存と同じように動作する
