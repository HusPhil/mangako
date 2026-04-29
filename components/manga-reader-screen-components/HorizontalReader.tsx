import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, FlashListRef, ViewToken } from "@shopify/flash-list";
import React, { useCallback, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  cancelAnimation,
  useAnimatedRef,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ZoomableMangaReaderPage from "./ZoomableMangaReaderPage";

interface HorizontalReaderProps {
  pages: MangaChapterPage[];
  initialIndex: number;
  throttledSave: (pageNumber: number) => void;
  onEndReached: () => void;
  isReversed: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HorizontalReader = ({
  pages,
  initialIndex,
  isReversed,
  throttledSave,
  onEndReached,
}: HorizontalReaderProps) => {
  const toggleIsSettingsVisible =
    useReaderSessionStore.getState().toggleIsSettingsVisible;
  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );
  const currentPageIndex = useReaderSessionStore(
    (state) => state.currentPageIndex,
  );

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const flashListRef = useAnimatedRef<FlashListRef<MangaChapterPage>>();

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MangaChapterPage>[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        if (newIndex !== null && newIndex !== currentPageIndex) {
          // ─── Animated Reset ───────────────────────────────────────
          // We use withTiming to smoothly transition back to defaults
          const config = { duration: 250 }; // Adjust speed as needed

          cancelAnimation(translateX);
          cancelAnimation(translateY);
          cancelAnimation(scale);

          scale.value = withTiming(1, config);
          translateX.value = withTiming(0, config);
          translateY.value = withTiming(0, config);

          setCurrentPageIndex(newIndex);
          throttledSave(newIndex);
        }
      }
    },
    [
      currentPageIndex,
      setCurrentPageIndex,
      throttledSave,
      scale,
      translateX,
      translateY,
    ],
  );

  /**
   * NAVIGATION LOGIC
   * In Manga:
   * Normal (LTR): Next = Index + 1
   * Reversed (RTL): Next = Index + 1 (Visually moves left because of scaleX -1)
   * * Since we use scaleX: -1 on the List, the internal index 0 is on the far right.
   * Increasing the index/offset always moves "forward" in the data array.
   */
  const scrollToNextPage = useCallback(() => {
    if (flashListRef.current && currentPageIndex < pages.length - 1) {
      flashListRef.current.scrollToOffset({
        offset:
          (isReversed ? currentPageIndex - 1 : currentPageIndex + 1) *
          SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [isReversed, currentPageIndex, pages.length]);

  const scrollToPreviousPage = useCallback(() => {
    if (flashListRef.current && currentPageIndex > 0) {
      flashListRef.current.scrollToOffset({
        offset:
          (isReversed ? currentPageIndex + 1 : currentPageIndex - 1) *
          SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [isReversed, currentPageIndex]);

  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => {
      return (
        <View
          style={[
            { width: SCREEN_WIDTH },
            // Flip the item back so content isn't mirrored
            isReversed ? { transform: [{ scaleX: -1 }] } : undefined,
          ]}
          className="overflow-hidden"
        >
          <ZoomableMangaReaderPage
            item={item}
            listRef={flashListRef}
            isReversed={isReversed}
            totalPages={pages.length}
            scale={scale}
            translateX={translateX}
            translateY={translateY}
            // Pass navigation to the child (for tap zones)
            scrollToNextPage={scrollToNextPage}
            scrollToPreviousPage={scrollToPreviousPage}
            onLongPress={toggleIsSettingsVisible}
          />
        </View>
      );
    },
    [
      isReversed,
      pages.length,
      scrollToNextPage,
      scrollToPreviousPage,
      scale,
      translateX,
      translateY,
    ],
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.pageId?.toString() || index.toString()
        }
        horizontal
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsHorizontalScrollIndicator={false}
        // Flip the entire list for RTL reading
        style={isReversed ? { transform: [{ scaleX: -1 }] } : undefined}
        bounces={false}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});

export default HorizontalReader;
