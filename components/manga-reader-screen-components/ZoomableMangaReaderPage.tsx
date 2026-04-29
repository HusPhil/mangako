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
import { scheduleOnRN } from "react-native-worklets";

interface ZoomableMangaReaderPageProps {
  item: MangaChapterPage;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scrollToNextPage?: () => void;
  scrollToPreviousPage?: () => void;
  onLongPress?: () => void; // Added prop
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const ZoomableMangaReaderPage = ({
  item,
  scale,
  translateX,
  translateY,
  scrollToNextPage,
  scrollToPreviousPage,
  onLongPress,
}: ZoomableMangaReaderPageProps) => {
  const displayedImageWidth = useSharedValue(SCREEN_WIDTH);
  const displayedImageHeight = useSharedValue(SCREEN_HEIGHT);

  const gestureTranslateX = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

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

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      stopAnimations();
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newScale = startScale.value * e.scale;
      if (newScale >= MIN_SCALE * 0.8 && newScale <= MAX_SCALE * 1.2) {
        scale.value = newScale;
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
      gestureTranslateX.value = 0;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        const maxY = Math.max(
          0,
          (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
        );
        gestureTranslateX.value = e.translationX;
        translateX.value = startTranslateX.value + e.translationX;
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-maxY, maxY],
        });
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        const maxX = Math.max(
          0,
          (displayedImageWidth.value * scale.value - SCREEN_WIDTH) / 2,
        );
        const maxY = Math.max(
          0,
          (displayedImageHeight.value * scale.value - SCREEN_HEIGHT) / 2,
        );

        const overscrollX = startTranslateX.value + gestureTranslateX.value;
        const OVERSCROLL_THRESHOLD = 75;
        const VELOCITY_THRESHOLD = 600;

        if (
          overscrollX > maxX + OVERSCROLL_THRESHOLD &&
          e.velocityX > VELOCITY_THRESHOLD
        ) {
          if (scrollToPreviousPage) scheduleOnRN(scrollToPreviousPage);
        } else if (
          overscrollX < -maxX - OVERSCROLL_THRESHOLD &&
          e.velocityX < -VELOCITY_THRESHOLD
        ) {
          if (scrollToNextPage) scheduleOnRN(scrollToNextPage);
        }

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

        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-maxY, maxY],
        });
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        const nextScale = 2.0;
        scale.value = withSpring(nextScale);
        const maxX = Math.max(
          0,
          (displayedImageWidth.value * nextScale - SCREEN_WIDTH) / 2,
        );
        const maxY = Math.max(
          0,
          (displayedImageHeight.value * nextScale - SCREEN_HEIGHT) / 2,
        );
        let targetX = (SCREEN_WIDTH / 2 - e.x) * (nextScale - 1);
        let targetY = (SCREEN_HEIGHT / 2 - e.y) * (nextScale - 1);
        targetX = Math.min(maxX, Math.max(-maxX, targetX));
        targetY = Math.min(maxY, Math.max(-maxY, targetY));
        translateX.value = withSpring(targetX);
        translateY.value = withSpring(targetY);
      }
    });

  const longPressGesture = Gesture.LongPress().onStart(() => {
    // Triggers exactly after 500ms of holding down
    if (onLongPress) {
      scheduleOnRN(onLongPress);
    }
  });

  // --- COMPOSITION ---
  // Exclusive ensures that if a LongPress starts, it doesn't
  // accidentally trigger a single tap (if you add one later)
  // or conflict with the DoubleTap logic.
  const tapSystem = Gesture.Exclusive(doubleTapGesture, longPressGesture);

  const composed = Gesture.Race(pinchGesture, panGesture, tapSystem);

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
          onLoad={(e) => {
            const { width: w, height: h } = e.nativeEvent.source;
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
