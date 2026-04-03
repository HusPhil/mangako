import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/constants/zoom-constants";
import { useZoomGestures } from "@/hooks/manga-reader-screen-hooks/useZoomGestures";
import { useZoomState } from "@/hooks/manga-reader-screen-hooks/useZoomState";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { AnimatedRef, SharedValue, useAnimatedStyle } from "react-native-reanimated";

export interface ZoomablePageRef {
  reset: () => void;
}

export interface ZoomableMangaReaderPageProps {
  index: number;
  item: MangaChapterPage;
  isScrollEnabled: boolean;
  listRef: AnimatedRef<FlashListRef<MangaChapterPage>>;
  scrollX: SharedValue<number>;
  totalPages: number;
  isReversed: boolean;
  setPageRef: (pageId: string, ref: ZoomablePageRef) => void;
  removePageRef: (pageId: string) => void;
  disableScroll: () => void;
  enableScroll: () => void;
  onLongPress?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
}
const ZoomableMangaReaderPage = memo(
  ({
    item,
    index,
    listRef,
    totalPages,
    scrollX,
    isReversed,
    setPageRef,
    removePageRef,
    onLongPress,
    onTapLeft,
    onTapRight,
  }: ZoomableMangaReaderPageProps) => {
    const zoomState = useZoomState({ item, setPageRef, removePageRef });

    const gesture = useZoomGestures({
      index,
      totalPages,
      isReversed,
      listRef,
      scrollX,
      onLongPress,
      onTapLeft,
      onTapRight,
      zoomState,
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: zoomState.translateX.value },
        { translateY: zoomState.translateY.value },
        { scale: zoomState.scale.value },
      ],
    }));

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.pageContainer, animatedStyle]}>
          <Image
            recyclingKey={item.pageId}
            source={{ uri: item.pageImageUrl }}
            style={{ width: SCREEN_WIDTH, height: item.pageHeight }}
            contentFit="contain"
            transition={0}
            cachePolicy="disk"
            onLoad={(e) => {
              const { width: w, height: h } = e.source;
              const ratio = Math.min(SCREEN_WIDTH / w, SCREEN_HEIGHT / h);
              zoomState.displayedImageWidth.value = w * ratio;
              zoomState.displayedImageHeight.value = h * ratio;
            }}
          />
        </Animated.View>
      </GestureDetector>
    );
  },
);

ZoomableMangaReaderPage.displayName = "ZoomableMangaReaderPage";

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    overflow: "hidden",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ZoomableMangaReaderPage;
