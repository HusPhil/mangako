import { ZoomablePageRef } from "@/components/manga-reader-screen-components/ZoomableMangaReaderPage";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { useEffect, useRef } from "react";
import { cancelAnimation, useSharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

interface UseZoomStateOptions {
  item: MangaChapterPage;
  setPageRef: (pageId: string, ref: ZoomablePageRef) => void;
  removePageRef: (pageId: string) => void;
}

export function useZoomState({
  item,
  setPageRef,
  removePageRef,
}: UseZoomStateOptions) {
  // ── Transform state ──────────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ── Image dimensions (updated after load) ───────────────────────────────
  const displayedImageWidth = useSharedValue(item.pageWidth);
  const displayedImageHeight = useSharedValue(item.pageHeight);

  // ── Gesture coordination ─────────────────────────────────────────────────
  // 0 = undecided, 1 = vertical pan, 2 = horizontal pan
  const gestureIntent = useSharedValue<0 | 1 | 2>(0);
  const isPanningImage = useSharedValue(false);
  const cachedMaxTranslateX = useSharedValue(0);
  const cachedMaxTranslateY = useSharedValue(0);

  // ── Double-tap tracking ──────────────────────────────────────────────────
  const lastTapTimestamp = useSharedValue(-1);
  const lastTapX = useSharedValue(0);
  const lastTapY = useSharedValue(0);

  // ── Pending single-tap timer ref (JS thread) ─────────────────────────────
  const pendingSingleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ── Reset (worklet — safe to call from UI thread) ────────────────────────
  const resetValues = () => {
    "worklet";
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(scale);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    gestureIntent.value = 0;
    isPanningImage.value = false;
    cachedMaxTranslateX.value = 0;
    cachedMaxTranslateY.value = 0;
    lastTapTimestamp.value = -1;
    lastTapX.value = 0;
    lastTapY.value = 0;
  };

  // ── Registration ─────────────────────────────────────────────────────────
  useEffect(() => {
    setPageRef(item.pageId, { reset: resetValues });
    return () => {
      if (pendingSingleTapTimer.current !== null) {
        clearTimeout(pendingSingleTapTimer.current);
        pendingSingleTapTimer.current = null;
      }
      scheduleOnUI(resetValues);
      removePageRef(item.pageId);
    };
    // item.pageId is the only value that would force a re-register
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.pageId]);

  return {
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    displayedImageWidth,
    displayedImageHeight,
    gestureIntent,
    isPanningImage,
    cachedMaxTranslateX,
    cachedMaxTranslateY,
    lastTapTimestamp,
    lastTapX,
    lastTapY,
    pendingSingleTapTimer,
    resetValues,
  };
}
