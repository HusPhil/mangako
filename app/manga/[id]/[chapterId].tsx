import HorizontalReader from "@/components/manga-reader-screen-components/HorizontalReader";
import PageIndicator from "@/components/manga-reader-screen-components/PageIndicator";
import ReaderSettingsOverlay from "@/components/manga-reader-screen-components/ReaderSettingsOverlay";
import VerticalReader from "@/components/manga-reader-screen-components/VerticalReader";
import { Colors } from "@/constants/colors";
import { useMangaReaderScreenLogic } from "@/hooks/manga-reader-screen-hooks/useMangaReaderScreenLogic";
import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";

const MangaReaderScreen = () => {
  const listOfChapters = useReaderSessionStore((state) => state.listOfChapters);

  const {
    mangaId,
    mangaSourceId,
    mangaUrl,

    readingMode,
    isSettingsVisible,
    pages,
    currentPageIndex,
    totalPages,

    isLoading,
    isError,

    onNavigateToNextChapter,
    onNavigateToPrevChapter,
    onNavigateJumpToChapter,

    onViewableItemsChanged,
    registerVisibilitySetter,
    unregisterVisibilitySetter,
  } = useMangaReaderScreenLogic();

  useEffect(() => {
    // AsyncStorage.clear();
    const debugAsyncStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const result = await AsyncStorage.multiGet(keys);

        console.log("--- 📦 Current AsyncStorage Content ---");
        result.forEach(([key, value]) => {
          console.log(`${key}:`, JSON.parse(value || "{}"));
        });
        console.log("---------------------------------------");
      } catch (error) {
        console.error("Error loading AsyncStorage", error);
      }
    };

    // Call this inside a button press or useEffect
    debugAsyncStorage();
  }, [listOfChapters]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !pages) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-4">
        <Text className="text-white text-lg font-bold">Error</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      {readingMode === "vertical" ? (
        <VerticalReader
          pages={pages}
          onViewableItemsChanged={onViewableItemsChanged}
          registerVisibilitySetter={registerVisibilitySetter}
          unregisterVisibilitySetter={unregisterVisibilitySetter}
        />
      ) : readingMode === "horizontal-rtl" ? (
        <HorizontalReader />
      ) : null}

      {isSettingsVisible && (
        <ReaderSettingsOverlay
          mangaId={mangaId}
          mangaUrl={mangaUrl}
          mangaSourceId={mangaSourceId}
          onNavigateToPrev={onNavigateToPrevChapter}
          onNavigateToNext={onNavigateToNextChapter}
          onNavigateToChapter={onNavigateJumpToChapter}
          onJumpToPage={() => {}}
        />
      )}

      <PageIndicator
        currentPageIndex={currentPageIndex}
        totalPages={totalPages}
      />
    </View>
  );
};

export default MangaReaderScreen;
