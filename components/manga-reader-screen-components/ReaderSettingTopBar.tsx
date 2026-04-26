import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReaderSettingTopBarProps {
  onOpenChapters: () => void;
  onOpenSettings: () => void;
}

const ReaderSettingTopBar = ({
  onOpenChapters,
  onOpenSettings,
}: ReaderSettingTopBarProps) => {
  const insets = useSafeAreaInsets();
  const chapterTitle = useReaderSessionStore(
    (s) => s.currentChapter?.chapterTitle,
  );

  return (
    <View
      className="absolute top-0 w-full z-50 flex-row items-center justify-between px-3 border-b border-white/15 bg-[#1C1C1E]/90"
      style={
        Platform.OS === "ios"
          ? { paddingTop: insets.top, paddingBottom: 12 }
          : { paddingTop: 12, paddingBottom: 12 }
      }
    >
      <Pressable className="p-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="white" />
      </Pressable>

      <Text
        numberOfLines={1}
        className="text-white flex-1 mx-3 text-center font-medium text-[15px]"
      >
        {chapterTitle}
      </Text>

      <Pressable className="p-2" onPress={onOpenChapters}>
        <Ionicons name="list" size={22} color="white" />
      </Pressable>
    </View>
  );
};

export default ReaderSettingTopBar;
