import { MangaChapterPage, useGetChapterPages } from "@/services/useGetChapterPages"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const MangaReaderScreen = () => {
  const router = useRouter();
  const { id: mangaId, chapterId, chapterUrl } = useLocalSearchParams();

  const { data: pages, isLoading, isError, error } = useGetChapterPages('mangakakalot', chapterUrl as string | undefined);

  const renderItem = ({ item }: { item: MangaChapterPage }) => (
    <Image
      source={{ uri: item.pageImageUrl }}
      style={{
        width: windowWidth,
        height: windowHeight,
      }}
      contentFit="contain"  // This makes the image scale to fit inside width & height without cropping
      recyclingKey={item.pageId}
      cachePolicy="none"
      allowDownscaling={false}
      placeholder="loading the image yet"
      onError={(error) => {
        console.error("CHAPTER PAGE ERROR: " + error.error);
      }}
    />
  );
  

  return (
    <SafeAreaView className="h-full w-full bg-black">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Ionicons
          name="arrow-back"
          className="p-5"
          size={24}
          color="white"
          onPress={() => router.back()}
        />
        <Text className="text-white font-semibold text-lg">{`Chapter: ${chapterId}`}</Text>
        {/* Spacer */}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Loading Chapter...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center">
            Error loading chapter pages.
            {error instanceof Error ? `\n${error.message}` : ""}
          </Text>
        </View>
      ) : !pages || pages.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-white text-center">No pages found for this chapter.</Text>
        </View>
      ) : (
        
          <View className="h-full w-full">
            <FlashList
            data={pages}
            keyExtractor={(item) => item.pageId}
            estimatedItemSize={windowWidth * 0.7}
            renderItem={renderItem}
            pagingEnabled
            horizontal
            showsVerticalScrollIndicator={false}
            />
          </View>
           
      )}
    </SafeAreaView>
  );
}

export default MangaReaderScreen;
