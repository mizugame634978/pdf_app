import { useState, useCallback } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { PageList } from '../PageList/PageList';
import { StatusView } from './StatusView';
import { mergePdfs } from '../../lib/merge';
import { downloadPdf } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import type { PdfFile } from '../../types';
import styles from './ToolPanel.module.css';

export function MergeTool() {
  const [files, setFiles] = useState<PdfFile[]>([]);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
      })),
    ]);
  };

  const processor = useCallback(async () => {
    const buffers = await Promise.all(files.map((f) => f.file.arrayBuffer()));
    return mergePdfs(buffers);
  }, [files]);

  const onSuccess = useCallback((data: Uint8Array) => {
    downloadPdf(data, 'merged.pdf');
  }, []);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  if (state === 'processing' || state === 'done' || state === 'error') {
    return <StatusView state={state} error={error} onReset={handleReset} />;
  }

  return (
    <div className={styles.panel}>
      <FileUploader multiple onFiles={addFiles} />
      {files.length > 0 && (
        <>
          <PageList
            files={files}
            onReorder={setFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          />
          <p className={styles.hint}>ドラッグで順序を変更できます</p>
          <button
            className={styles.runBtn}
            onClick={run}
            disabled={files.length < 2}
          >
            結合してダウンロード
          </button>
          {files.length < 2 && (
            <p className={styles.warn}>2つ以上のファイルが必要です</p>
          )}
        </>
      )}
    </div>
  );
}
