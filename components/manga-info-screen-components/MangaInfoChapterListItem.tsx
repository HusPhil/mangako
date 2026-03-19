import React from "react";
import { Pressable, Text, View } from "react-native";

interface MangaInfoChapterListItemProps {
  chapterId: string;
  chapterTitle: string;
  chapterTimeUploaded: string;
  chapterUrl: string;
  // index: number;
  // isRead: boolean;
  // initialIsSelected: boolean;
  // selectionModeOn: boolean;
  // lastPageRead: number;
  onChapterPress: (chapterId: string) => void;
  onChapterLongPress: (chapterId: string) => void;
}

const MangaInfoChapterListItem = ({
  chapterId,
  chapterUrl,
  chapterTitle,
  chapterTimeUploaded,

  onChapterLongPress,
  onChapterPress,
}: MangaInfoChapterListItemProps) => {
  const handleChapterPress = () => {
    onChapterPress(chapterId);
  };

  const handleChapterLongPress = () => {
    onChapterLongPress(chapterId);
  };

  return (
    <Pressable
      onPress={handleChapterPress}
      onLongPress={handleChapterLongPress}
    >
      <View className="py-5 px-6 border-b border-white/5">
        <View>
          <Text className="text-white font-medium">{chapterTitle}</Text>
          <Text className="text-gray-500 text-xs mt-1">
            {chapterTimeUploaded}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default MangaInfoChapterListItem;
