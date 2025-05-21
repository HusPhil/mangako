import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface MangaDetailsContentProps {
  mangaInfo: {
    mangaDetails: {
      description: string;
      tags: string[];
      alternativeNames: string[];
    };
    chapterList: any[]; // You can replace `any` with a more specific type if available
  };
  numberOfReadChapters: number;
  handleReadingResume: () => void;
  handleClearMangaCache: () => void;
}

const MangaDetailsContent: React.FC<MangaDetailsContentProps> = ({
  mangaInfo,
  numberOfReadChapters,
  handleReadingResume,
  handleClearMangaCache,
}) => {
  const totalChapters = mangaInfo.chapterList.length;
  const progress = Math.round((numberOfReadChapters / totalChapters) * 100);

  return (
    <View className="px-4 py-2">
      {/* About Section */}
      <View className="bg-secondary rounded-lg p-4 mb-4">
        <Text className="text-white font-bold text-lg mb-2">About</Text>
        <Text className="text-gray-100 text-sm">
          {mangaInfo.mangaDetails.description}
        </Text>
      </View>

      {/* Stats and Progress */}
      <View className="bg-secondary rounded-lg p-4 mb-4">
        <View className="flex-row justify-between mb-3">
          <View className="items-center">
            <Text className="text-accent font-bold text-xl">{totalChapters}</Text>
            <Text className="text-gray-300 text-xs">Chapters</Text>
          </View>
          <View className="items-center">
            <Text className="text-accent font-bold text-xl">{numberOfReadChapters}</Text>
            <Text className="text-gray-300 text-xs">Read</Text>
          </View>
          <View className="items-center">
            <Text className="text-accent font-bold text-xl">{progress}%</Text>
            <Text className="text-gray-300 text-xs">Complete</Text>
          </View>
        </View>

        <View className="h-2 w-full bg-primary rounded-full overflow-hidden">
          <View
            className="h-full bg-accent rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Tags and Metadata */}
      {mangaInfo.mangaDetails && (
        <View className="bg-secondary rounded-lg p-4 mb-4">
          {/* Tags */}
          {mangaInfo.mangaDetails.tags.length > 0 &&
            mangaInfo.mangaDetails.tags[0] !== '' && (
              <View>
                <Text className="text-white font-bold text-lg mb-2">Tags</Text>
                <View className="flex-row flex-wrap">
                  {mangaInfo.mangaDetails.tags.map((tag, i) => (
                    <View
                      key={i}
                      className="bg-primary rounded-lg py-1.5 px-2.5 m-0.5 flex-row items-center"
                    >
                      <Ionicons
                        name="pricetag"
                        size={10}
                        color="#9ca3af"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-white text-xs">{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* Alternative Titles */}
          {mangaInfo.mangaDetails.alternativeNames.length > 0 && (
            <View className="mt-3">
              <Text className="text-white font-bold text-lg mb-2">
                Alternative Titles
              </Text>
              <View className="space-y-3">
                {mangaInfo.mangaDetails.alternativeNames.map((title, index) => (
                  <View
                    key={index}
                    className="bg-primary rounded-lg my-1 flex-row items-center"
                  >
                    <View className="w-1 h-full bg-accent rounded-l-lg" />
                    <Text className="text-gray-100 text-sm py-2 px-3 flex-1">
                      {title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom Padding */}
      <View className="h-8" />
    </View>
  );
};

export default MangaDetailsContent;
