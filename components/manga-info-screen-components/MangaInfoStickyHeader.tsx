import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MangaStickyHeaderProps {
  mangaTitle: string;
  mangaCover: string;
  scrollY: SharedValue<number>;
}

const MangaStickyHeader = ({
  mangaCover,
  mangaTitle,
  scrollY,
}: MangaStickyHeaderProps) => {
  const insets = useSafeAreaInsets();

  // Define when the header should start appearing (usually end of Hero)
  // 400 is a safe estimate for HERO_HEIGHT - StickyHeight
  const TRIGGER_POINT = 400;

  const animatedStickyHeaderStyle = useAnimatedStyle(() => {
    // 1. Calculate Opacity
    const opacity = interpolate(
      scrollY.value,
      [TRIGGER_POINT, TRIGGER_POINT + 30],
      [0, 1],
      Extrapolation.CLAMP,
    );

    // 2. Calculate Slide (Starts at -100 hidden, moves to 0 visible)
    const translateY = interpolate(
      scrollY.value,
      [TRIGGER_POINT - 50, TRIGGER_POINT],
      [-100, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        { paddingTop: insets.top + 10 },
        animatedStickyHeaderStyle,
      ]}
      // Add pointerEvents so it doesn't block touches when hidden
      pointerEvents={scrollY.value > TRIGGER_POINT ? "auto" : "none"}
      className="z-50 flex-row items-center px-6 pb-4 border-b border-white/10 bg-black"
    >
      <Image
        source={mangaCover}
        style={{ width: 55, height: 55, borderRadius: 4 }}
        contentFit="cover"
      />
      <View className="flex-1 mx-4">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>
          {mangaTitle}
        </Text>
        <Text className="text-[10px] text-gray-400 uppercase">
          Chapter 124 • Today
        </Text>
      </View>
      <Pressable className="bg-white px-4 py-1.5 rounded-full active:scale-95">
        <Text className="text-black text-xs font-bold">Read</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});

export default MangaStickyHeader;
