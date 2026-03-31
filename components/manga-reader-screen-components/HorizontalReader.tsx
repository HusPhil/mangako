import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, FlashListProps, ViewToken } from "@shopify/flash-list";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  AnimatedRef,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";
import ZoomableMangaReaderPage, {
  ZoomablePageRef,
} from "./ZoomableMangaReaderPage";

interface HorizontalReaderProps {
  pages: MangaChapterPage[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GAP_SIZE = 0;
const PAGE_WIDTH = SCREEN_WIDTH + GAP_SIZE;

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as <T>(
  props: FlashListProps<MangaChapterPage> & { ref?: any },
) => React.ReactElement;

const HorizontalReader = ({ pages }: HorizontalReaderProps) => {
  const toggleIsSettingsVisible = useReaderSessionStore(
    (state) => state.toggleIsSettingsVisible,
  );

  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );

  const pageRefs = useRef<Map<string, ZoomablePageRef>>(new Map());

  const setPageRef = useCallback((pageId: string, val: ZoomablePageRef) => {
    // 2. Use .set() to add or update the ref
    pageRefs.current.set(pageId, val);
  }, []);

  const removePageRef = useCallback((pageId: string) => {
    // 3. Use .delete() to completely remove it from memory
    pageRefs.current.delete(pageId);
  }, []);

  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // ─── LEAK-FREE REF TRACKING ───────────────────────────────────────────
  // A Map allows us to safely add/remove refs as FlashList recycles nodes.

  const isZoomed = useSharedValue(false);
  const scrollEnabledRef = useRef(true);

  const disableScroll = useCallback(() => {
    console.log("disableScroll called");
    setIsScrollEnabled(false);
    if (scrollEnabledRef.current) {
      scrollEnabledRef.current = false;
    }
  }, []);

  const enableScroll = useCallback(() => {
    setIsScrollEnabled(true);
    if (!scrollEnabledRef.current) {
      scrollEnabledRef.current = true;
    }
  }, []);

  const scrollRef = useAnimatedRef<any>();
  const scrollX = useSharedValue(0);

  useAnimatedReaction(
    () => scrollX.value,
    (currentX, previousX) => {
      if (currentX !== previousX) {
        const currentPageIndex = Math.round(currentX / PAGE_WIDTH);
        scrollTo(
          scrollRef as AnimatedRef<Animated.ScrollView>,
          currentX,
          0,
          false,
        );
      }
    },
  );

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
      changed,
    }: {
      viewableItems: ViewToken<MangaChapterPage>[];
      changed: ViewToken<MangaChapterPage>[];
    }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const currentPageIndex = viewableItems[0].index;

        setCurrentPageIndex(currentPageIndex);

        let hasZoomedPage = false;

        const viewItemKeys = viewableItems.map((item) => item.key);

        pageRefs.current.forEach((ref, key) => {
          if (!ref) return;
          const currentScale = ref.getCurrentScale();

          if (!viewItemKeys.includes(key)) {
            ref.reset(currentPageIndex);
          }

          hasZoomedPage = hasZoomedPage || currentScale > 1;
        });
        if (!hasZoomedPage) {
          enableScroll();
        }
      }
    },
    [disableScroll],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => {
      return (
        <View>
          <ZoomableMangaReaderPage
            setPageRef={setPageRef}
            removePageRef={removePageRef}
            item={item}
            index={index}
            isZoomed={isZoomed}
            isScrollEnabled={isScrollEnabled}
            disableScroll={disableScroll}
            enableScroll={enableScroll}
            scrollX={scrollX}
            totalPages={pages.length}
          />
        </View>
      );
    },
    [disableScroll, enableScroll, pages.length, isZoomed, isScrollEnabled],
  );

  const renderSeparator = useCallback(
    () => <View style={{ width: GAP_SIZE }} />,
    [],
  );

  return (
    <View style={styles.container}>
      <AnimatedFlashList
        ref={scrollRef}
        data={pages}
        scrollEnabled={scrollEnabledRef.current}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.pageId}
        horizontal
        pagingEnabled
        drawDistance={PAGE_WIDTH * 2}
        // ItemSeparatorComponent={renderSeparator}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
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
