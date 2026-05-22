import { useState, useCallback } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { StatusView } from './StatusView';
import { rotatePdf } from '../../lib/rotate';
import { downloadPdf } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import type { RotationAngle } from '../../types';
import styles from './ToolPanel.module.css';

const ANGLES: RotationAngle[] = [90, 180, 270];

export function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [scope, setScope] = useState<'all' | 'pages'>('all');
  const [pageInput, setPageInput] = useState('');

  const addFile = (files: File[]) => setFile(files[0]);

  const parsePageIndices = (): number[] => {
    return pageInput
      .split(',')
      .flatMap((s) => {
        const m = s.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (!m) return [];
        const start = parseInt(m[1]) - 1;
        const end = m[2] ? parseInt(m[2]) - 1 : start;
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      });
  };

  const processor = useCallback(async () => {
    if (!file) throw new Error('ファイルが選択されていません');
    const buffer = await file.arrayBuffer();
    const targets = scope === 'all' ? 'all' : parsePageIndices();
    if (scope === 'pages' && (targets as number[]).length === 0) {
      throw new Error('ページ番号の形式が正しくありません');
    }
    return rotatePdf(buffer, angle, targets);
  }, [file, angle, scope, pageInput]);

  const onSuccess = useCallback((data: Uint8Array) => {
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'rotated';
    downloadPdf(data, `${baseName}_rotated.pdf`);
  }, [file]);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFile(null);
    setPageInput('');
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
          <p className={styles.fileName}>{file.name}</p>

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
                ページ指定
              </label>
            </div>
            {scope === 'pages' && (
              <div className={styles.rangeInput}>
                <input
                  type="text"
                  placeholder="例: 1, 3-5"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className={styles.textInput}
                />
              </div>
            )}
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
