import { useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import styles from './FileUploader.module.css';

const PRESETS = {
  pdf: {
    accept: '.pdf,application/pdf',
    filter: (f: File) => f.type === 'application/pdf' || f.name.endsWith('.pdf'),
    label: 'クリックまたはドラッグ&ドロップでPDFを追加',
  },
  image: {
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
    filter: (f: File) => /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name),
    label: 'クリックまたはドラッグ&ドロップで画像を追加（JPEG / PNG）',
  },
} as const;

interface Props {
  multiple?: boolean;
  mode?: keyof typeof PRESETS;
  onFiles: (files: File[]) => void;
}

export function FileUploader({ multiple = false, mode = 'pdf', onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preset = PRESETS[mode];

  const handle = (files: FileList | null) => {
    if (!files) return;
    const filtered = Array.from(files).filter(preset.filter);
    if (filtered.length > 0) onFiles(filtered);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handle(e.dataTransfer.files);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => handle(e.target.files);

  return (
    <div
      className={styles.dropzone}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={preset.accept}
        multiple={multiple}
        hidden
        onChange={onChange}
      />
      <p className={styles.icon}>+</p>
      <p>{preset.label}</p>
      {multiple && <p className={styles.hint}>複数ファイル選択可</p>}
    </div>
  );
}
