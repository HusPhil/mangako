import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, StatusBar, StyleSheet } from "react-native";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = StatusBar.currentHeight;

interface ZoomableMangaReaderPageProps {
  index: number;
  item: MangaChapterPage;
  isScrollEnabled: boolean;

  scrollX: SharedValue<number>;

  totalPages: number;

  disableScroll: () => void;
  enableScroll: () => void;
}

const ZoomableMangaReaderPage = ({
  item,
  isScrollEnabled,
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

  // Track displayed image dimensions for precise clamping
  const displayedImageWidth = useSharedValue(item.pageWidth);
  const displayedImageHeight = useSharedValue(item.pageHeight);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      if (scale.value <= 1.1) {
        // 1. Snap scale back to 1
        scale.value = withSpring(1);
        savedScale.value = 1;

        // 2. Snap position back to center (0, 0)
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value >= 3.9) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .manualActivation(true)
    .onTouchesMove((e, m) => {
      if (scale.value > 1) {
        m.activate();
      } else {
        m.fail();
      }
    })
    .hitSlop({ left: -20 })
    .maxPointers(1)
    .onStart(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        scrollX.value = index * SCREEN_WIDTH;
      }
    })
    .onUpdate((e) => {
      const direction = false ? -1 : 1;

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
          scrollX.value = index * SCREEN_WIDTH - direction * overflowX;
          translateX.value = clampedTranslateX;
        } else {
          // Panning Image
          scrollX.value = index * SCREEN_WIDTH;
          translateX.value = clampedTranslateX;
          translateY.value = clamp(
            savedTranslateY.value + e.translationY,
            -maxTranslateY,
            maxTranslateY,
          );
        }
      } else {
        // Not zoomed: Scroll list standard
        scrollX.value = index * SCREEN_WIDTH - direction * e.translationX;
      }
    })
    .onEnd((e) => {
      const direction = false ? -1 : 1;

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
        cancelAnimation(scrollX);
        scrollX.value = index * SCREEN_WIDTH;
      } else {
        // Page Change Logic
        const scrollVelocity = -direction * e.velocityX;
        let targetIndex = Math.round(scrollX.value / SCREEN_WIDTH);

        if (Math.abs(scrollVelocity) > 500) {
          targetIndex = scrollVelocity > 0 ? index + 1 : index - 1;
        }

        const clampedIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));

        // This is the ONLY place where we want list animation
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
          style={{
            width: SCREEN_WIDTH,
            height: item.pageHeight,
          }}
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
    backgroundColor: "#000", // Standard for readers
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
    borderColor: "white", // Optional: subtle border between pages
    // borderWidth: 1,
  },
});

export default ZoomableMangaReaderPage;
