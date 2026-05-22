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

// 各スロットは「元PDFの何ページ目か（0-based）」を保持する
interface PageSlot {
  key: string;      // ドラッグキー用のユニークID
  srcIndex: number; // 元ページインデックス（0-based）
}

export function ReorderTool() {
  const [file, setFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<PageSlot[]>([]);
  const dragKey = useRef<string | null>(null);

  const { thumbnails, pageCount, loading } = useAllPageThumbnails(file);

  const addFile = (files: File[]) => {
    const f = files[0];
    setFile(f);
    setSlots([]);
  };

  // サムネイルが揃ったタイミングで初期スロットを生成
  const initSlots = useCallback(() => {
    if (slots.length === 0 && pageCount > 0) {
      setSlots(
        Array.from({ length: pageCount }, (_, i) => ({
          key: crypto.randomUUID(),
          srcIndex: i,
        }))
      );
    }
  }, [slots.length, pageCount]);

  if (pageCount > 0 && slots.length === 0) initSlots();

  const onDragStart = (key: string) => { dragKey.current = key; };

  const onDrop = (e: DragEvent<HTMLLIElement>, targetKey: string) => {
    e.preventDefault();
    if (!dragKey.current || dragKey.current === targetKey) return;
    const from = slots.findIndex((s) => s.key === dragKey.current);
    const to = slots.findIndex((s) => s.key === targetKey);
    const next = [...slots];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSlots(next);
    dragKey.current = null;
  };

  const removePage = (key: string) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

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

          {loading && slots.length === 0 && (
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
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop(e, slot.key)}
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
            disabled={slots.length === 0}
          >
            保存してダウンロード
          </button>
          {slots.length === 0 && (
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
