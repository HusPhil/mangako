import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashListRef } from "@shopify/flash-list";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";

interface ZoomableMangaReaderPageProps {
  item: MangaChapterPage;
  index: number;
  listRef: React.RefObject<FlashListRef<MangaChapterPage>>;
  isReversed: boolean;
  totalPages: number;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const SNAPPY_SPRING = {
  stiffness: 200,
  damping: 25,
  mass: 0.5,
};

const ZoomableMangaReaderPage = ({
  item,
  scale,
  translateX,
  translateY,
}: ZoomableMangaReaderPageProps) => {
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isZooming = useSharedValue(false);

  // Focus point for zooming
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const stopAnimations = () => {
    "worklet";
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      if (isZooming.value) return;
      stopAnimations();
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Track focal point
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      if (isZooming.value) return;

      const nextScale = savedScale.value * e.scale;
      // Allow slight bounce-back feel by letting it go slightly below 1 during gesture
      scale.value = Math.min(MAX_SCALE * 1.5, Math.max(0.7, nextScale));

      // Adjust translation to zoom into focal point
      // (Simplified logic: offset = (1 - scale/prevScale) * (focal - center))
      translateX.value =
        savedTranslateX.value +
        (1 - e.scale) * (focalX.value - SCREEN_WIDTH / 2);
      translateY.value =
        savedTranslateY.value +
        (1 - e.scale) * (focalY.value - SCREEN_HEIGHT / 2);
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        isZooming.value = true;
        scale.value = withSpring(MIN_SCALE, SNAPPY_SPRING, (fin) => {
          if (fin) isZooming.value = false;
        });
        translateX.value = withSpring(0, SNAPPY_SPRING);
        translateY.value = withSpring(0, SNAPPY_SPRING);
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE, SNAPPY_SPRING);
      }
    });

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .manualActivation(true)
    .onTouchesMove((_e, m) => {
      if (scale.value > 1 && !isZooming.value) m.activate();
      else m.fail();
    })
    .onStart(() => {
      if (isZooming.value || scale.value <= 1.01) return;
      stopAnimations();
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (isZooming.value || scale.value <= 1.01) return;

      const maxTX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;

      // Add resistance at edges instead of hard stop (optional)
      // For now, keep it simple and clamp in onEnd for smooth feel
      translateY.value = Math.min(
        maxTY,
        Math.max(-maxTY, savedTranslateY.value + e.translationY),
      );
    })
    .onEnd((e) => {
      if (scale.value > 1.1 && !isZooming.value) {
        const maxX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        // --- Handle X Axis ---
        // If we are outside the boundaries, spring back.
        // Otherwise, use decay for momentum.
        if (translateX.value > maxX || translateX.value < -maxX) {
          translateX.value = withSpring(
            Math.min(maxX, Math.max(-maxX, translateX.value)),
            { velocity: e.velocityX },
          );
        } else {
          translateX.value = withDecay({
            velocity: e.velocityX,
            clamp: [-maxX, maxX],
          });
        }

        // --- Handle Y Axis ---
        if (translateY.value > maxY || translateY.value < -maxY) {
          translateY.value = withSpring(
            Math.min(maxY, Math.max(-maxY, translateY.value)),
            { velocity: e.velocityY },
          );
        } else {
          translateY.value = withDecay({
            velocity: e.velocityY,
            clamp: [-maxY, maxY],
          });
        }
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (isZooming.value) return;

      if (scale.value > 1.1) {
        isZooming.value = true;
        scale.value = withSpring(1, SNAPPY_SPRING, (fin) => {
          if (fin) isZooming.value = false;
        });
        translateX.value = withSpring(0, SNAPPY_SPRING);
        translateY.value = withSpring(0, SNAPPY_SPRING);
      } else {
        scale.value = withSpring(2.5, SNAPPY_SPRING);
        // Zoom toward the tap location
        const targetX = (SCREEN_WIDTH / 2 - e.x) * 1.5;
        const targetY = (SCREEN_HEIGHT / 2 - e.y) * 1.5;
        translateX.value = withSpring(targetX, SNAPPY_SPRING);
        translateY.value = withSpring(targetY, SNAPPY_SPRING);
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.page, animatedStyle]}>
        <Animated.Image
          source={{ uri: item.pageImageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden", // Ensures image doesn't bleed during large scales
  },
  image: {
    flex: 1,
  },
});

export default ZoomableMangaReaderPage;
