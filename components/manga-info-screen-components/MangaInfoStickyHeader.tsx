import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
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
  onBackPress?: () => void; // Added back press handler
}

const MangaStickyHeader = ({
  mangaCover,
  mangaTitle,
  scrollY,
  onBackPress,
}: MangaStickyHeaderProps) => {
  const insets = useSafeAreaInsets();

  const TRIGGER_POINT = 300;

  const animatedStickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [TRIGGER_POINT, TRIGGER_POINT + 30],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      [TRIGGER_POINT - 50, TRIGGER_POINT],
      [-100, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateY }],
      // Use pointerEvents style return directly for Reanimated 3+
    };
  });

  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        { paddingTop: insets.top + 13 }, // Adjusted padding for balance
        animatedStickyHeaderStyle,
      ]}
      className="z-50 flex-row items-center px-4 pb-4 border-b border-white/10 bg-background"
    >
      {/* Back Button */}
      <Pressable onPress={onBackPress} className="p-2 mr-2 active:opacity-50">
        <Octicons
          name="chevron-left"
          color="white"
          size={24}
          strokeWidth={2.5}
        />
      </Pressable>

      {/* Manga Cover */}
      <Image
        source={mangaCover}
        style={{ width: 50, height: 50, borderRadius: 6 }} // Slightly smaller to fit button row
        contentFit="cover"
      />

      {/* Content */}
      <View className="flex-1 mx-3 gap-1">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>
          {mangaTitle}
        </Text>
        <Text className="text-[10px] text-gray-400 uppercase tracking-wider">
          Chapter 124 • Today
        </Text>
      </View>

      <Pressable
        className="bg-white flex-row items-center px-4 py-2 gap-2 rounded-md active:scale-95"
        style={{ shadowColor: "#fff", shadowOpacity: 0.1, shadowRadius: 10 }}
      >
        <MaterialCommunityIcons
          className="mb-0.5"
          name="book-open-page-variant-outline"
          size={18}
          color="black"
        />
        <Text className="text-black text-sm font-bold uppercase ">Read</Text>
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
