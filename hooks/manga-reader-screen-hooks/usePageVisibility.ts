// ============================================================================
// 3. Page Visibility Tracking

import { MangaChapterPage } from "@/types/ResponseTypes";
import { useCallback, useRef } from "react";
import { ViewToken } from "react-native";

const VISIBILITY_WINDOW = 3;

// ============================================================================
function usePageVisibility(
  activePagesCount: number,
  setCurrentPageIndex: (index: number) => void,
  throttledSave: (index: number) => void,
) {
  const setVisibilityMapRef = useRef<Map<number, (v: boolean) => void>>(
    new Map(),
  );

  const registerVisibilitySetter = useCallback(
    (index: number, setter: (v: boolean) => void) => {
      setVisibilityMapRef.current.set(index, setter);
    },
    [],
  );

  const unregisterVisibilitySetter = useCallback((index: number) => {
    setVisibilityMapRef.current.delete(index);
  }, []);

  const clearVisibilityMap = useCallback(() => {
    setVisibilityMapRef.current.clear();
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MangaChapterPage>[] }) => {
      const newVisible = new Set<number>();

      viewableItems.forEach(({ index }) => {
        if (index == null) return;
        for (
          let i = index - VISIBILITY_WINDOW;
          i <= index + VISIBILITY_WINDOW;
          i++
        ) {
          if (i >= 0 && i < activePagesCount) newVisible.add(i);
        }
      });

      setVisibilityMapRef.current.forEach((setter, index) => {
        setter(newVisible.has(index));
      });

      if (viewableItems.length > 0) {
        const lastVisibleItem = viewableItems[viewableItems.length - 1];

        if (
          lastVisibleItem.index != null &&
          lastVisibleItem.index === activePagesCount - 1
        ) {
          setCurrentPageIndex(lastVisibleItem.index);
          throttledSave(lastVisibleItem.index);
        } else if (viewableItems[0]?.index != null) {
          setCurrentPageIndex(viewableItems[0].index);
          throttledSave(viewableItems[0].index);
        }
      }
    },
    [activePagesCount, setCurrentPageIndex, throttledSave],
  );

  return {
    registerVisibilitySetter,
    unregisterVisibilitySetter,
    clearVisibilityMap,
    onViewableItemsChanged,
  };
}

export default usePageVisibility;
