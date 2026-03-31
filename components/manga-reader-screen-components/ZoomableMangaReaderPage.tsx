import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React, { useEffect } from "react";
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

const GAP_SIZE = 0;
const PAGE_WIDTH = SCREEN_WIDTH + GAP_SIZE;
const AXIS_LOCK_THRESHOLD = 8;

export interface ZoomablePageRef {
  reset: () => void;
  onInit: () => void;
  getCurrentScale: () => number;
}

interface ZoomableMangaReaderPageProps {
  index: number;
  isScrollEnabled: boolean;
  item: MangaChapterPage;
  isZoomed: SharedValue<boolean>;
  scrollX: SharedValue<number>;
  totalPages: number;
  setPageRef: (index: number, ref: ZoomablePageRef) => void;
  disableScroll: () => void;
  enableScroll: () => void;
}

const ZoomableMangaReaderPage = ({
  item,
  index,
  isScrollEnabled,
  scrollX,
  totalPages,
  setPageRef,
  disableScroll,
  enableScroll,
}: ZoomableMangaReaderPageProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const isZoomed = useSharedValue(false); // <-- Moved inside component for isolated state

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const displayedImageWidth = useSharedValue(item.pageWidth);
  const displayedImageHeight = useSharedValue(item.pageHeight);

  const gestureLocked = useSharedValue<"none" | "x" | "y">("none");

  const reset = () => {
    "worklet";
    scheduleOnRN(enableScroll); // <-- Ensure you use scheduleOnRN()()
    if (scale.value !== 1 || translateX.value !== 0 || translateY.value !== 0) {
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;

      isZoomed.value = false;
    }
  };

  const onInit = () => {
    "worklet";
  };

  const getCurrentScale = () => {
    "worklet";
    return scale.value;
  };

  useEffect(() => {
    setPageRef(index, { reset, onInit, getCurrentScale });
  }, [index, setPageRef]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        isZoomed.value = false;
        scheduleOnRN(enableScroll); // <-- Fix invocation
      } else {
        isZoomed.value = true;
        scheduleOnRN(disableScroll); // <-- Fix invocation
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .enabled(!isScrollEnabled)
    .hitSlop({ left: -20 })
    .maxPointers(1)
    .onStart(() => {
      console.log("pan is enabled:", !isScrollEnabled);
      if (isZoomed.value) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        scrollX.value = index * PAGE_WIDTH;
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
          scrollX.value = index * PAGE_WIDTH;
          translateX.value = clampedTranslateX;
          translateY.value = clamp(
            savedTranslateY.value + e.translationY,
            -maxTranslateY,
            maxTranslateY,
          );
        } else {
          translateX.value = clampedTranslateX;
          if (isAtXBoundary) {
            scrollX.value = index * PAGE_WIDTH - direction * overflowX;
          } else {
            scrollX.value = index * PAGE_WIDTH;
            translateY.value = clamp(
              savedTranslateY.value + e.translationY,
              -maxTranslateY,
              maxTranslateY,
            );
          }
        }
      } else {
        scrollX.value = index * PAGE_WIDTH - direction * e.translationX;
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

      const currentOffset = scrollX.value - index * PAGE_WIDTH;
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
        scrollX.value = index * PAGE_WIDTH;
      } else {
        const scrollVelocity = -direction * e.velocityX;
        let targetIndex = Math.round(scrollX.value / PAGE_WIDTH);

        if (Math.abs(scrollVelocity) > 500) {
          targetIndex = scrollVelocity > 0 ? index + 1 : index - 1;
        }

        const clampedIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));
        scrollX.value = withSpring(clampedIndex * PAGE_WIDTH, {
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
          recyclingKey={item.pageId}
          source={{ uri: item.pageImageUrl }}
          style={{ width: SCREEN_WIDTH, height: item.pageHeight }}
          contentFit="contain"
          cachePolicy="none"
          enforceEarlyResizing={true}
          transition={0}
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

ZoomableMangaReaderPage.displayName = "ZoomableMangaReaderPage";

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

export default React.memo(ZoomableMangaReaderPage);
