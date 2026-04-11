// ============================================================================
// 5. Memory & Prefetch Management

import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

const PREFETCH_CHUNK_SIZE = 3;

// ============================================================================
function useImageMemoryAndPrefetch(
  fetchedPages: MangaChapterPage[] | undefined,
  isFocusedRef: RefObject<boolean>,
) {
  const [activePages, setActivePages] = useState<MangaChapterPage[]>([]);
  const prefetchAbortRef = useRef(false);

  useEffect(() => {
    if (fetchedPages && fetchedPages.length > 0 && isFocusedRef.current) {
      setActivePages(fetchedPages);
    }
  }, [fetchedPages, isFocusedRef]);

  useEffect(() => {
    if (!fetchedPages || fetchedPages.length === 0 || !isFocusedRef.current)
      return;

    prefetchAbortRef.current = false;
    const allUrls = fetchedPages.map((p) => p.pageImageUrl);

    const run = async () => {
      for (let i = 0; i < allUrls.length; i += PREFETCH_CHUNK_SIZE) {
        if (prefetchAbortRef.current) break;
        const chunk = allUrls.slice(i, i + PREFETCH_CHUNK_SIZE);
        try {
          await Promise.all(chunk.map((url) => Image.prefetch(url, "disk")));
        } catch (err) {
          console.error("[Reader] Prefetch error:", err);
        }
      }
    };

    run();

    return () => {
      prefetchAbortRef.current = true;
    };
  }, [fetchedPages, isFocusedRef]);

  const clearActivePages = useCallback(() => setActivePages([]), []);
  const abortPrefetch = useCallback(() => {
    prefetchAbortRef.current = true;
  }, []);

  return { activePages, setActivePages, clearActivePages, abortPrefetch };
}

export default useImageMemoryAndPrefetch;
