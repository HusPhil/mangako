import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapter } from "@/types/ResponseTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReaderSettingChapterNavigationProps {
  mangaId: string;
  mangaSourceId: string;
  mangaUrl: string;
  isVisible: boolean;
  onClose: () => void;
  onSelectChapter: (chapter: MangaChapter) => void;
}

const ReaderSettingChapterNavigation = ({
  mangaId,
  mangaSourceId,
  mangaUrl,
  isVisible,
  onClose,
  onSelectChapter,
}: ReaderSettingChapterNavigationProps) => {
  const insets = useSafeAreaInsets();
  const currentChapter = useReaderSessionStore((s) => s.currentChapter);

  const listOfChapters = useReaderSessionStore((state) => state.listOfChapters);
  const chapterListRef = useRef<FlatList<MangaChapter>>(null);

  // Auto-scroll to current chapter when sheet opens
  useEffect(() => {
    if (!isVisible || !currentChapter || listOfChapters.length === 0) return;
    const index = listOfChapters.findIndex(
      (c) => c.chapterId === currentChapter.chapterId,
    );
    if (index === -1) return;
    setTimeout(() => {
      chapterListRef.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0.5,
      });
    }, 100);
  }, [isVisible]);

  const handlePress = useCallback(
    (chapter: MangaChapter) => {
      onClose();
      setTimeout(() => onSelectChapter(chapter), 150);
    },
    [onClose, onSelectChapter],
  );

  const renderItem = useCallback(
    ({ item }: { item: MangaChapter }) => {
      const isCurrent = item.chapterId === currentChapter?.chapterId;
      return (
        <Pressable
          onPress={() => handlePress(item)}
          className={`px-5 py-4 border-b border-white/10 flex-row items-center justify-between 
            ${isCurrent ? "bg-white/10" : ""}  
            ${item.isRead ? "opacity-50" : ""}`}
        >
          <Text
            numberOfLines={2}
            className={`text-sm flex-1 mr-3 ${isCurrent ? "text-white font-bold" : "text-white/70"}`}
          >
            {item.chapterTitle}
          </Text>
          {isCurrent && (
            <Ionicons name="radio-button-on" size={16} color="white" />
          )}
        </Pressable>
      );
    },
    [currentChapter?.chapterId, handlePress],
  );

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 z-50 justify-end">
      {/* Backdrop */}
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

      {/* Sheet */}
      <View
        className="bg-[#1C1C1E] rounded-t-2xl border-t border-white/15"
        style={{ maxHeight: "70%" }}
      >
        {/* Handle */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-white/20" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/10">
          <Text className="text-white font-bold text-base">Chapters</Text>
          <Text className="text-white/40 text-sm">
            {listOfChapters.length} total
          </Text>
        </View>

        <FlatList
          ref={chapterListRef}
          data={listOfChapters}
          keyExtractor={(item) => item.chapterId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              chapterListRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
                viewPosition: 0.5,
              });
            }, 200);
          }}
        />
      </View>
    </View>
  );
};

export default ReaderSettingChapterNavigation;
