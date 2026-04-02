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
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HorizontalReader = ({ pages }: HorizontalReaderProps) => {
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
      console.log("adding ref");
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

  // 2. Define the animated ref. (Type asserted to 'any' to prevent TS conflicts between FlashList and Reanimated ScrollView types)
  const flashListRef = useAnimatedRef<FlashListRef<MangaChapterPage>>();

  // Initialize scrollX based on initialIndex if provided
  const scrollX = useSharedValue(SCREEN_WIDTH * 0);

  // --- OPTIMIZED SCROLL HANDLER ---
  // useAnimatedReaction(
  //   () => scrollX.value,
  //   (currentX, previousX) => {
  //     if (currentX !== previousX && !isScrollEnabled) {
  //       scrollTo(
  //         flashListRef,
  //         currentX,
  //         0,
  //         false, // animated: false is CRITICAL for synchronous feel
  //       );
  //     }
  //   },
  // );

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MangaChapterPage>[];
      changed: ViewToken<MangaChapterPage>[];
    }) => {
      const viewableItemsKeys = viewableItems.map((v) => v.key);
      console.log(pagesRef.current.size);

      // pagesRef.current.forEach((ref, pageId) => {
      //   if (!viewableItemsKeys.includes(pageId)) {
      //     ref?.reset();
      //   }
      // });
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
          style={{ transform: [{ scaleX: -1 }] }}
        >
          <ZoomableMangaReaderPage
            item={item}
            index={index}
            listRef={flashListRef}
            isReversed
            setPageRef={setPagesRef}
            removePageRef={removePageRef}
            isScrollEnabled={isScrollEnabled}
            disableScroll={disableScroll}
            enableScroll={enableScroll}
            scrollX={scrollX}
            totalPages={pages.length}
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
        drawDistance={SCREEN_WIDTH * 2}
        style={{ transform: [{ scaleX: -1 }] }}
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
