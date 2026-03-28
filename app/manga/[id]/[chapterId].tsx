import MangaReaderPage from "@/components/manga-reader-screen-components/MangaReaderPage";
import { Colors } from "@/constants/colors";
import { useMangaReaderScreenLogic } from "@/hooks/manga-reader-screen-hooks/useMangaReaderScreenLogic";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { ActivityIndicator, Dimensions, StatusBar, View } from "react-native";

// 1. Extract both width and height for layout calculations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Standard estimate for 2:3 aspect ratio manga pages
const ESTIMATED_PAGE_HEIGHT = SCREEN_WIDTH * 1.5;

const MangaReaderScreen = () => {
  // 2. Extract the overrideItemLayout from your updated hook
  const { pages, isLoading } = useMangaReaderScreenLogic();

  const renderItem = useCallback(
    ({ item }: { item: MangaChapterPage }) => <MangaReaderPage item={item} />,
    [],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      <FlashList
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item) => item.pageId}
        maxItemsInRecyclePool={2} // Reduced to 2 for maximum aggressiveness
        drawDistance={SCREEN_HEIGHT * 1.25} // Severely limits off-screen native rendering
      />
    </View>
  );
};

export default MangaReaderScreen;
