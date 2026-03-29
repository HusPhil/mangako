import { MangaChapter } from "@/types/ResponseTypes";
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
  onChapterPress: (mangaId: string, chapter: MangaChapter) => void;
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
      chapterId: chapterId,
      chapterTitle: chapterTitle,
      chapterUrl: chapterUrl,
      chapterTimeUploaded: chapterTimeUploaded,
    });
  };

  const handleChapterLongPress = () => {
    onChapterLongPress(chapterId);
  };

  return (
    <Pressable
      onPress={handleChapterPress}
      onLongPress={handleChapterLongPress}
      className={`${isSelected ? "bg-primary/5" : "active:bg-primary/10"}`}
    >
      <View
        className={`py-5 px-6 border-b border-primary/5 flex-row items-center justify-between `}
      >
        <View className={`flex-1 ${isRead ? "opacity-25" : ""}`}>
          <Text className={`font-medium text-primary`}>{chapterTitle}</Text>
          <Text className={`text-xs mt-1 text-accent`}>
            {chapterTimeUploaded}
          </Text>
        </View>

        {/* Optional: Add a small indicator for "Read" status if you want more than just text color changes */}
        {isRead && !isSelected && (
          <View className="w-2 h-2 rounded-full bg-muted ml-2" />
        )}
      </View>
    </Pressable>
  );
};

export default MangaInfoChapterListItem;
