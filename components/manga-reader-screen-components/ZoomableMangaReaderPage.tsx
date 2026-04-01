import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Dimensions, StatusBar, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  AnimatedRef,
  cancelAnimation,
  clamp,
  scrollTo,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = StatusBar.currentHeight;

export interface ZoomablePageRef {
  reset: () => void;
}

interface ZoomableMangaReaderPageProps {
  index: number;
  item: MangaChapterPage;
  isScrollEnabled: boolean;

  listRef: AnimatedRef<FlashListRef<MangaChapterPage>>;
  scrollX: SharedValue<number>;

  totalPages: number;

  setPageRef: (pageId: string, ref: ZoomablePageRef) => void;
  removePageRef: (pageId: string) => void;

  disableScroll: () => void;
  enableScroll: () => void;
}

const ZoomableMangaReaderPage = ({
  item,
  index,
  listRef,
  totalPages,
  scrollX,
  setPageRef,
  removePageRef,
}: ZoomableMangaReaderPageProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const displayedImageWidth = useSharedValue(item.pageWidth);
  const displayedImageHeight = useSharedValue(item.pageHeight);

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
  };

  useEffect(() => {
    setPageRef(item.pageId, { reset: resetValues });

    return () => {
      scheduleOnUI(resetValues);
      removePageRef(item.pageId);
    };
  }, [item.pageId]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      if (scale.value <= 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
        if (scale.value >= 3.9) {
          scale.value = withSpring(4);
          savedScale.value = 4;
        }
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(1)
    .manualActivation(true)
    .blocksExternalGesture(pinchGesture)
    .onTouchesMove((e, m) => {
      if (scale.value > 1) {
        m.activate();
      } else {
        m.fail();
      }
    })
    .hitSlop({ left: -20 })
    .onStart(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        const currentX = index * SCREEN_WIDTH;
        scrollX.value = currentX;
        scrollTo(listRef, currentX, 0, false);
      }
    })
    .onUpdate((e) => {
      // FIX 1: Removed console.log to prevent JS bridge flooding and lag
      const direction = 1;

      if (scale.value > 1) {
        const maxTranslateX = Math.max(
          0,
          (displayedImageWidth.value * scale.value - SCREEN_WIDTH) / 2,
        );
        const maxTranslateY = Math.max(
          0,
          (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
        );

        const rawTranslateX = savedTranslateX.value + e.translationX;
        const clampedTranslateX = clamp(
          rawTranslateX,
          -maxTranslateX,
          maxTranslateX,
        );
        const overflowX = rawTranslateX - clampedTranslateX;

        if (Math.abs(overflowX) > 1) {
          // Dragging List
          const currentX = index * SCREEN_WIDTH - direction * overflowX;
          scrollX.value = currentX;
          scrollTo(listRef, currentX, 0, false);
          translateX.value = clampedTranslateX;
        } else {
          // Panning Image
          translateX.value = clampedTranslateX;
          translateY.value = clamp(
            savedTranslateY.value + e.translationY,
            -maxTranslateY,
            maxTranslateY,
          );
          // FIX 2: Removed redundant scrollX updates and scrollTo calls here.
          // You do not need to lock the list scroll frame-by-frame if you are just panning the image.
        }
      }
    })
    .onEnd((e) => {
      const direction = 1;

      const maxTranslateX = Math.max(
        0,
        (displayedImageWidth.value * scale.value - SCREEN_WIDTH) / 2,
      );
      const maxTranslateY = Math.max(
        0,
        (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
      );

      const currentOffset = scrollX.value - index * SCREEN_WIDTH;
      const isPageChange = Math.abs(currentOffset) > 5;
      const isZoomed = scale.value > 1;

      if (isZoomed && !isPageChange) {
        // Momentum for Image
        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [-maxTranslateX, maxTranslateX],
          rubberBandEffect: false,
        });
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-maxTranslateY, maxTranslateY],
          rubberBandEffect: false,
        });

        // FIX 3: Removed redundant scrollTo to reset the list here.
      } else {
        // Page Change Logic
        const scrollVelocity = -direction * e.velocityX;
        let targetIndex = Math.round(scrollX.value / SCREEN_WIDTH);

        if (Math.abs(scrollVelocity) > 500) {
          targetIndex = scrollVelocity > 0 ? index + 1 : index - 1;
        }

        const clampedIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));

        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);
        cancelAnimation(savedScale);
        cancelAnimation(savedTranslateX);
        cancelAnimation(savedTranslateY);
        cancelAnimation(displayedImageWidth);
        cancelAnimation(displayedImageHeight);

        const targetX = clampedIndex * SCREEN_WIDTH;

        // FIX 4: Fixed invalid withSpring argument passed into scrollTo.
        scrollX.value = withSpring(targetX, {
          overshootClamping: true,
          duration: 300,
        });

        scrollTo(
          listRef,
          targetX,
          0,
          true, // Let the native thread handle the layout animation smoothly
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinchGesture, panGesture)}>
      <Animated.View style={[styles.pageContainer, animatedStyle]}>
        <Image
          recyclingKey={item.pageId}
          source={{ uri: item.pageImageUrl }}
          style={{
            width: SCREEN_WIDTH,
            height: item.pageHeight,
          }}
          contentFit="contain"
          transition={0}
          cachePolicy="disk"
          onLoad={(e) => {
            const { width: w, height: h } = e.source;
            const ratio = Math.min(SCREEN_WIDTH / w, SCREEN_HEIGHT / h);
            displayedImageWidth.value = w * ratio;
            displayedImageHeight.value = h * ratio;
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  pageContainer: {
    flex: 1,
    overflow: "hidden",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
  },
});

export default ZoomableMangaReaderPage;
