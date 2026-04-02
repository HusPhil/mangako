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
  Easing,
  scrollTo,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 0;
const DIRECTION_LOCK_THRESHOLD = 10;
const DIRECTION_LOCK_THRESHOLD_SQ =
  DIRECTION_LOCK_THRESHOLD * DIRECTION_LOCK_THRESHOLD;
const MAX_HORIZONTAL_ANGLE_DEG = 30;
const MAX_ANGLE_TAN = Math.tan(MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180));
const LIST_DRAG_OVERFLOW_THRESHOLD = 4;
const PAGE_FLIP_VELOCITY_THRESHOLD = 500;
const MAX_FLIP_ANGLE_TAN = Math.tan(MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180));

// Double-tap zoom constants
const DOUBLE_TAP_ZOOM_SCALE = 2.5;
const DOUBLE_TAP_MAX_DURATION = 300; // ms between taps to count as double-tap
const DOUBLE_TAP_MAX_DISTANCE = 40; // px max distance between the two taps
const DOUBLE_TAP_ZOOM_DURATION = 300; // ms for the zoom animation

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

  // Double-tap tracking state
  const lastTapTimestamp = useSharedValue(-1);
  const lastTapX = useSharedValue(0);
  const lastTapY = useSharedValue(0);

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
    lastTapTimestamp.value = -1;
    lastTapX.value = 0;
    lastTapY.value = 0;
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
      // Determine the final resting scale
      const finalScale =
        scale.value <= 1.1 ? 1 : scale.value >= 3.9 ? 4 : scale.value;

      // Compute max-translate bounds for the final scale
      const maxTX = Math.max(
        0,
        (displayedImageWidth.value * finalScale - SCREEN_WIDTH) / 2,
      );
      const maxTY = Math.max(
        0,
        (displayedImageHeight.value * finalScale -
          (SCREEN_HEIGHT + STATUS_BAR_HEIGHT * 2)) /
          2,
      );

      // Clamp current translation into the bounds valid for finalScale.
      // This prevents the image from sitting off-screen after a pinch release.
      const clampedTX = clamp(translateX.value, -maxTX, maxTX);
      const clampedTY = clamp(translateY.value, -maxTY, maxTY);

      if (finalScale === 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        cachedMaxTranslateX.value = 0;
        cachedMaxTranslateY.value = 0;
      } else {
        if (scale.value >= 3.9) scale.value = withSpring(4);
        savedScale.value = finalScale;

        // Animate back into bounds if translation overshot
        if (clampedTX !== translateX.value) {
          translateX.value = withSpring(clampedTX);
        }
        if (clampedTY !== translateY.value) {
          translateY.value = withSpring(clampedTY);
        }
        savedTranslateX.value = clampedTX;
        savedTranslateY.value = clampedTY;
        cachedMaxTranslateX.value = maxTX;
        cachedMaxTranslateY.value = maxTY;
      }
    });

  /**
   * Double-tap gesture for zoom-in / zoom-out.
   *
   * Algorithm for zoom-in to focal point:
   *   The image renders centered at (0,0) in its own coordinate space.
   *   The tap arrives as absolute screen coords (e.x, e.y), where
   *   (SCREEN_WIDTH/2, SCREEN_HEIGHT/2) is the screen center.
   *
   *   Focal offset from screen center (in screen-space):
   *     focalX = e.x - SCREEN_WIDTH / 2
   *     focalY = e.y - SCREEN_HEIGHT / 2
   *
   *   After zooming to `targetScale`, the image expands around its own
   *   center. To keep the tapped point visually anchored we need to shift
   *   the image by the inverse of how far the focal point would drift:
   *
   *     driftX = focalX * (targetScale - 1)
   *
   *   Since the image is currently offset by translateX, the new target
   *   translation must also account for the existing offset scaled up:
   *
   *     targetTX = translateX.value * (targetScale / scale.value) - focalX * (targetScale - 1)
   *
   *   Simplified for the zoom-in case (scale == 1, translateX == 0):
   *     targetTX = -focalX * (targetScale - 1)
   *
   *   This is then clamped to ±maxTranslate so we never pan past the image edges.
   */
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((e) => {
      "worklet";

      const now = Date.now();
      const timeDelta = now - lastTapTimestamp.value;
      const dx = e.x - lastTapX.value;
      const dy = e.y - lastTapY.value;
      const distanceSq = dx * dx + dy * dy;
      const isDoubleTap =
        timeDelta < DOUBLE_TAP_MAX_DURATION &&
        timeDelta > 0 &&
        distanceSq < DOUBLE_TAP_MAX_DISTANCE * DOUBLE_TAP_MAX_DISTANCE;

      if (isDoubleTap) {
        // Reset last tap so a third tap doesn't trigger another double-tap
        lastTapTimestamp.value = -1;

        const springConfig = {
          duration: DOUBLE_TAP_ZOOM_DURATION,
          easing: Easing.out(Easing.cubic),
        };

        if (scale.value > 1.05) {
          // ── Zoom out: snap back to identity ──────────────────────────────
          cancelAnimation(scale);
          cancelAnimation(translateX);
          cancelAnimation(translateY);

          scale.value = withTiming(1, springConfig);
          translateX.value = withTiming(0, springConfig);
          translateY.value = withTiming(0, springConfig);

          savedScale.value = 1;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          cachedMaxTranslateX.value = 0;
          cachedMaxTranslateY.value = 0;
        } else {
          // ── Zoom in: focus on the tapped point ───────────────────────────
          cancelAnimation(scale);
          cancelAnimation(translateX);
          cancelAnimation(translateY);

          const targetScale = DOUBLE_TAP_ZOOM_SCALE;

          // Focal offset relative to screen center (image's own origin)
          const focalX = e.x - SCREEN_WIDTH / 2;
          const focalY = e.y - SCREEN_HEIGHT / 2;

          // Compute max-translate bounds at target scale
          const imgW = displayedImageWidth.value;
          const imgH = displayedImageHeight.value;
          const maxTX = Math.max(0, (imgW * targetScale - SCREEN_WIDTH) / 2);
          const maxTY = Math.max(
            0,
            (imgH * targetScale - (SCREEN_HEIGHT + STATUS_BAR_HEIGHT * 2)) / 2,
          );

          // Translation needed to keep focal point visually stationary:
          //   The image currently has translate=(0,0) and scale=1.
          //   When we zoom to targetScale around the image center, a point
          //   at focalX from center would move to focalX * targetScale from center.
          //   We counter-shift by focalX * (targetScale - 1) to pin it.
          const rawTargetTX = -focalX * (targetScale - 1);
          const rawTargetTY = -focalY * (targetScale - 1);

          const targetTX = clamp(rawTargetTX, -maxTX, maxTX);
          const targetTY = clamp(rawTargetTY, -maxTY, maxTY);

          scale.value = withTiming(targetScale, springConfig);
          translateX.value = withTiming(targetTX, springConfig);
          translateY.value = withTiming(targetTY, springConfig);

          savedScale.value = targetScale;
          savedTranslateX.value = targetTX;
          savedTranslateY.value = targetTY;
          cachedMaxTranslateX.value = maxTX;
          cachedMaxTranslateY.value = maxTY;
        }
      } else {
        // Record this tap as the first tap of a potential double-tap
        lastTapTimestamp.value = now;
        lastTapX.value = e.x;
        lastTapY.value = e.y;
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
          (displayedImageHeight.value * scale.value -
            (SCREEN_HEIGHT + STATUS_BAR_HEIGHT * 2)) /
            2,
        );
        const expectedX = index * SCREEN_WIDTH;
        if (Math.abs(scrollX.value - expectedX) > 1) {
          scrollX.value = expectedX;
          scrollTo(listRef, expectedX, 0, false);
        }
      }
    })
    .onUpdate((e) => {
      if (scale.value <= 1) {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        return;
      }
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
          cancelAnimation(translateX);
          cancelAnimation(translateY);
          isPanningImage.value = false;
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
    <GestureDetector
      gesture={Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture)}
    >
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
