import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface MangaDetailsContentProps {
  mangaDescription: string;
  mangaAuthor: string;
  mangaStatus: string;
  mangaTags: string[];
  mangaAlternativeNames: string[];
  numberOfReadChapters: number;
  totalChapters: number;
  handleReadingResume: () => void;
  handleClearMangaCache: () => void;
}

const MangaDetailsContent: React.FC<MangaDetailsContentProps> = ({
  mangaDescription,
  mangaAuthor,
  mangaStatus,
  mangaTags,
  mangaAlternativeNames,
  numberOfReadChapters,
  totalChapters,
  handleReadingResume,
  handleClearMangaCache,
}) => {
  const progress = Math.round((numberOfReadChapters / totalChapters) * 100);

  return (
    <View className="px-4 py-2">
      {/* Tags */}
      {mangaTags.length > 0 && mangaTags[0] !== '' && (
        <View className="bg-secondary rounded-lg p-4 mb-4">
          {/* <Text className="text-white font-bold text-lg mb-2">Tags</Text> */}
          <View className="flex-row flex-wrap">
            {mangaTags.map((tag, i) => (
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

      {/* About Section */}
      <View className="bg-secondary rounded-lg p-4 mb-4">
        <Text className="text-white font-bold text-lg mb-2">Summary</Text>
        <Text className="text-gray-100 text-sm font-pthin">{mangaDescription}</Text>
      </View>

      {/* Author & Status */}
      <View className="bg-secondary rounded-lg p-4 mb-4">
        <Text className="text-white text-sm mb-1">
          <Text className="font-bold">Author:</Text> {mangaAuthor}
        </Text>
        <Text className="text-white text-sm">
          <Text className="font-bold">Status:</Text> {mangaStatus}
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

      

      {/* Alternative Titles */}
      {mangaAlternativeNames.length > 0 && (
        <View className="bg-secondary rounded-lg p-4 mb-4">
          <Text className="text-white font-bold text-lg mb-2">
            Alternative Titles
          </Text>
          <View className="space-y-3">
            {mangaAlternativeNames.map((title, index) => (
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

      {/* Bottom Padding */}
      <View className="h-8" />
    </View>
  );
};

export default MangaDetailsContent;
