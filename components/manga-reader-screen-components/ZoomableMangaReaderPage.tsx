import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
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

const DIRECTION_LOCK_THRESHOLD = 10;
const DIRECTION_LOCK_THRESHOLD_SQ =
  DIRECTION_LOCK_THRESHOLD * DIRECTION_LOCK_THRESHOLD;
const MAX_HORIZONTAL_ANGLE_DEG = 30;
const MAX_ANGLE_TAN = Math.tan(MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180));
const LIST_DRAG_OVERFLOW_THRESHOLD = 4;
const PAGE_FLIP_VELOCITY_THRESHOLD = 500;
const MAX_FLIP_ANGLE_TAN = Math.tan(MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180));

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
  isReversed: boolean;
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
  isReversed,
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
  const gestureIntent = useSharedValue<0 | 1 | 2>(0);
  const isPanningImage = useSharedValue(false);
  const cachedMaxTranslateX = useSharedValue(0);
  const cachedMaxTranslateY = useSharedValue(0);

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
    gestureIntent.value = 0;
    isPanningImage.value = false;
    cachedMaxTranslateX.value = 0;
    cachedMaxTranslateY.value = 0;
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
      scale.value = clamp(savedScale.value * e.scale, 1, 4);
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
        savedScale.value = scale.value >= 3.9 ? 4 : scale.value;
        if (scale.value >= 3.9) scale.value = withSpring(4);
      }
      cachedMaxTranslateX.value = -1;
      cachedMaxTranslateY.value = -1;
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
    .onStart(() => {
      if (scale.value > 1) {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        gestureIntent.value = 0;
        isPanningImage.value = false;

        cachedMaxTranslateX.value = Math.max(
          0,
          (displayedImageWidth.value * scale.value - SCREEN_WIDTH) / 2,
        );
        cachedMaxTranslateY.value = Math.max(
          0,
          (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
        );

        // Standard ScrollView offset for the current page
        const expectedX = index * SCREEN_WIDTH;
        if (Math.abs(scrollX.value - expectedX) > 1) {
          scrollX.value = expectedX;
          scrollTo(listRef, expectedX, 0, false);
        }
      }
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;

      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      if (gestureIntent.value === 0) {
        const travelSq = absX * absX + absY * absY;
        if (travelSq >= DIRECTION_LOCK_THRESHOLD_SQ) {
          const isVertical = absX === 0 || absY / absX > MAX_ANGLE_TAN;
          gestureIntent.value = isVertical ? 1 : 2;
        }
      }

      const maxTranslateX = cachedMaxTranslateX.value;
      const maxTranslateY = cachedMaxTranslateY.value;
      const rawTranslateX = savedTranslateX.value + e.translationX;
      const clampedTranslateX = clamp(
        rawTranslateX,
        -maxTranslateX,
        maxTranslateX,
      );
      const overflowX = rawTranslateX - clampedTranslateX;

      if (gestureIntent.value === 1) {
        isPanningImage.value = true;
        translateX.value = clampedTranslateX;
        translateY.value = clamp(
          savedTranslateY.value + e.translationY,
          -maxTranslateY,
          maxTranslateY,
        );
      } else if (gestureIntent.value === 2) {
        const hasSignificantOverflow =
          Math.abs(overflowX) > LIST_DRAG_OVERFLOW_THRESHOLD;

        if (hasSignificantOverflow) {
          isPanningImage.value = false;

          // ✅ FIX: In RTL, dragging right (positive overflow) should INCREASE offset to see the next page (index + 1)
          // In LTR, dragging right (positive overflow) should DECREASE offset to see the previous page (index - 1)
          const scrollDirectionMultiplier = isReversed ? 1 : -1;
          const currentX =
            index * SCREEN_WIDTH + overflowX * scrollDirectionMultiplier;

          scrollX.value = currentX;
          scrollTo(listRef, currentX, 0, false);
          translateX.value = clampedTranslateX;
        } else {
          isPanningImage.value = true;
          translateX.value = clampedTranslateX;
          translateY.value = clamp(
            savedTranslateY.value + e.translationY,
            -maxTranslateY,
            maxTranslateY,
          );
        }
      } else {
        isPanningImage.value = true;
        translateX.value = clampedTranslateX;
        translateY.value = clamp(
          savedTranslateY.value + e.translationY,
          -maxTranslateY,
          maxTranslateY,
        );
      }
    })
    .onEnd((e) => {
      isPanningImage.value = false;
      gestureIntent.value = 0;

      const maxTranslateX = cachedMaxTranslateX.value;
      const maxTranslateY = cachedMaxTranslateY.value;
      const currentOffset = scrollX.value - index * SCREEN_WIDTH;
      const isPageChange =
        Math.abs(currentOffset) > LIST_DRAG_OVERFLOW_THRESHOLD;
      const absVX = Math.abs(e.velocityX);
      const absVY = Math.abs(e.velocityY);
      const isFlipAngleValid =
        absVX === 0 ? false : absVY / absVX <= MAX_FLIP_ANGLE_TAN;

      if (!isPageChange || !isFlipAngleValid) {
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

        const snapX = index * SCREEN_WIDTH;
        scrollX.value = withSpring(snapX, {
          overshootClamping: true,
          duration: 300,
        });
        scrollTo(listRef, snapX, 0, true);
      } else {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);

        let targetIndex = Math.round(scrollX.value / SCREEN_WIDTH);

        if (Math.abs(e.velocityX) > PAGE_FLIP_VELOCITY_THRESHOLD) {
          // ✅ FIX: Determine "Next" based on direction.
          // LTR: Flinging Left (negative velocity) = Next Page (index + 1)
          // RTL: Flinging Right (positive velocity) = Next Page (index + 1)
          const isFlingNext = isReversed ? e.velocityX > 0 : e.velocityX < 0;
          targetIndex = isFlingNext ? index + 1 : index - 1;
        }

        const clampedIndex = clamp(targetIndex, 0, totalPages - 1);
        const targetX = clampedIndex * SCREEN_WIDTH;

        scrollX.value = withSpring(targetX, {
          overshootClamping: true,
          duration: 300,
        });
        scrollTo(listRef, targetX, 0, true);
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
          style={{ width: SCREEN_WIDTH, height: item.pageHeight }}
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
