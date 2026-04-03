import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
    AnimatedRef,
    cancelAnimation,
    clamp,
    Easing,
    scrollTo,
    SharedValue,
    withDecay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
    DIRECTION_LOCK_THRESHOLD_SQ,
    DOUBLE_TAP_MAX_DISTANCE,
    DOUBLE_TAP_MAX_DURATION,
    DOUBLE_TAP_ZOOM_DURATION,
    DOUBLE_TAP_ZOOM_SCALE,
    LIST_DRAG_OVERFLOW_THRESHOLD,
    MAX_ANGLE_TAN,
    MAX_FLIP_ANGLE_TAN,
    PAGE_FLIP_VELOCITY_THRESHOLD,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    SIDE_TAP_ZONE_WIDTH,
    STATUS_BAR_HEIGHT,
} from "../../constants/zoom-constants";
import { useZoomState } from "./useZoomState";

interface UseZoomGesturesOptions {
  index: number;
  totalPages: number;
  isReversed: boolean;
  listRef: AnimatedRef<FlashListRef<MangaChapterPage>>;
  scrollX: SharedValue<number>;
  onLongPress?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  zoomState: ReturnType<typeof useZoomState>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (worklets)
// ─────────────────────────────────────────────────────────────────────────────

function computeMaxTranslations(
  imgW: number,
  imgH: number,
  s: number,
): [number, number] {
  "worklet";
  const maxTX = Math.max(0, (imgW * s - SCREEN_WIDTH) / 2);
  const maxTY = Math.max(
    0,
    (imgH * s - (SCREEN_HEIGHT + STATUS_BAR_HEIGHT * 2)) / 2,
  );
  return [maxTX, maxTY];
}

const ZOOM_SPRING_CONFIG = { overshootClamping: true, duration: 300 };
const ZOOM_TIMING_CONFIG = {
  duration: DOUBLE_TAP_ZOOM_DURATION,
  easing: Easing.out(Easing.cubic),
};

// ─────────────────────────────────────────────────────────────────────────────
// Pinch gesture
// ─────────────────────────────────────────────────────────────────────────────

function buildPinchGesture(state: ReturnType<typeof useZoomState>) {
  const {
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    displayedImageWidth,
    displayedImageHeight,
    cachedMaxTranslateX,
    cachedMaxTranslateY,
  } = state;

  return Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 4);
    })
    .onEnd(() => {
      // Snap to hard limits at the edges
      const finalScale =
        scale.value <= 1.1 ? 1 : scale.value >= 3.9 ? 4 : scale.value;
      const [maxTX, maxTY] = computeMaxTranslations(
        displayedImageWidth.value,
        displayedImageHeight.value,
        finalScale,
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
        if (clampedTX !== translateX.value)
          translateX.value = withSpring(clampedTX);
        if (clampedTY !== translateY.value)
          translateY.value = withSpring(clampedTY);
        savedTranslateX.value = clampedTX;
        savedTranslateY.value = clampedTY;
        cachedMaxTranslateX.value = maxTX;
        cachedMaxTranslateY.value = maxTY;
      }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Double-tap zoom helpers (worklets called from tapGesture.onEnd)
// ─────────────────────────────────────────────────────────────────────────────

function zoomOut(state: ReturnType<typeof useZoomState>) {
  "worklet";
  const {
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    cachedMaxTranslateX,
    cachedMaxTranslateY,
  } = state;

  const shouldSnapInstant =
    Math.abs(translateX.value) > SCREEN_WIDTH ||
    Math.abs(translateY.value) > SCREEN_HEIGHT;

  scale.value = withTiming(1, ZOOM_TIMING_CONFIG);
  translateX.value = shouldSnapInstant ? 0 : withTiming(0, ZOOM_TIMING_CONFIG);
  translateY.value = shouldSnapInstant ? 0 : withTiming(0, ZOOM_TIMING_CONFIG);
  savedScale.value = 1;
  savedTranslateX.value = 0;
  savedTranslateY.value = 0;
  cachedMaxTranslateX.value = 0;
  cachedMaxTranslateY.value = 0;
}

function zoomInAtPoint(
  focalX: number,
  focalY: number,
  state: ReturnType<typeof useZoomState>,
) {
  "worklet";
  const {
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    cachedMaxTranslateX,
    cachedMaxTranslateY,
    displayedImageWidth,
    displayedImageHeight,
  } = state;

  cancelAnimation(scale);
  cancelAnimation(translateX);
  cancelAnimation(translateY);

  const targetScale = DOUBLE_TAP_ZOOM_SCALE;
  const [maxTX, maxTY] = computeMaxTranslations(
    displayedImageWidth.value,
    displayedImageHeight.value,
    targetScale,
  );
  const centeredFocalX = focalX - SCREEN_WIDTH / 2;
  const centeredFocalY = focalY - SCREEN_HEIGHT / 2;
  const targetTX = clamp(-centeredFocalX * (targetScale - 1), -maxTX, maxTX);
  const targetTY = clamp(-centeredFocalY * (targetScale - 1), -maxTY, maxTY);

  scale.value = withTiming(targetScale, ZOOM_TIMING_CONFIG);
  translateX.value = withTiming(targetTX, ZOOM_TIMING_CONFIG);
  translateY.value = withTiming(targetTY, ZOOM_TIMING_CONFIG);
  savedScale.value = targetScale;
  savedTranslateX.value = targetTX;
  savedTranslateY.value = targetTY;
  cachedMaxTranslateX.value = maxTX;
  cachedMaxTranslateY.value = maxTY;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tap gesture
// ─────────────────────────────────────────────────────────────────────────────

function buildTapGesture(
  index: number,
  totalPages: number,
  isReversed: boolean,
  listRef: AnimatedRef<FlashListRef<MangaChapterPage>>,
  scrollX: SharedValue<number>,
  onTapLeft: (() => void) | undefined,
  onTapRight: (() => void) | undefined,
  state: ReturnType<typeof useZoomState>,
) {
  const { scale, lastTapTimestamp, lastTapX, lastTapY, pendingSingleTapTimer } =
    state;

  const navigateTo = (targetIndex: number) => {
    "worklet";
    const clamped = clamp(targetIndex, 0, totalPages - 1);
    const targetX = clamped * SCREEN_WIDTH;
    scrollX.value = withSpring(targetX, ZOOM_SPRING_CONFIG);
    scrollTo(listRef, targetX, 0, true);
  };

  return Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((e) => {
      const now = Date.now();
      const dx = e.x - lastTapX.value;
      const dy = e.y - lastTapY.value;
      const timeDelta = now - lastTapTimestamp.value;
      const isDoubleTap =
        timeDelta > 0 &&
        timeDelta < DOUBLE_TAP_MAX_DURATION &&
        dx * dx + dy * dy < DOUBLE_TAP_MAX_DISTANCE * DOUBLE_TAP_MAX_DISTANCE;

      if (isDoubleTap) {
        // Cancel any pending single-tap — double-tap wins
        if (pendingSingleTapTimer.current !== null) {
          clearTimeout(pendingSingleTapTimer.current);
          pendingSingleTapTimer.current = null;
        }
        lastTapTimestamp.value = -1; // prevent triple-tap chaining

        if (scale.value > 1.05) {
          zoomOut(state);
        } else {
          zoomInAtPoint(e.x, e.y, state);
        }
      } else {
        // Record this tap in case the next tap makes it a double-tap
        lastTapTimestamp.value = now;
        lastTapX.value = e.x;
        lastTapY.value = e.y;

        // Only navigate when not zoomed in; panning covers that case
        if (scale.value > 1.05) return;

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
              navigateTo(isReversed ? capturedIndex + 1 : capturedIndex - 1);
            }
          } else if (tapX > SCREEN_WIDTH - SIDE_TAP_ZONE_WIDTH) {
            if (onTapRight) {
              onTapRight();
            } else {
              navigateTo(isReversed ? capturedIndex - 1 : capturedIndex + 1);
            }
          }
          // Centre zone: no-op (reserved for UI toggle)
        }, DOUBLE_TAP_MAX_DURATION);
      }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Long-press gesture
// ─────────────────────────────────────────────────────────────────────────────

function buildLongPressGesture(onLongPress?: () => void) {
  return Gesture.LongPress().onStart(() => {
    if (onLongPress) scheduleOnRN(onLongPress);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pan gesture
// ─────────────────────────────────────────────────────────────────────────────

function buildPanGesture(
  index: number,
  totalPages: number,
  isReversed: boolean,
  listRef: AnimatedRef<FlashListRef<MangaChapterPage>>,
  scrollX: SharedValue<number>,
  pinchGesture: ReturnType<typeof Gesture.Pinch>,
  state: ReturnType<typeof useZoomState>,
) {
  const {
    scale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    displayedImageWidth,
    displayedImageHeight,
    gestureIntent,
    isPanningImage,
    cachedMaxTranslateX,
    cachedMaxTranslateY,
  } = state;

  return Gesture.Pan()
    .averageTouches(true)
    .maxPointers(1)
    .blocksExternalGesture(pinchGesture)
    .onTouchesDown((_e, m) => {
      // Fail immediately when not zoomed — let the list handle it
      if (scale.value <= 1) m.fail();
    })
    .onStart(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      gestureIntent.value = 0;
      isPanningImage.value = false;
      const [maxTX, maxTY] = computeMaxTranslations(
        displayedImageWidth.value,
        displayedImageHeight.value,
        scale.value,
      );
      cachedMaxTranslateX.value = maxTX;
      cachedMaxTranslateY.value = maxTY;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        return;
      }

      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      // Direction lock — decide once, then stick
      if (gestureIntent.value === 0) {
        const travelSq = absX * absX + absY * absY;
        if (travelSq >= DIRECTION_LOCK_THRESHOLD_SQ) {
          gestureIntent.value =
            absX === 0 || absY / absX > MAX_ANGLE_TAN ? 1 : 2;
        }
      }

      const maxTX = cachedMaxTranslateX.value;
      const maxTY = cachedMaxTranslateY.value;
      const rawTX = savedTranslateX.value + e.translationX;
      const clampedTX = clamp(rawTX, -maxTX, maxTX);
      const overflowX = rawTX - clampedTX;

      const isHorizontal = gestureIntent.value === 2;
      const hasSignificantOverflow =
        isHorizontal && Math.abs(overflowX) > LIST_DRAG_OVERFLOW_THRESHOLD;

      if (hasSignificantOverflow) {
        // Hand off to list scroll — image reached its edge
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        isPanningImage.value = false;
        const mult = isReversed ? 1 : -1;
        const currentX = index * SCREEN_WIDTH + overflowX * mult;
        scrollX.value = currentX;
        scrollTo(listRef, currentX, 0, false);
        translateX.value = clampedTX;
      } else {
        // Pan the image within its bounds
        isPanningImage.value = true;
        translateX.value = clampedTX;
        translateY.value = clamp(
          savedTranslateY.value + e.translationY,
          -maxTY,
          maxTY,
        );
      }
    })
    .onEnd((e) => {
      isPanningImage.value = false;
      gestureIntent.value = 0;

      const maxTX = cachedMaxTranslateX.value;
      const maxTY = cachedMaxTranslateY.value;
      const scrollOffset = scrollX.value - index * SCREEN_WIDTH;
      const isPageChange =
        Math.abs(scrollOffset) > LIST_DRAG_OVERFLOW_THRESHOLD;
      const absVX = Math.abs(e.velocityX);
      const absVY = Math.abs(e.velocityY);
      const isFlipAngleValid =
        absVX !== 0 && absVY / absVX <= MAX_FLIP_ANGLE_TAN;

      if (!isPageChange || !isFlipAngleValid) {
        // No page change — decay within current page
        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [-maxTX, maxTX],
          rubberBandEffect: false,
        });
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-maxTY, maxTY],
          rubberBandEffect: false,
        });
        const snapX = index * SCREEN_WIDTH;
        scrollX.value = withSpring(snapX, ZOOM_SPRING_CONFIG);
        scrollTo(listRef, snapX, 0, true);
      } else {
        // Commit or snap to target page
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);

        let targetIndex = Math.round(scrollX.value / SCREEN_WIDTH);
        if (absVX > PAGE_FLIP_VELOCITY_THRESHOLD) {
          const isFlingNext = isReversed ? e.velocityX > 0 : e.velocityX < 0;
          targetIndex = isFlingNext ? index + 1 : index - 1;
        }
        const targetX = clamp(targetIndex, 0, totalPages - 1) * SCREEN_WIDTH;
        scrollX.value = withSpring(targetX, ZOOM_SPRING_CONFIG);
        scrollTo(listRef, targetX, 0, true);
      }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public hook
// ─────────────────────────────────────────────────────────────────────────────

export function useZoomGestures({
  index,
  totalPages,
  isReversed,
  listRef,
  scrollX,
  onLongPress,
  onTapLeft,
  onTapRight,
  zoomState,
}: UseZoomGesturesOptions) {
  // Memoize each gesture so they aren't recreated on every parent render.
  // Only rebuild when the values that are captured in worklet closures change.
  const pinchGesture = useMemo(
    () => buildPinchGesture(zoomState),
    // zoomState shared values are stable refs — only item identity matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const longPressGesture = useMemo(
    () => buildLongPressGesture(onLongPress),
    [onLongPress],
  );

  const tapGesture = useMemo(
    () =>
      buildTapGesture(
        index,
        totalPages,
        isReversed,
        listRef,
        scrollX,
        onTapLeft,
        onTapRight,
        zoomState,
      ),
    // index/totalPages/isReversed affect navigation targets directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, totalPages, isReversed, onTapLeft, onTapRight],
  );

  const panGesture = useMemo(
    () =>
      buildPanGesture(
        index,
        totalPages,
        isReversed,
        listRef,
        scrollX,
        pinchGesture,
        zoomState,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, totalPages, isReversed, pinchGesture],
  );

  return Gesture.Simultaneous(
    longPressGesture,
    tapGesture,
    pinchGesture,
    panGesture,
  );
}
