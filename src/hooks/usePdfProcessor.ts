import { useState, useCallback } from 'react';
import type { AppState } from '../types';

export function usePdfProcessor<T>(
  processor: () => Promise<T>,
  onSuccess: (result: T) => void
) {
  const [state, setState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setState('processing');
    setError(null);
    try {
      const result = await processor();
      setState('done');
      onSuccess(result);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '処理中にエラーが発生しました';
      setError(
        msg.includes('password') || msg.includes('encrypt')
          ? 'パスワード付きPDFは対応していません'
          : msg.includes('Invalid') || msg.includes('corrupt')
          ? '破損したPDF、または対応していない形式です'
          : msg
      );
      setState('error');
    }
  }, [processor, onSuccess]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return { state, error, run, reset };
}
