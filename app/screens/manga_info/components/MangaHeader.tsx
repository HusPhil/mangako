import { BookOpen, CopyPlus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface MangaHeaderProps {
  mangaCover?: string;
  mangaId: string;
  mangaTitle?: string;
  mangaUrl?: string;
  details?: {
    author?: string;
    status?: string;
  };
  isLoading?: boolean;
  tabsListed?: boolean;
  numberOfReadChapters: number;
  chapterCount: number;
  onReadingResume: () => void;
  onClearCache?: () => void;
}

const MangaHeader: React.FC<MangaHeaderProps> = ({
  mangaCover,
  mangaId,
  mangaTitle,
  mangaUrl,
  details,
  isLoading,
  tabsListed,
  numberOfReadChapters,
  onReadingResume,
  chapterCount,
  onClearCache,
}) => {
  const imageWidth = width * 0.3;
  const imageHeight = imageWidth * 1.5;
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <View className="px-4 rounded-lg shadow-md mt-2 mb-4">
      <View className="flex-row">
        {/* Cover Image */}
        <View style={{ width: imageWidth, height: imageHeight }} className="rounded-lg overflow-hidden bg-gray-200">
          {mangaCover ? (
            <Image
            source={{
                uri: mangaCover,
                headers: {
                  Referer: "https://www.mangakakalot.gg/",
                  "User-Agent": "Mozilla/5.0 (ExpoApp)",
                },
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 justify-center items-center bg-gray-300 rounded-lg">
              <Text className="text-gray-500 font-medium">No image</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 ml-4 justify-between">
          {/* Title */}
          <Text numberOfLines={2} className="text-lg font-bold text-white mb-2">
            {mangaTitle || 'No Title'}
          </Text>

          {/* Author & Status */}
          <View className="mb-3">
            {details?.author && (
              <Text className="text-sm text-gray-300 mb-1">
                Author: {details.author}
              </Text>
            )}
            <Text className="text-sm font-medium text-gray-300">
              {details?.status || 'Ongoing'}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row mb-3">
            <TouchableOpacity
              onPress={onReadingResume}
              disabled={isLoading}
              className="flex-1 mr-2 flex-row items-center justify-center px-4 py-2 rounded-lg bg-accent"
            >
              <BookOpen size={20} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                {numberOfReadChapters > 0 ? 'Continue' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClearCache}
              disabled={isLoading}
              className="w-10 h-10 mr-2 items-center justify-center bg-gray-200 rounded-lg"
            >
              <Trash2 size={20} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFavorite}
              className="w-10 h-10 items-center justify-center bg-gray-200 rounded-lg"
            >
              <CopyPlus
                size={20}
                color={isFavorite ? '#FF6B6B' : '#333'}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View>
            
            <View className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <View
                style={{ width: `${(numberOfReadChapters / chapterCount) * 100}%` }}
                className="h-full bg-accent rounded-full"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MangaHeader;
