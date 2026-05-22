import { useState, useCallback } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { PageThumbnails } from '../PageThumbnails/PageThumbnails';
import { StatusView } from './StatusView';
import { rotatePdf } from '../../lib/rotate';
import { downloadPdf } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import { useAllPageThumbnails } from '../../hooks/useThumbnails';
import type { RotationAngle } from '../../types';
import styles from './ToolPanel.module.css';

const ANGLES: RotationAngle[] = [90, 180, 270];

export function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [scope, setScope] = useState<'all' | 'pages'>('all');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const { thumbnails, pageCount, loading } = useAllPageThumbnails(file);

  const addFile = (files: File[]) => {
    setFile(files[0]);
    setSelectedPages(new Set());
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      next.has(pageNum) ? next.delete(pageNum) : next.add(pageNum);
      return next;
    });
  };

  const processor = useCallback(async () => {
    if (!file) throw new Error('ファイルが選択されていません');
    const buffer = await file.arrayBuffer();
    if (scope === 'pages' && selectedPages.size === 0) {
      throw new Error('回転するページを選択してください');
    }
    const targets = scope === 'all'
      ? 'all'
      : Array.from(selectedPages).map((p) => p - 1);
    return rotatePdf(buffer, angle, targets);
  }, [file, angle, scope, selectedPages]);

  const onSuccess = useCallback((data: Uint8Array) => {
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'rotated';
    downloadPdf(data, `${baseName}_rotated.pdf`);
  }, [file]);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFile(null);
    setSelectedPages(new Set());
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
            {pageCount > 0 && <span className={styles.pageCount}> — {pageCount}ページ</span>}
          </p>

          <div className={styles.section}>
            <p className={styles.label}>回転角度</p>
            <div className={styles.btnGroup}>
              {ANGLES.map((a) => (
                <button
                  key={a}
                  className={`${styles.toggleBtn} ${angle === a ? styles.active : ''}`}
                  onClick={() => setAngle(a)}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.label}>対象ページ</p>
            <div className={styles.modeGroup}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                />
                全ページ
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  checked={scope === 'pages'}
                  onChange={() => setScope('pages')}
                />
                ページを選択
              </label>
            </div>

            {scope === 'pages' && (
              <>
                <p className={styles.hint}>サムネイルをクリックしてページを選択</p>
                {selectedPages.size > 0 && (
                  <p className={styles.hint}>
                    選択中: {Array.from(selectedPages).sort((a, b) => a - b).join(', ')} ページ
                  </p>
                )}
              </>
            )}

            <PageThumbnails
              thumbnails={thumbnails}
              loading={loading}
              selectedPages={scope === 'pages' ? selectedPages : undefined}
              onToggle={scope === 'pages' ? togglePage : undefined}
            />
          </div>

          <button className={styles.runBtn} onClick={run}>
            回転してダウンロード
          </button>
          <button className={styles.resetLink} onClick={handleReset}>
            ファイルを変更
          </button>
        </>
      )}
    </div>
  );
}
