import styles from './PageThumbnails.module.css';

interface Props {
  thumbnails: string[];
  loading: boolean;
  selectedPages?: Set<number>; // 1-based page numbers
  onToggle?: (pageNum: number) => void;
}

export function PageThumbnails({ thumbnails, loading, selectedPages, onToggle }: Props) {
  if (loading && thumbnails.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>プレビューを生成中...</span>
      </div>
    );
  }

  if (thumbnails.length === 0) return null;

  return (
    <div className={styles.grid}>
      {thumbnails.map((url, i) => {
        const pageNum = i + 1;
        const selected = selectedPages?.has(pageNum);
        return (
          <button
            key={i}
            className={`${styles.cell} ${selected ? styles.selected : ''} ${onToggle ? styles.clickable : ''}`}
            onClick={() => onToggle?.(pageNum)}
            type="button"
          >
            <img src={url} alt={`ページ ${pageNum}`} className={styles.img} />
            <span className={styles.label}>{pageNum}</span>
          </button>
        );
      })}
    </div>
  );
}
