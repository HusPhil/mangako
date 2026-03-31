import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  AnimatedRef,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";
import ZoomableMangaReaderPage from "./ZoomableMangaReaderPage";

interface HorizontalReaderProps {
  pages: MangaChapterPage[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as <T>(
  props: FlashListProps<T> & { ref?: any },
) => React.ReactElement;

const HorizontalReader = ({ pages }: HorizontalReaderProps) => {
  const toggleIsSettingsVisible = useReaderSessionStore(
    (state) => state.toggleIsSettingsVisible,
  );
  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );

  // ── Shared value replaces useState — lives entirely on worklet thread ──
  const isZoomed = useSharedValue(false);

  // FlashList still needs a React prop for scrollEnabled.
  // We drive it from a plain ref so we never trigger a re-render.
  const scrollEnabledRef = React.useRef(true);
  const [, forceScrollUpdate] = React.useReducer((x) => x + 1, 0);

  const disableScroll = useCallback(() => {
    // Only re-render if the value actually changed
    if (scrollEnabledRef.current) {
      scrollEnabledRef.current = false;
      forceScrollUpdate();
    }
  }, []);

  const enableScroll = useCallback(() => {
    if (!scrollEnabledRef.current) {
      scrollEnabledRef.current = true;
      forceScrollUpdate();
    }
  }, []);

  const scrollRef = useAnimatedRef<any>();
  const scrollX = useSharedValue(0);

  useAnimatedReaction(
    () => scrollX.value,
    (currentX, previousX) => {
      if (currentX !== previousX) {
        scrollTo(
          scrollRef as AnimatedRef<Animated.ScrollView>,
          currentX,
          0,
          false,
        );
      }
    },
  );

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setCurrentPageIndex(index);
    },
    [setCurrentPageIndex],
  );

  // ── renderItem no longer depends on isScrollEnabled at all ──────────
  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => {
      return (
        <Pressable onLongPress={toggleIsSettingsVisible} delayLongPress={200}>
          <ZoomableMangaReaderPage
            item={item}
            index={index}
            isZoomed={isZoomed} // shared value, stable reference
            disableScroll={disableScroll}
            enableScroll={enableScroll}
            scrollX={scrollX}
            totalPages={pages.length}
          />
        </Pressable>
      );
    },
    // isZoomed, scrollX are shared values — stable refs, not in deps.
    // disableScroll/enableScroll are stable (no deps of their own).
    [toggleIsSettingsVisible, disableScroll, enableScroll, pages.length],
  );

  return (
    <View style={styles.container}>
      <AnimatedFlashList
        ref={scrollRef}
        data={pages}
        scrollEnabled={scrollEnabledRef.current}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.pageId || item.pageImageUrl}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        drawDistance={SCREEN_WIDTH * 2}
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
