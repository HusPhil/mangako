import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, FlashListRef, ViewToken } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useAnimatedRef, useSharedValue } from "react-native-reanimated";
import ZoomableMangaReaderPage from "./ZoomableMangaReaderPage";

interface HorizontalReaderProps {
  pages: MangaChapterPage[];
  initialIndex: number;
  throttledSave: (pageNumber: number) => void;
  onEndReached: () => void;
  isReversed: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HorizontalReader = ({
  pages,
  initialIndex,
  isReversed,
  throttledSave,
  onEndReached,
}: HorizontalReaderProps) => {
  const toggleIsSettingsVisible = useReaderSessionStore(
    (state) => state.toggleIsSettingsVisible,
  );
  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );

  // ─── Single shared animated values for zoom/pan ─────────────────────
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const flashListRef = useAnimatedRef<FlashListRef<MangaChapterPage>>();

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MangaChapterPage>[];
      changed: ViewToken<MangaChapterPage>[];
    }) => {
      if (viewableItems.length > 0) {
        const lastIndex = viewableItems[viewableItems.length - 1].index;
        if (lastIndex !== null) {
          // Reset zoom/pan when page changes
          scale.value = 1;
          translateX.value = 0;
          translateY.value = 0;

          setCurrentPageIndex(lastIndex);
          throttledSave(lastIndex);
        }
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => {
      return (
        <View
          className="overflow-hidden"
          style={{ transform: isReversed ? [{ scaleX: -1 }] : undefined }}
        >
          <ZoomableMangaReaderPage
            item={item}
            index={index}
            listRef={flashListRef}
            isReversed={isReversed}
            totalPages={pages.length}
            // zoom/pan shared values
            scale={scale}
            translateX={translateX}
            translateY={translateY}
          />
        </View>
      );
    },
    [isReversed, pages.length],
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.pageId || item.pageImageUrl}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        initialScrollIndex={initialIndex}
        onEndReached={onEndReached}
        drawDistance={SCREEN_WIDTH * 2}
        style={{ transform: isReversed ? [{ scaleX: -1 }] : undefined }}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HorizontalReader;
