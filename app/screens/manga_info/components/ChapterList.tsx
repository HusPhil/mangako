import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

interface ChapterListProps {
  mangaUrl: string;
  chaptersData: string[]; // Or a more detailed type if needed
  listStyles?: object;
  onRefresh: () => void;
  onChapterReadStatusChange: (index: number) => void;
  isListed: boolean;
  headerComponent?: React.ReactNode;
  numberOfReadChapters: number;
}

interface ChapterItemProps {
  chapter: string;
  index: number;
  onPress: (index: number) => void;
  isRead: boolean;
}

const ChapterItem: React.FC<ChapterItemProps> = ({ chapter, index, onPress, isRead }) => (
  <TouchableOpacity
    onPress={() => onPress(index)}
    className="flex-row items-center justify-between py-3 mx-4 border-b border-gray-700"
  >
    <View className="flex-1">
      <Text className="text-white text-sm">Vol 1 Ch. {chapter}</Text>
      <Text className="text-gray-300 text-xs">Chapter {chapter}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-gray-300 text-xs mr-3">May 15, 2023</Text>
      {isRead ? (
        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      ) : (
        <Ionicons name="download-outline" size={20} color="white" />
      )}
    </View>
  </TouchableOpacity>
);

const ChapterList: React.FC<ChapterListProps> = ({
  mangaUrl,
  chaptersData,
  listStyles,
  onRefresh,
  onChapterReadStatusChange,
  isListed,
  headerComponent,
  numberOfReadChapters,
}) => {
  const renderChapterItem = ({ item, index }: { item: string; index: number }) => (
    <ChapterItem
      chapter={item}
      index={index}
      onPress={onChapterReadStatusChange}
      isRead={index < numberOfReadChapters}
    />
  );

  const ListHeader = () => (
    <>
      {headerComponent}
      <View className="flex-row justify-between items-center mb-5 mx-4">
        <Text className="text-white font-semibold">
          {chaptersData.length} chapters
        </Text>
        <Pressable>
          <Ionicons name="filter-outline" size={20} color="white" />
        </Pressable>
      </View>
    </>
  );

  return (
    <View className="flex-1" style={listStyles}>
      <FlashList
        data={chaptersData}
        renderItem={renderChapterItem}
        estimatedItemSize={70}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={onRefresh}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default ChapterList;
