import { useState } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { StatusView } from './StatusView';
import { imagesToPdf } from '../../lib/imageToPdf';
import { pdfToImages } from '../../lib/pdfToImage';
import { downloadPdf } from '../../lib/download';
import styles from './ToolPanel.module.css';
import localStyles from './ImageConvertTool.module.css';

type Tab = 'imageToPdf' | 'pdfToImage';
type RunState = 'idle' | 'processing' | 'done' | 'error';

export function ImageConvertTool() {
  const [tab, setTab] = useState<Tab>('imageToPdf');

  // 画像→PDF state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imgState, setImgState] = useState<RunState>('idle');
  const [imgError, setImgError] = useState<string | null>(null);

  // PDF→画像 state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfState, setPdfState] = useState<RunState>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);

  const resetImg = () => { setImageFiles([]); setImgState('idle'); setImgError(null); };
  const resetPdf = () => { setPdfFile(null); setPdfState('idle'); setPdfError(null); };

  const runImageToPdf = async () => {
    if (imageFiles.length === 0) return;
    setImgState('processing');
    try {
      const result = await imagesToPdf(imageFiles);
      downloadPdf(result, 'images_converted.pdf');
      setImgState('done');
    } catch (e) {
      setImgError(e instanceof Error ? e.message : String(e));
      setImgState('error');
    }
  };

  const runPdfToImage = async () => {
    if (!pdfFile) return;
    setPdfState('processing');
    try {
      const buffer = await pdfFile.arrayBuffer();
      const baseName = pdfFile.name.replace(/\.pdf$/i, '');
      await pdfToImages(buffer, baseName);
      setPdfState('done');
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
      setPdfState('error');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={localStyles.tabs}>
        <button
          className={`${localStyles.tab} ${tab === 'imageToPdf' ? localStyles.activeTab : ''}`}
          onClick={() => setTab('imageToPdf')}
        >
          画像 → PDF
        </button>
        <button
          className={`${localStyles.tab} ${tab === 'pdfToImage' ? localStyles.activeTab : ''}`}
          onClick={() => setTab('pdfToImage')}
        >
          PDF → 画像
        </button>
      </div>

      {tab === 'imageToPdf' && (
        <>
          {imgState === 'processing' && <StatusView state="processing" error={null} onReset={resetImg} />}
          {imgState === 'error' && <StatusView state="error" error={imgError} onReset={resetImg} />}
          {imgState === 'done' && (
            <>
              <p className={localStyles.success}>PDFを生成してダウンロードしました</p>
              <button className={styles.runBtn} onClick={resetImg}>別の画像を変換する</button>
            </>
          )}
          {imgState === 'idle' && (
            <>
              <FileUploader mode="image" multiple onFiles={setImageFiles} />
              {imageFiles.length > 0 && (
                <>
                  <ul className={localStyles.fileList}>
                    {imageFiles.map((f, i) => (
                      <li key={i} className={localStyles.fileItem}>{f.name}</li>
                    ))}
                  </ul>
                  <button className={styles.runBtn} onClick={runImageToPdf}>
                    PDFに変換してダウンロード
                  </button>
                  <button className={styles.resetLink} onClick={resetImg}>ファイルを変更</button>
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === 'pdfToImage' && (
        <>
          {pdfState === 'processing' && <StatusView state="processing" error={null} onReset={resetPdf} />}
          {pdfState === 'error' && <StatusView state="error" error={pdfError} onReset={resetPdf} />}
          {pdfState === 'done' && (
            <>
              <p className={localStyles.success}>画像をダウンロードしました</p>
              <button className={styles.runBtn} onClick={resetPdf}>別のPDFを変換する</button>
            </>
          )}
          {pdfState === 'idle' && (
            <>
              <FileUploader onFiles={(files) => setPdfFile(files[0])} />
              {pdfFile && (
                <>
                  <p className={styles.fileName}>{pdfFile.name}</p>
                  <p className={localStyles.hint}>各ページをPNG画像として書き出します（複数ページはZIPでダウンロード）</p>
                  <button className={styles.runBtn} onClick={runPdfToImage}>
                    画像に変換してダウンロード
                  </button>
                  <button className={styles.resetLink} onClick={resetPdf}>ファイルを変更</button>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
