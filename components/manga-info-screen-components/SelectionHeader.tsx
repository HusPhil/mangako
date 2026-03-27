// components/manga-info-screen-components/SelectionHeader.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SelectionHeaderProps {
  selectedCount: number;
  onSelectAll: () => void;
  onInvert: () => void;
  onClose: () => void;
}

const SelectionHeader = ({
  selectedCount,
  onSelectAll,
  onInvert,
  onClose,
}: SelectionHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      exiting={FadeOutUp}
      style={{ paddingTop: insets.top + 12 }}
      className="absolute top-0 left-0 right-0 bg-background border-b border-primary/10 px-6 pb-4 z-[60] flex-row justify-between items-center shadow-xl"
    >
      <View className="flex-row items-center">
        {/* Close Button: Exits selection mode */}
        <Pressable onPress={onClose} className="mr-4 p-2 active:opacity-50">
          <Ionicons name="close" size={28} color="white" />
        </Pressable>

        <View>
          <Text className="text-primary font-bold text-xl leading-none">
            {selectedCount}{" "}
            <Text className="text-primary text-sm uppercase tracking-tighter font-bold">
              Selected
            </Text>
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        {/* Select All Button */}
        <Pressable
          onPress={onSelectAll}
          className="flex-row items-center bg-secondary px-3 py-2 rounded-lg border border-primary/10 active:bg-accent/30"
        >
          <MaterialCommunityIcons name="select-all" size={18} color="white" />
          <Text className="text-primary text-[10px] font-bold ml-2">ALL</Text>
        </Pressable>

        {/* Invert Selection Button */}
        <Pressable
          onPress={onInvert}
          className="flex-row items-center bg-secondary px-3 py-2 rounded-lg border border-primary/10 active:bg-accent/30"
        >
          <MaterialCommunityIcons
            name="select-inverse"
            size={18}
            color="white"
          />
          <Text className="text-primary text-[10px] font-bold ml-2">
            INVERT
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default SelectionHeader;
