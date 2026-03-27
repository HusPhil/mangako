// components/manga-info-screen-components/SelectionActionFooter.tsx
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SelectionActionFooterProps {
  onMarkRead: () => void;
  onMarkUnread: () => void;
}

const SelectionActionFooter = ({
  onMarkRead,
  onMarkUnread,
}: SelectionActionFooterProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      // Added absolute positioning to ensure it floats over the FlashList
      style={{ paddingBottom: insets.bottom + 12 }}
      className="bg-zinc-900/95 border-t border-white/10 px-8 pt-5 z-[60] flex-row justify-center gap-4 shadow-2xl"
    >
      {/* Action: Mark Unread (isRead = false) */}
      <Pressable
        onPress={onMarkUnread}
        className="flex-1 h-14 rounded-2xl bg-white/5 items-center justify-center border border-white/10 active:bg-white/10 flex-row"
      >
        <Ionicons name="eye-off-outline" size={22} color="white" />
        <Text className="text-white font-bold ml-3">Mark Unread</Text>
      </Pressable>

      {/* Action: Mark Read (isRead = true) */}
      <Pressable
        onPress={onMarkRead}
        className="flex-1 h-14 rounded-2xl bg-primary items-center justify-center flex-row shadow-lg active:bg-primary/80"
      >
        <Ionicons name="checkmark-done" size={22} color={Colors.background} />
        <Text className="text-background font-bold ml-3">Mark Read</Text>
      </Pressable>
    </Animated.View>
  );
};

export default SelectionActionFooter;
