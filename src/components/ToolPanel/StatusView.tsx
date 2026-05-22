import type { AppState } from '../../types';
import styles from './StatusView.module.css';

interface Props {
  state: AppState;
  error: string | null;
  onReset: () => void;
}

export function StatusView({ state, error, onReset }: Props) {
  if (state === 'processing') {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>処理中...</p>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className={styles.center}>
        <p className={styles.success}>ダウンロードが開始されました</p>
        <button className={styles.btn} onClick={onReset}>
          別のファイルを処理する
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.center}>
        <p className={styles.error}>{error}</p>
        <button className={styles.btn} onClick={onReset}>
          やり直す
        </button>
      </div>
    );
  }

  return null;
}
