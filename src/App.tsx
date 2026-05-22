import { useState } from 'react';
import { MergeTool } from './components/ToolPanel/MergeTool';
import { SplitTool } from './components/ToolPanel/SplitTool';
import { RotateTool } from './components/ToolPanel/RotateTool';
import { CompressTool } from './components/ToolPanel/CompressTool';
import { ReorderTool } from './components/ToolPanel/ReorderTool';
import type { ToolType } from './types';
import styles from './App.module.css';

const TOOLS: { id: ToolType; label: string; desc: string; emoji: string }[] = [
  { id: 'merge',    label: 'マージ', desc: '複数のPDFを1つに結合',       emoji: '🔗' },
  { id: 'split',    label: '分割',   desc: '1つのPDFを複数に分割',       emoji: '✂️' },
  { id: 'rotate',   label: '回転',   desc: 'ページを90°/180°/270°回転', emoji: '🔄' },
  { id: 'compress', label: '圧縮',     desc: 'ファイルサイズを削減',           emoji: '🗜️' },
  { id: 'reorder',  label: 'ページ編集', desc: 'ページの削除・並び替え',       emoji: '📄' },
];

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const tool = TOOLS.find((t) => t.id === activeTool);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => setActiveTool(null)}>
          PDF Tools
        </h1>
        {activeTool && (
          <button className={styles.back} onClick={() => setActiveTool(null)}>
            ← ツール一覧
          </button>
        )}
      </header>

      <main className={styles.main}>
        {!activeTool ? (
          <>
            <p className={styles.tagline}>
              ファイルはブラウザ内で処理されます。サーバーへの送信は一切ありません。
            </p>
            <div className={styles.grid}>
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  className={styles.card}
                  onClick={() => setActiveTool(t.id)}
                >
                  <span className={styles.cardEmoji}>{t.emoji}</span>
                  <span className={styles.cardLabel}>{t.label}</span>
                  <span className={styles.cardDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.toolView}>
            <h2 className={styles.toolTitle}>
              {tool?.emoji} {tool?.label}
            </h2>
            {activeTool === 'merge'    && <MergeTool />}
            {activeTool === 'split'    && <SplitTool />}
            {activeTool === 'rotate'   && <RotateTool />}
            {activeTool === 'compress' && <CompressTool />}
            {activeTool === 'reorder'  && <ReorderTool />}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        完全クライアントサイド処理 — ファイルは外部に送信されません
      </footer>
    </div>
  );
}
