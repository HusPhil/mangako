import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
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
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

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

// Left/right tap zone: how wide each side tap zone is (in pixels)
const SIDE_TAP_ZONE_WIDTH = SCREEN_WIDTH / 3;

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
  /** Called when the user long-presses anywhere on the page. Runs on the RN thread. */
  onLongPress?: () => void;
  /** Called when the user single-taps the left third of the page. Runs on the RN thread. */
  onTapLeft?: () => void;
  /** Called when the user single-taps the right third of the page. Runs on the RN thread. */
  onTapRight?: () => void;
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
  onLongPress,
  onTapLeft,
  onTapRight,
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

  // Pending single-tap timer — cancelled if a second tap arrives in time (double-tap)
  const pendingSingleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
      if (pendingSingleTapTimer.current !== null) {
        clearTimeout(pendingSingleTapTimer.current);
        pendingSingleTapTimer.current = null;
      }
      scheduleOnUI(resetValues);
      removePageRef(item.pageId);
    };
  }, [item.pageId]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 4);
    })
    .onEnd(() => {
      const finalScale =
        scale.value <= 1.1 ? 1 : scale.value >= 3.9 ? 4 : scale.value;

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
   * Combined tap gesture handling double-tap zoom AND single-tap left/right navigation.
   *
   * We use manual double-tap detection (timestamp + distance check) rather than
   * numberOfTaps(2) so that double-taps anywhere on the screen — including the
   * left/right nav zones — are always captured by zoom logic first.
   *
   * On a confirmed single-tap we inspect e.x to decide which zone was tapped:
   *   - left third  → onTapLeft()
   *   - right third → onTapRight()
   *   - centre      → no-op (reserved for future use, e.g. toggle UI)
   *
   * Callbacks are dispatched to the RN thread via scheduleOnRN so callers don't
   * need to worry about threading — they receive a plain JS function call.
   */
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((e) => {
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
        // Cancel any pending single-tap nav — this is a double-tap
        if (pendingSingleTapTimer.current !== null) {
          clearTimeout(pendingSingleTapTimer.current);
          pendingSingleTapTimer.current = null;
        }

        // Reset so a third tap doesn't chain into another double-tap
        lastTapTimestamp.value = -1;

        const springConfig = {
          duration: DOUBLE_TAP_ZOOM_DURATION,
          easing: Easing.out(Easing.cubic),
        };

        if (scale.value > 1.05) {
          // Snap translate to 0 first if wildly off, otherwise animate
          const shouldSnapInstant =
            Math.abs(translateX.value) > SCREEN_WIDTH ||
            Math.abs(translateY.value) > SCREEN_HEIGHT;

          scale.value = withTiming(1, springConfig);

          if (shouldSnapInstant) {
            translateX.value = 0;
            translateY.value = 0;
          } else {
            translateX.value = withTiming(0, springConfig);
            translateY.value = withTiming(0, springConfig);
          }

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

          const focalX = e.x - SCREEN_WIDTH / 2;
          const focalY = e.y - SCREEN_HEIGHT / 2;

          const imgW = displayedImageWidth.value;
          const imgH = displayedImageHeight.value;
          const maxTX = Math.max(0, (imgW * targetScale - SCREEN_WIDTH) / 2);
          const maxTY = Math.max(
            0,
            (imgH * targetScale - (SCREEN_HEIGHT + STATUS_BAR_HEIGHT * 2)) / 2,
          );

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
        // ── Single tap: record for potential double-tap, then schedule nav ──
        lastTapTimestamp.value = now;
        lastTapX.value = e.x;
        lastTapY.value = e.y;

        // Only trigger navigation when not zoomed in (panning takes over there).
        // We defer by DOUBLE_TAP_MAX_DURATION so an incoming second tap (double-tap)
        // gets a chance to cancel this before it fires.
        if (scale.value <= 1.05) {
          const tapX = e.x;
          const capturedIndex = index;

          if (pendingSingleTapTimer.current !== null) {
            clearTimeout(pendingSingleTapTimer.current);
          }

          pendingSingleTapTimer.current = setTimeout(() => {
            pendingSingleTapTimer.current = null;

            if (tapX < SIDE_TAP_ZONE_WIDTH) {
              if (onTapLeft) {
                onTapLeft();
              } else {
                // Default: previous page (accounts for RTL manga via isReversed)
                const targetIndex = clamp(
                  isReversed ? capturedIndex + 1 : capturedIndex - 1,
                  0,
                  totalPages - 1,
                );
                const targetX = targetIndex * SCREEN_WIDTH;
                scrollX.value = withSpring(targetX, {
                  overshootClamping: true,
                  duration: 300,
                });
                scrollTo(listRef, targetX, 0, true);
              }
            } else if (tapX > SCREEN_WIDTH - SIDE_TAP_ZONE_WIDTH) {
              if (onTapRight) {
                onTapRight();
              } else {
                // Default: next page (accounts for RTL manga via isReversed)
                const targetIndex = clamp(
                  isReversed ? capturedIndex - 1 : capturedIndex + 1,
                  0,
                  totalPages - 1,
                );
                const targetX = targetIndex * SCREEN_WIDTH;
                scrollX.value = withSpring(targetX, {
                  overshootClamping: true,
                  duration: 300,
                });
                scrollTo(listRef, targetX, 0, true);
              }
            }
          }, DOUBLE_TAP_MAX_DURATION);
        }
      }
    });

  /**
   * Long-press gesture.
   *
   * Activates after the default 500 ms hold. The callback is dispatched to the
   * RN thread via scheduleOnRN — no runOnJS / worklet annotation needed on the
   * caller's side.
   */
  const longPressGesture = Gesture.LongPress().onStart(() => {
    if (onLongPress) scheduleOnRN(onLongPress);
  });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(1)
    .blocksExternalGesture(pinchGesture)
    .onTouchesDown((e, m) => {
      if (scale.value <= 1) {
        m.fail();
      }
    })
    .onStart(() => {
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
      gesture={Gesture.Simultaneous(
        longPressGesture,
        tapGesture,
        pinchGesture,
        panGesture,
      )}
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
