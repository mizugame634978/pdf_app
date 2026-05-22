import { useState } from 'react';
import { FileUploader } from '../FileUploader/FileUploader';
import { StatusView } from './StatusView';
import { addTextWatermark, addPageNumbers, hasNonAscii } from '../../lib/watermark';
import type { WatermarkPosition, PageNumberOptions } from '../../lib/watermark';
import { downloadPdf } from '../../lib/download';
import styles from './ToolPanel.module.css';
import localStyles from './WatermarkTool.module.css';

type Tab = 'watermark' | 'pagenum';
type RunState = 'idle' | 'processing' | 'done' | 'error';

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'center',        label: '中央（斜め）' },
  { value: 'bottom-left',   label: '左下' },
  { value: 'bottom-right',  label: '右下' },
  { value: 'bottom-center', label: '下中央' },
];

const PAGENUM_POSITIONS: { value: NonNullable<PageNumberOptions['position']>; label: string }[] = [
  { value: 'bottom-center', label: '下中央' },
  { value: 'bottom-left',   label: '左下' },
  { value: 'bottom-right',  label: '右下' },
];

export function WatermarkTool() {
  const [tab, setTab] = useState<Tab>('watermark');
  const [file, setFile] = useState<File | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Watermark options
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>('center');
  const [wmColor, setWmColor] = useState('#808080');

  // Page number options
  const [pnPosition, setPnPosition] = useState<NonNullable<PageNumberOptions['position']>>('bottom-center');
  const [pnFormat, setPnFormat] = useState<'n' | 'n/total'>('n/total');
  const [pnFontSize, setPnFontSize] = useState(12);

  const nonAsciiWarning = tab === 'watermark' && hasNonAscii(wmText);

  const reset = () => {
    setFile(null);
    setRunState('idle');
    setError(null);
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const run = async () => {
    if (!file) return;
    setRunState('processing');
    try {
      const buffer = await file.arrayBuffer();
      const baseName = file.name.replace(/\.pdf$/i, '');
      let result: Uint8Array;

      if (tab === 'watermark') {
        result = await addTextWatermark(buffer, {
          text: wmText,
          fontSize: wmFontSize,
          opacity: wmOpacity,
          position: wmPosition,
          color: hexToRgb(wmColor),
        });
        downloadPdf(result, `${baseName}_watermarked.pdf`);
      } else {
        result = await addPageNumbers(buffer, {
          fontSize: pnFontSize,
          position: pnPosition,
          format: pnFormat,
        });
        downloadPdf(result, `${baseName}_numbered.pdf`);
      }
      setRunState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRunState('error');
    }
  };

  if (runState === 'processing') return <StatusView state="processing" error={null} onReset={reset} />;
  if (runState === 'error') return <StatusView state="error" error={error} onReset={reset} />;
  if (runState === 'done') {
    return (
      <div className={styles.panel}>
        <p className={localStyles.success}>PDFをダウンロードしました</p>
        <button className={styles.runBtn} onClick={reset}>別のファイルを処理する</button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={localStyles.tabs}>
        <button
          className={`${localStyles.tab} ${tab === 'watermark' ? localStyles.activeTab : ''}`}
          onClick={() => setTab('watermark')}
        >
          透かし
        </button>
        <button
          className={`${localStyles.tab} ${tab === 'pagenum' ? localStyles.activeTab : ''}`}
          onClick={() => setTab('pagenum')}
        >
          ページ番号
        </button>
      </div>

      {!file ? (
        <FileUploader onFiles={(files) => setFile(files[0])} />
      ) : (
        <>
          <p className={styles.fileName}>{file.name}</p>

          {tab === 'watermark' && (
            <div className={styles.section}>
              <p className={styles.label}>透かしテキスト</p>
              <input
                type="text"
                className={styles.textInput}
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                placeholder="例: CONFIDENTIAL"
              />
              {nonAsciiWarning && (
                <p className={localStyles.warning}>
                  ⚠️ 日本語などの非ASCII文字は表示されない場合があります（PDF標準フォントは英数字のみ対応）
                </p>
              )}

              <p className={styles.label}>配置</p>
              <div className={styles.btnGroup}>
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    className={`${styles.toggleBtn} ${wmPosition === p.value ? styles.active : ''}`}
                    onClick={() => setWmPosition(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className={localStyles.row}>
                <div className={localStyles.field}>
                  <p className={styles.label}>フォントサイズ</p>
                  <input
                    type="number"
                    className={localStyles.numInput}
                    value={wmFontSize}
                    min={8}
                    max={200}
                    onChange={(e) => setWmFontSize(Number(e.target.value))}
                  />
                </div>
                <div className={localStyles.field}>
                  <p className={styles.label}>透明度</p>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={wmOpacity}
                    onChange={(e) => setWmOpacity(Number(e.target.value))}
                    className={localStyles.slider}
                  />
                  <span className={localStyles.sliderVal}>{Math.round(wmOpacity * 100)}%</span>
                </div>
                <div className={localStyles.field}>
                  <p className={styles.label}>色</p>
                  <input
                    type="color"
                    value={wmColor}
                    onChange={(e) => setWmColor(e.target.value)}
                    className={localStyles.colorPicker}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'pagenum' && (
            <div className={styles.section}>
              <p className={styles.label}>配置</p>
              <div className={styles.btnGroup}>
                {PAGENUM_POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    className={`${styles.toggleBtn} ${pnPosition === p.value ? styles.active : ''}`}
                    onClick={() => setPnPosition(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <p className={styles.label}>形式</p>
              <div className={styles.btnGroup}>
                <button
                  className={`${styles.toggleBtn} ${pnFormat === 'n/total' ? styles.active : ''}`}
                  onClick={() => setPnFormat('n/total')}
                >
                  1 / 10 形式
                </button>
                <button
                  className={`${styles.toggleBtn} ${pnFormat === 'n' ? styles.active : ''}`}
                  onClick={() => setPnFormat('n')}
                >
                  1 形式
                </button>
              </div>

              <div className={localStyles.field}>
                <p className={styles.label}>フォントサイズ</p>
                <input
                  type="number"
                  className={localStyles.numInput}
                  value={pnFontSize}
                  min={8}
                  max={36}
                  onChange={(e) => setPnFontSize(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          <button
            className={styles.runBtn}
            onClick={run}
            disabled={tab === 'watermark' && !wmText.trim()}
          >
            {tab === 'watermark' ? '透かしを追加してダウンロード' : 'ページ番号を追加してダウンロード'}
          </button>
          <button className={styles.resetLink} onClick={reset}>ファイルを変更</button>
        </>
      )}
    </div>
  );
}
