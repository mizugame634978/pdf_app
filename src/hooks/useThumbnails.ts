import { useState, useEffect, useRef } from 'react';
import { renderFirstPage, renderAllPages } from '../lib/preview';
import type { PdfFile } from '../types';

// ファイルリスト全体のサムネイルを一括管理するフック（マージ用）
export function useFirstPageThumbnailMap(files: PdfFile[]): Map<string, string> {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const fileIds = files.map((f) => f.id).join(',');

  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const pdfFile of files) {
        if (cancelled) break;
        // すでに生成済みならスキップ
        setThumbnails((prev) => {
          if (prev.has(pdfFile.id)) return prev;
          return prev; // まだない場合は次の処理へ
        });
        // 状態を直接参照できないため、別途チェック用 Ref を使わず
        // setThumbnails の関数形式で冪等に書き込む
        try {
          const buffer = await pdfFile.file.arrayBuffer();
          const url = await renderFirstPage(buffer);
          if (!cancelled) {
            setThumbnails((prev) => {
              if (prev.has(pdfFile.id)) return prev;
              const next = new Map(prev);
              next.set(pdfFile.id, url);
              return next;
            });
          }
        } catch (e) {
          console.error('[useThumbnails] first page:', e);
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileIds]);

  return thumbnails;
}

export function useAllPageThumbnails(file: File | null): {
  thumbnails: string[];
  pageCount: number;
  loading: boolean;
} {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setPageCount(0);
      return;
    }
    // 同じファイルの再実行（Strict Mode）はスキップ
    if (fileRef.current === file && thumbnails.length > 0) return;
    fileRef.current = file;

    let cancelled = false;
    setLoading(true);
    setThumbnails([]);
    file.arrayBuffer()
      .then((buf) => renderAllPages(buf))
      .then(({ urls, pageCount: count }) => {
        if (!cancelled) {
          setThumbnails(urls);
          setPageCount(count);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('[useThumbnails] all pages:', e);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return { thumbnails, pageCount, loading };
}
