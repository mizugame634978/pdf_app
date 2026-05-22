import { useState, useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { StatusView } from './StatusView';
import { reorderPages } from '../../lib/reorder';
import { downloadPdf } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import { useAllPageThumbnails } from '../../hooks/useThumbnails';
import styles from './ToolPanel.module.css';
import pageStyles from './ReorderTool.module.css';

interface PageSlot {
  key: string;
  srcIndex: number;
}

// ドラッグ中にビューポート端へ近づいたとき自動スクロールする
const SCROLL_THRESHOLD = 80; // px
const SCROLL_SPEED = 12;     // px/event

function autoScroll(clientY: number) {
  if (clientY < SCROLL_THRESHOLD) {
    window.scrollBy({ top: -SCROLL_SPEED });
  } else if (window.innerHeight - clientY < SCROLL_THRESHOLD) {
    window.scrollBy({ top: SCROLL_SPEED });
  }
}

export function ReorderTool() {
  const [file, setFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<PageSlot[]>([]);
  // ユーザーが意図的に全削除したか、まだロード中かを区別するフラグ
  const [initialized, setInitialized] = useState(false);
  const dragKey = useRef<string | null>(null);

  const { thumbnails, pageCount } = useAllPageThumbnails(file);

  const addFile = (files: File[]) => {
    setFile(files[0]);
    setSlots([]);
    setInitialized(false);
  };

  // pageCount が確定したタイミングで初期スロットを生成（一度だけ）
  if (!initialized && pageCount > 0) {
    setInitialized(true);
    setSlots(
      Array.from({ length: pageCount }, (_, i) => ({
        key: crypto.randomUUID(),
        srcIndex: i,
      }))
    );
  }

  const onDragStart = (key: string) => { dragKey.current = key; };

  const onDragOver = (e: DragEvent<HTMLLIElement>, targetKey: string) => {
    e.preventDefault();
    autoScroll(e.clientY);
    if (!dragKey.current || dragKey.current === targetKey) return;
    // dragover のたびにプレビュー並び替えを行い、視覚フィードバックを即時に出す
    const from = slots.findIndex((s) => s.key === dragKey.current);
    const to = slots.findIndex((s) => s.key === targetKey);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...slots];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSlots(next);
  };

  const removePage = (key: string) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

  const allDeleted = initialized && slots.length === 0;

  const processor = useCallback(async () => {
    if (!file) throw new Error('ファイルが選択されていません');
    if (slots.length === 0) throw new Error('ページがすべて削除されています');
    const buffer = await file.arrayBuffer();
    return reorderPages(buffer, slots.map((s) => s.srcIndex));
  }, [file, slots]);

  const onSuccess = useCallback((data: Uint8Array) => {
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'edited';
    downloadPdf(data, `${baseName}_edited.pdf`);
  }, [file]);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFile(null);
    setSlots([]);
    setInitialized(false);
    reset();
  };

  if (state === 'processing' || state === 'done' || state === 'error') {
    return <StatusView state={state} error={error} onReset={handleReset} />;
  }

  return (
    <div className={styles.panel}>
      {!file ? (
        <FileUploader onFiles={addFile} />
      ) : (
        <>
          <p className={styles.fileName}>
            {file.name}
            {pageCount > 0 && (
              <span className={styles.pageCount}> — {slots.length} / {pageCount}ページ</span>
            )}
          </p>

          {!initialized && (
            <p className={styles.hint}>プレビューを生成中...</p>
          )}

          {slots.length > 0 && (
            <>
              <ul className={pageStyles.list}>
                {slots.map((slot, i) => {
                  const thumb = thumbnails[slot.srcIndex];
                  return (
                    <li
                      key={slot.key}
                      className={pageStyles.item}
                      draggable
                      onDragStart={() => onDragStart(slot.key)}
                      onDragOver={(e) => onDragOver(e, slot.key)}
                    >
                      {thumb ? (
                        <img src={thumb} alt={`p${slot.srcIndex + 1}`} className={pageStyles.thumb} />
                      ) : (
                        <div className={pageStyles.thumbPlaceholder} />
                      )}
                      <span className={pageStyles.pos}>{i + 1}</span>
                      <span className={pageStyles.label}>元 {slot.srcIndex + 1} ページ</span>
                      <button
                        className={pageStyles.remove}
                        onClick={() => removePage(slot.key)}
                        title="削除"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.hint}>ドラッグで順序変更 / × で削除</p>
            </>
          )}

          <button
            className={styles.runBtn}
            onClick={run}
            disabled={!initialized || allDeleted}
          >
            保存してダウンロード
          </button>
          {allDeleted && (
            <p className={styles.warn}>ページがすべて削除されています</p>
          )}
          <button className={styles.resetLink} onClick={handleReset}>
            ファイルを変更
          </button>
        </>
      )}
    </div>
  );
}
