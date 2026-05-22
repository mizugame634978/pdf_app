import { useRef } from 'react';
import type { DragEvent } from 'react';
import type { PdfFile } from '../../types';
import { useFirstPageThumbnail } from '../../hooks/useThumbnails';
import styles from './PageList.module.css';

interface Props {
  files: PdfFile[];
  onReorder: (files: PdfFile[]) => void;
  onRemove: (id: string) => void;
}

function FileThumbnail({ file }: { file: File }) {
  const url = useFirstPageThumbnail(file);
  return url ? (
    <img src={url} alt="page preview" className={styles.thumb} />
  ) : (
    <div className={styles.thumbPlaceholder} />
  );
}

export function PageList({ files, onReorder, onRemove }: Props) {
  const dragId = useRef<string | null>(null);

  const onDragStart = (id: string) => {
    dragId.current = id;
  };

  const onDrop = (e: DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === targetId) return;
    const from = files.findIndex((f) => f.id === dragId.current);
    const to = files.findIndex((f) => f.id === targetId);
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
    dragId.current = null;
  };

  return (
    <ul className={styles.list}>
      {files.map((f, i) => (
        <li
          key={f.id}
          className={styles.item}
          draggable
          onDragStart={() => onDragStart(f.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, f.id)}
        >
          <FileThumbnail file={f.file} />
          <span className={styles.num}>{i + 1}</span>
          <span className={styles.name}>{f.name}</span>
          <span className={styles.size}>
            {(f.file.size / 1024).toFixed(0)} KB
          </span>
          <button
            className={styles.remove}
            onClick={() => onRemove(f.id)}
            title="削除"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
