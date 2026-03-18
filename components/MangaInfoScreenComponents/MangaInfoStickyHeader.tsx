import { Image } from "expo-image";
import React, { useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MangaStickyHeaderProps {
  mangaTitle: string;
  mangaCover: string;
  stickyHeaderOpacity: Animated.AnimatedInterpolation<number>;
}

const MangaStickyHeader = ({
  mangaCover,
  mangaTitle,
  stickyHeaderOpacity,
}: MangaStickyHeaderProps) => {
  const insets = useSafeAreaInsets();
  const stickyStyle = useMemo(
    () => ({
      paddingTop: insets.top + 15,
    }),
    [insets.top],
  );
  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        { opacity: stickyHeaderOpacity },
        stickyStyle,
      ]}
      className="z-50 flex-row items-center px-6 p-5 border-b border-white/10 bg-black"
    >
      <Image
        source={mangaCover}
        style={{ width: 50, height: 50, borderRadius: 4 }}
        recyclingKey="sticky-cover"
      />
      <View className="flex-1 mx-5">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>
          {mangaTitle}
        </Text>
        <Text className="text-[10px] text-gray-400 uppercase">
          Chapter 124 • Today
        </Text>
      </View>
      <Pressable
        onPress={() => console.log("Pressed")}
        className="bg-white px-5 py-2 rounded-full active:scale-95"
      >
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
