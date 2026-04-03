import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, FlashListRef, ViewToken } from "@shopify/flash-list";
import React, { useCallback, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  cancelAnimation,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";
import ZoomableMangaReaderPage, {
  ZoomablePageRef,
} from "./ZoomableMangaReaderPage";

interface HorizontalReaderProps {
  pages: MangaChapterPage[];
  isReversed: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HorizontalReader = ({ pages, isReversed }: HorizontalReaderProps) => {
  // ─── Store Actions & State ──────────────────────────────────────────
  const toggleIsSettingsVisible = useReaderSessionStore(
    (state) => state.toggleIsSettingsVisible,
  );
  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );

  const pagesRef = useRef<Map<string, ZoomablePageRef>>(new Map());

  const setPagesRef = useCallback(
    (pageId: string, ref: ZoomablePageRef) => {
      if (pagesRef.current) {
        pagesRef.current.set(pageId, ref);
      }
    },
    [pagesRef],
  );

  const removePageRef = useCallback(
    (pageId: string) => {
      if (pagesRef.current) {
        pagesRef.current.delete(pageId);
      }
    },
    [pagesRef],
  );

  const [isScrollEnabled, setIsScrollEnabled] = React.useState(true);

  const disableScroll = useCallback(() => setIsScrollEnabled(false), []);
  const enableScroll = useCallback(() => setIsScrollEnabled(true), []);

  const flashListRef = useAnimatedRef<FlashListRef<MangaChapterPage>>();
  const scrollX = useSharedValue(SCREEN_WIDTH * 0);

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MangaChapterPage>[];
      changed: ViewToken<MangaChapterPage>[];
    }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentPageIndex(viewableItems[0].index);
      }
    },
    [pagesRef],
  );

  // ─── Sync Store with Scroll Position ────────────────────────────────
  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setCurrentPageIndex(index);
    },
    [setCurrentPageIndex],
  );

  const handleOnScrollBeginDrag = () => {
    cancelAnimation(scrollX);
    enableScroll();
  };

  // ─── Render Item ────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => {
      // Manga pages vary in aspect ratio.
      // We wrap the image in a SCREEN_WIDTH container to ensure one page per swipe.
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
            setPageRef={setPagesRef}
            removePageRef={removePageRef}
            isScrollEnabled={isScrollEnabled}
            disableScroll={disableScroll}
            enableScroll={enableScroll}
            scrollX={scrollX}
            totalPages={pages.length}
            onLongPress={toggleIsSettingsVisible}
          />
        </View>
      );
    },
    [
      toggleIsSettingsVisible,
      disableScroll,
      enableScroll,
      isScrollEnabled,
      scrollX,
      pages.length,
    ],
  );

  return (
    <View style={styles.container}>
      {/* 3. Use AnimatedFlashList and attach the scrollRef */}
      <FlashList
        ref={flashListRef}
        data={pages}
        scrollEnabled={isScrollEnabled}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.pageId || item.pageImageUrl}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        // onScrollBeginDrag={handleOnScrollBeginDrag}
        // onMomentumScrollEnd={handleScroll}
        onScrollBeginDrag={(e) => console.log(e.nativeEvent)}
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
    backgroundColor: "#000", // Standard for readers
    alignItems: "center",
    justifyContent: "center",
  },
  pageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white", // Optional: subtle border between pages
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default HorizontalReader;
