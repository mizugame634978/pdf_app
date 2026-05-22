import { useState, useCallback } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { StatusView } from './StatusView';
import { compressPdf } from '../../lib/compress';
import type { CompressQuality } from '../../lib/compress';
import { downloadPdf } from '../../lib/download';
import { usePdfProcessor } from '../../hooks/usePdfProcessor';
import styles from './ToolPanel.module.css';
import compressStyles from './CompressTool.module.css';

const QUALITIES: { value: CompressQuality; label: string; desc: string }[] = [
  { value: 'low',    label: '低画質',  desc: '最小サイズ（72 dpi）' },
  { value: 'medium', label: '中画質',  desc: 'バランス型（150 dpi）' },
  { value: 'high',   label: '高画質',  desc: '高品質（300 dpi）' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressQuality>('medium');
  const [resultSize, setResultSize] = useState<number | null>(null);

  const addFile = (files: File[]) => {
    setFile(files[0]);
    setResultSize(null);
  };

  const processor = useCallback(async () => {
    if (!file) throw new Error('ファイルが選択されていません');
    const buffer = await file.arrayBuffer();
    return compressPdf(buffer, quality);
  }, [file, quality]);

  const onSuccess = useCallback((data: Uint8Array) => {
    setResultSize(data.byteLength);
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'compressed';
    downloadPdf(data, `${baseName}_compressed.pdf`);
  }, [file]);

  const { state, error, run, reset } = usePdfProcessor(processor, onSuccess);

  const handleReset = () => {
    setFile(null);
    setResultSize(null);
    reset();
  };

  if (state === 'processing') {
    return (
      <div className={styles.panel}>
        <StatusView state="processing" error={null} onReset={handleReset} />
        <p className={compressStyles.loadingNote}>
          初回はWASMのロードに時間がかかる場合があります
        </p>
      </div>
    );
  }

  if (state === 'done') {
    const originalSize = file?.size ?? 0;
    const ratio = resultSize != null && originalSize > 0
      ? Math.round((1 - resultSize / originalSize) * 100)
      : 0;
    return (
      <div className={styles.panel}>
        <div className={compressStyles.result}>
          <p className={compressStyles.resultTitle}>圧縮完了</p>
          <div className={compressStyles.sizeRow}>
            <span>圧縮前</span>
            <strong>{formatBytes(originalSize)}</strong>
          </div>
          <div className={compressStyles.sizeRow}>
            <span>圧縮後</span>
            <strong>{formatBytes(resultSize ?? 0)}</strong>
          </div>
          <div className={compressStyles.sizeRow}>
            <span>削減率</span>
            <strong className={ratio > 0 ? compressStyles.positive : compressStyles.negative}>
              {ratio > 0 ? `-${ratio}%` : `+${Math.abs(ratio)}%`}
            </strong>
          </div>
        </div>
        <button className={styles.runBtn} onClick={handleReset}>
          別のファイルを処理する
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return <StatusView state="error" error={error} onReset={handleReset} />;
  }

  return (
    <div className={styles.panel}>
      {!file ? (
        <FileUploader onFiles={addFile} />
      ) : (
        <>
          <p className={styles.fileName}>{file.name}</p>
          <p className={compressStyles.originalSize}>
            元のサイズ: {formatBytes(file.size)}
          </p>

          <div className={styles.section}>
            <p className={styles.label}>圧縮品質</p>
            <div className={compressStyles.qualityGroup}>
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  className={`${compressStyles.qualityBtn} ${quality === q.value ? compressStyles.active : ''}`}
                  onClick={() => setQuality(q.value)}
                >
                  <span className={compressStyles.qualityLabel}>{q.label}</span>
                  <span className={compressStyles.qualityDesc}>{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p className={compressStyles.note}>
            初回実行時にWASM（約15MB）をロードします
          </p>

          <button className={styles.runBtn} onClick={run}>
            圧縮してダウンロード
          </button>
          <button className={styles.resetLink} onClick={handleReset}>
            ファイルを変更
          </button>
        </>
      )}
    </div>
  );
}
