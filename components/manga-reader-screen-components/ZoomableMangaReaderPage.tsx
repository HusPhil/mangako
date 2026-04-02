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
const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 0;

const DIRECTION_LOCK_THRESHOLD = 10;
// ✅ FIX 1: Pre-square the threshold — eliminates Math.sqrt() every frame
const DIRECTION_LOCK_THRESHOLD_SQ =
  DIRECTION_LOCK_THRESHOLD * DIRECTION_LOCK_THRESHOLD;

const MAX_HORIZONTAL_ANGLE_DEG = 30;
// ✅ FIX 2: Pre-compute the tan of the angle — eliminates Math.atan2() every frame
// If absY / absX > tan(30°), the gesture is too vertical
const MAX_ANGLE_TAN = Math.tan(MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180)); // ~0.577

const LIST_DRAG_OVERFLOW_THRESHOLD = 4;
const PAGE_FLIP_VELOCITY_THRESHOLD = 500;

// ✅ FIX 3: Pre-compute the flip angle check the same way
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

  const gestureIntent = useSharedValue<0 | 1 | 2>(0);
  const isPanningImage = useSharedValue(false);

  // ✅ FIX 4: Cache maxTranslate per gesture — computed once in onStart,
  // reused every onUpdate frame instead of recalculating from scratch each time
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
      // ✅ FIX 5: Invalidate cache after pinch changes scale
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
        // ✅ FIX 6: cancelAnimation BEFORE snapshotting saved values,
        // so savedTranslate captures the true stopped position, not
        // a mid-animation value that's about to jump.
        cancelAnimation(translateX);
        cancelAnimation(translateY);

        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;

        gestureIntent.value = 0;
        isPanningImage.value = false;

        // ✅ FIX 7: Compute and cache maxTranslate once per gesture start.
        // scale.value is stable here (no onUpdate yet), so this is safe.
        cachedMaxTranslateX.value = Math.max(
          0,
          (displayedImageWidth.value * scale.value - SCREEN_WIDTH) / 2,
        );
        cachedMaxTranslateY.value = Math.max(
          0,
          (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
        );

        // ✅ FIX 8: Only snap the list if we're actually off-page.
        // Avoids a redundant scrollTo on every pan-start when zoomed in place.
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

      // ✅ FIX 1 applied: compare squared distance — no sqrt
      if (gestureIntent.value === 0) {
        const travelSq = absX * absX + absY * absY;
        if (travelSq >= DIRECTION_LOCK_THRESHOLD_SQ) {
          // ✅ FIX 2 applied: ratio check instead of atan2
          // absY / absX > tan(angle) means gesture is more vertical than the threshold
          // Guard absX === 0: pure vertical swipe → treat as image pan
          const isVertical = absX === 0 || absY / absX > MAX_ANGLE_TAN;
          gestureIntent.value = isVertical ? 1 : 2;
        }
      }

      // ✅ FIX 4 applied: read cached values — zero computation
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
          const currentX = index * SCREEN_WIDTH - overflowX;
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
        // Intent undecided — tentatively pan image
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

      // ✅ FIX 4 applied: reuse cached values in onEnd too
      const maxTranslateX = cachedMaxTranslateX.value;
      const maxTranslateY = cachedMaxTranslateY.value;

      const currentOffset = scrollX.value - index * SCREEN_WIDTH;
      const isPageChange =
        Math.abs(currentOffset) > LIST_DRAG_OVERFLOW_THRESHOLD;

      const absVX = Math.abs(e.velocityX);
      const absVY = Math.abs(e.velocityY);
      // ✅ FIX 3 applied: ratio check instead of atan2 for flip validation
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
          targetIndex = e.velocityX < 0 ? index + 1 : index - 1;
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
  },
});

export default ZoomableMangaReaderPage;
