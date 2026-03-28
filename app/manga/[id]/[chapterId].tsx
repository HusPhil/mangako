import MangaReaderPage from "@/components/manga-reader-screen-components/MangaReaderPage";
import { Colors } from "@/constants/colors";
import { useMangaReaderScreenLogic } from "@/hooks/manga-reader-screen-hooks/useMangaReaderScreenLogic";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";

const MangaReaderScreen = () => {
  const { pages, isLoading, isError, getItemLayout, onBack } =
    useMangaReaderScreenLogic();

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
        removeClippedSubviews={true} // Physically destroy off-screen views
        drawDistance={500} // Only render 500px above/below the screen
      />

      {/* We will add Overlays (Header/Footer) here next */}
    </View>
  );
};

export default MangaReaderScreen;
