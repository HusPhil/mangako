import { ChapterMetadata } from "@/services/db/types";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface MangaInfoChapterListItemProps {
  mangaId: string;
  chapterId: string;
  chapterTitle: string;
  chapterTimeUploaded: string;
  chapterUrl: string;
  isRead?: boolean; // Added
  isSelected?: boolean; // Added
  onChapterPress: (mangaId: string, chapter: ChapterMetadata) => void;
  onChapterLongPress: (chapterId: string) => void;
}

const MangaInfoChapterListItem = ({
  mangaId,
  chapterId,
  chapterUrl,
  chapterTitle,
  chapterTimeUploaded,
  isRead = false,
  isSelected = false,
  onChapterLongPress,
  onChapterPress,
}: MangaInfoChapterListItemProps) => {
  const handleChapterPress = () => {
    onChapterPress(mangaId, {
      id: chapterId,
      title: chapterTitle,
      url: chapterUrl,
    });
  };

  const handleChapterLongPress = () => {
    onChapterLongPress(chapterId);
  };

  return (
    <Pressable
      onPress={handleChapterPress}
      onLongPress={handleChapterLongPress}
      // Added visual feedback for pressing
      className={`${isSelected ? "bg-primary/20" : "active:bg-white/5"}`}
    >
      <View
        className={`py-5 px-6 border-b border-white/5 flex-row items-center justify-between ${
          isSelected ? "bg-blue-500/20" : ""
        }`}
      >
        <View className="flex-1">
          <Text
            className={`font-medium ${
              isSelected
                ? "text-blue-400"
                : isRead
                  ? "text-gray-500"
                  : "text-white"
            }`}
          >
            {chapterTitle}
          </Text>
          <Text
            className={`text-xs mt-1 ${isRead ? "text-gray-600" : "text-gray-400"}`}
          >
            {chapterTimeUploaded}
          </Text>
        </View>

        {/* Optional: Add a small indicator for "Read" status if you want more than just text color changes */}
        {isRead && !isSelected && (
          <View className="w-2 h-2 rounded-full bg-gray-600 ml-2" />
        )}
      </View>
    </Pressable>
  );
};

export default MangaInfoChapterListItem;
