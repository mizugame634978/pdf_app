import { useState, useEffect } from 'react';
import { renderFirstPage, renderAllPages } from '../lib/preview';

export function useFirstPageThumbnail(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    file.arrayBuffer()
      .then((buf) => renderFirstPage(buf))
      .then((dataUrl) => { if (!cancelled) setUrl(dataUrl); })
      .catch(() => { /* 表示できない場合は何もしない */ });
    return () => { cancelled = true; };
  }, [file]);

  return url;
}

export function useAllPageThumbnails(file: File | null): {
  thumbnails: string[];
  pageCount: number;
  loading: boolean;
} {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setPageCount(0);
      return;
    }
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
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file]);

  return { thumbnails, pageCount, loading };
}
