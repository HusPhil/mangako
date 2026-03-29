import MangaReaderPage from "@/components/manga-reader-screen-components/MangaReaderPage";
import { Colors } from "@/constants/colors";
import { useMangaReaderScreenLogic } from "@/hooks/manga-reader-screen-hooks/useMangaReaderScreenLogic";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, ViewToken } from "@shopify/flash-list";
import React, { useCallback, useRef } from "react";
import { ActivityIndicator, Dimensions, StatusBar, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ESTIMATED_PAGE_HEIGHT = SCREEN_WIDTH * 1.5;
const VISIBILITY_WINDOW = 3;

const MangaReaderScreen = () => {
  const { pages, isLoading } = useMangaReaderScreenLogic();

  // Map of index -> setter from each mounted cell
  const setVisibilityMapRef = useRef<Map<number, (v: boolean) => void>>(
    new Map(),
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MangaChapterPage>[] }) => {
      // Build the new visible set
      const newVisible = new Set<number>();
      viewableItems.forEach(({ index }) => {
        if (index == null) return;
        for (
          let i = index - VISIBILITY_WINDOW;
          i <= index + VISIBILITY_WINDOW;
          i++
        ) {
          if (i >= 0 && i < pages.length) newVisible.add(i);
        }
      });

      // Push changes directly to each mounted cell's setter — no polling needed
      setVisibilityMapRef.current.forEach((setter, index) => {
        setter(newVisible.has(index));
      });
    },
    [pages.length],
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

  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => (
      <MangaReaderPage
        item={item}
        index={index}
        registerVisibilitySetter={registerVisibilitySetter}
        unregisterVisibilitySetter={unregisterVisibilitySetter}
      />
    ),
    [registerVisibilitySetter, unregisterVisibilitySetter],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      <FlashList
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item) => item.pageId}
        maxItemsInRecyclePool={5}
        drawDistance={SCREEN_HEIGHT * 1.25}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 1 }}
      />
    </View>
  );
};

export default MangaReaderScreen;
