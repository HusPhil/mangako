import { MangaChapterPage } from "@/types/ResponseTypes";
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
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const ZoomableMangaReaderPage = ({
  item,
  scale,
  translateX,
  translateY,
}: ZoomableMangaReaderPageProps) => {
  // Local values to track the "start" of a gesture to calculate offsets
  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  // Helper to reset everything back to center
  const resetZoom = () => {
    "worklet";
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const stopAnimations = () => {
    "worklet";
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
  };

  // --- PINCH GESTURE ---
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      stopAnimations();
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Calculate new scale
      const newScale = startScale.value * e.scale;

      // Allow slight bounce-back past boundaries during gesture
      if (newScale >= MIN_SCALE * 0.8 && newScale <= MAX_SCALE * 1.2) {
        scale.value = newScale;

        // Focal point logic: adjust translation so zoom happens at finger center
        // focalX/Y is the point between fingers relative to the component center
        const focalX = e.focalX - SCREEN_WIDTH / 2;
        const focalY = e.focalY - SCREEN_HEIGHT / 2;

        translateX.value =
          startTranslateX.value +
          (1 - e.scale) * (focalX - startTranslateX.value);
        translateY.value =
          startTranslateY.value +
          (1 - e.scale) * (focalY - startTranslateY.value);
      }
    })
    .onEnd(() => {
      if (scale.value < 1) {
        resetZoom();
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
      }
    });

  // --- PAN GESTURE ---
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .manualActivation(true)
    .onTouchesMove((_e, m) => {
      if (scale.value > 1) m.activate();
      else m.fail();
    })
    .onStart(() => {
      stopAnimations();
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        const maxTX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        // Apply pan with boundaries
        translateX.value = startTranslateX.value + e.translationX;
        translateY.value = startTranslateY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
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

  // --- DOUBLE TAP ---
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        scale.value = withSpring(2.5);
        // Zoom toward tap position
        const targetX = (SCREEN_WIDTH / 2 - e.x) * 1.5;
        const targetY = (SCREEN_HEIGHT / 2 - e.y) * 1.5;
        translateX.value = withSpring(targetX);
        translateY.value = withSpring(targetY);
      }
    });

  const composed = Gesture.Race(
    pinchGesture,
    Gesture.Race(panGesture, doubleTapGesture),
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
      <Animated.View style={[styles.container, animatedStyle]}>
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
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default ZoomableMangaReaderPage;
