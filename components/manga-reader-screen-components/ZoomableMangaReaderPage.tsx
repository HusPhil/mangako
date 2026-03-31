import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    clamp,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withDecay,
    withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ZoomableMangaReaderPageProps {
  index: number;
  item: MangaChapterPage;
  isZoomed: SharedValue<boolean>; // ← was: isScrollEnabled: boolean
  scrollX: SharedValue<number>;
  totalPages: number;
  disableScroll: () => void;
  enableScroll: () => void;
}

const AXIS_LOCK_THRESHOLD = 8;

const ZoomableMangaReaderPage = ({
  item,
  isZoomed,
  disableScroll,
  enableScroll,
  index,
  scrollX,
  totalPages,
}: ZoomableMangaReaderPageProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const displayedImageWidth = useSharedValue(item.pageWidth);
  const displayedImageHeight = useSharedValue(item.pageHeight);

  const gestureLocked = useSharedValue<"none" | "x" | "y">("none");

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        isZoomed.value = false; // ← worklet-thread write, no bridge
        scheduleOnRN(enableScroll);
      } else {
        isZoomed.value = true; // ← worklet-thread write, no bridge
        scheduleOnRN(disableScroll);
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    // ── Always enabled at the gesture level. The worklet gates logic
    //    internally on isZoomed.value — avoids .enabled() re-creating
    //    the gesture on every scroll toggle. ──────────────────────────
    .enabled(true)
    .hitSlop({ left: -20 })
    .maxPointers(1)
    .onStart(() => {
      if (isZoomed.value) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        scrollX.value = index * SCREEN_WIDTH;
        gestureLocked.value = "none";
      }
    })
    .onUpdate((e) => {
      const direction = 1;

      if (isZoomed.value) {
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
        const isAtXBoundary = Math.abs(overflowX) > 1;

        if (gestureLocked.value === "none") {
          const absX = Math.abs(e.translationX);
          const absY = Math.abs(e.translationY);
          if (absX > AXIS_LOCK_THRESHOLD || absY > AXIS_LOCK_THRESHOLD) {
            if (isAtXBoundary && absY > absX) {
              gestureLocked.value = "y";
            } else if (absX >= absY) {
              gestureLocked.value = "x";
            } else {
              gestureLocked.value = "y";
            }
          }
        }

        if (gestureLocked.value === "y") {
          scrollX.value = index * SCREEN_WIDTH;
          translateX.value = clampedTranslateX;
          translateY.value = clamp(
            savedTranslateY.value + e.translationY,
            -maxTranslateY,
            maxTranslateY,
          );
        } else {
          translateX.value = clampedTranslateX;
          if (isAtXBoundary) {
            scrollX.value = index * SCREEN_WIDTH - direction * overflowX;
          } else {
            scrollX.value = index * SCREEN_WIDTH;
            translateY.value = clamp(
              savedTranslateY.value + e.translationY,
              -maxTranslateY,
              maxTranslateY,
            );
          }
        }
      } else {
        // Not zoomed — behave as a normal list swipe
        scrollX.value = index * SCREEN_WIDTH - direction * e.translationX;
      }
    })
    .onEnd((e) => {
      gestureLocked.value = "none";
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

      if (isZoomed.value && !isPageChange) {
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
        cancelAnimation(scrollX);
        scrollX.value = index * SCREEN_WIDTH;
      } else {
        const scrollVelocity = -direction * e.velocityX;
        let targetIndex = Math.round(scrollX.value / SCREEN_WIDTH);

        if (Math.abs(scrollVelocity) > 500) {
          targetIndex = scrollVelocity > 0 ? index + 1 : index - 1;
        }

        const clampedIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));
        scrollX.value = withSpring(clampedIndex * SCREEN_WIDTH, {
          overshootClamping: true,
        });
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
          source={{ uri: item.pageImageUrl }}
          style={{ width: SCREEN_WIDTH, height: item.pageHeight }}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
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
