import { useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import styles from './FileUploader.module.css';

interface Props {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileUploader({ multiple = false, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    if (pdfs.length > 0) onFiles(pdfs);
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
        accept=".pdf,application/pdf"
        multiple={multiple}
        hidden
        onChange={onChange}
      />
      <p className={styles.icon}>+</p>
      <p>クリックまたはドラッグ&ドロップでPDFを追加</p>
      {multiple && <p className={styles.hint}>複数ファイル選択可</p>}
    </div>
  );
}
