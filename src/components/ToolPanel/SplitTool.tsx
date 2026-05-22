import { useState, useCallback } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { PageThumbnails } from '../PageThumbnails/PageThumbnails';
import { StatusView } from './StatusView';
import { splitPdf, splitPdfByPage } from '../../lib/split';
import { downloadPdf, downloadAsZip } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import { useAllPageThumbnails } from '../../hooks/useThumbnails';
import type { PageRange } from '../../types';
import styles from './ToolPanel.module.css';

type SplitMode = 'ranges' | 'each';

function parseRanges(input: string, maxPage: number): PageRange[] | null {
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  const ranges: PageRange[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const start = parseInt(m[1]);
    const end = m[2] ? parseInt(m[2]) : start;
    if (start < 1 || end < start || end > maxPage) return null;
    ranges.push({ start, end });
  }
  return ranges.length > 0 ? ranges : null;
}

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>('each');
  const [rangeInput, setRangeInput] = useState('');

  const { thumbnails, pageCount, loading } = useAllPageThumbnails(file);

  const addFile = (files: File[]) => setFile(files[0]);

  const processor = useCallback(async () => {
    if (!file) throw new Error('ファイルが選択されていません');
    const buffer = await file.arrayBuffer();
    if (mode === 'each') {
      return splitPdfByPage(buffer);
    }
    const ranges = parseRanges(rangeInput, pageCount || 9999);
    if (!ranges) throw new Error('ページ範囲の形式が正しくありません（例: 1-3, 4-6）');
    return splitPdf(buffer, ranges);
  }, [file, mode, rangeInput, pageCount]);

  const onSuccess = useCallback((results: Uint8Array[]) => {
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'split';
    const files = results.map((data, i) => ({ data, name: `${baseName}_${i + 1}.pdf` }));
    if (files.length === 1) {
      downloadPdf(files[0].data, files[0].name);
    } else {
      downloadAsZip(files, `${baseName}_split.zip`);
    }
  }, [file]);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFile(null);
    setRangeInput('');
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

          <PageThumbnails thumbnails={thumbnails} loading={loading} />

          <div className={styles.modeGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                checked={mode === 'each'}
                onChange={() => setMode('each')}
              />
              1ページずつ全分割
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                checked={mode === 'ranges'}
                onChange={() => setMode('ranges')}
              />
              ページ範囲を指定
            </label>
          </div>

          {mode === 'ranges' && (
            <div className={styles.rangeInput}>
              <input
                type="text"
                placeholder="例: 1-3, 4-6, 7"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className={styles.textInput}
              />
              <p className={styles.hint}>カンマ区切りで複数指定できます</p>
            </div>
          )}

          <button className={styles.runBtn} onClick={run}>
            分割してダウンロード
          </button>
          <button className={styles.resetLink} onClick={handleReset}>
            ファイルを変更
          </button>
        </>
      )}
    </div>
  );
}
