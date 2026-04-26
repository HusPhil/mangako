import HorizontalReader from "@/components/manga-reader-screen-components/HorizontalReader";
import PageIndicator from "@/components/manga-reader-screen-components/PageIndicator";
import ReaderSettingsOverlay from "@/components/manga-reader-screen-components/ReaderSettingsOverlay";
import ReaderToast from "@/components/manga-reader-screen-components/ReaderToast";
import VerticalReader from "@/components/manga-reader-screen-components/VerticalReader";
import { Colors } from "@/constants/colors";
import { useMangaReaderScreenLogic } from "@/hooks/manga-reader-screen-hooks/useMangaReaderScreenLogic";
import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import React from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MangaReaderScreen = () => {
  const listOfChapters = useReaderSessionStore((state) => state.listOfChapters);

  const insets = useSafeAreaInsets();

  const {
    mangaId,
    mangaSourceId,
    mangaUrl,

    chapterInitialIndex,

    readingMode,
    isSettingsVisible,
    isToastVisible,
    pages,
    currentPageIndex,
    totalPages,

    isLoading,
    isError,

    throttledSave,

    openToast,
    closeToast,

    onNavigateToNextChapter,
    onNavigateToPrevChapter,
    onNavigateJumpToChapter,

    onEndReached,
    onViewableItemsChanged,
    registerVisibilitySetter,
    unregisterVisibilitySetter,
  } = useMangaReaderScreenLogic();

  // useEffect(() => {
  //   // AsyncStorage.clear();
  //   const debugAsyncStorage = async () => {
  //     try {
  //       const keys = await AsyncStorage.getAllKeys();
  //       const result = await AsyncStorage.multiGet(keys);

  //       console.log("--- 📦 Current AsyncStorage Content ---");
  //       result.forEach(([key, value]) => {
  //         console.log(`${key}:`, JSON.parse(value || "{}"));
  //       });
  //       console.log("---------------------------------------");
  //     } catch (error) {
  //       console.error("Error loading AsyncStorage", error);
  //     }
  //   };

  //   // Call this inside a button press or useEffect
  //   // debugAsyncStorage();
  // }, [listOfChapters]);

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
          key={readingMode}
          pages={pages}
          initialIndex={chapterInitialIndex}
          onEndReached={onEndReached}
          onViewableItemsChanged={onViewableItemsChanged}
          registerVisibilitySetter={registerVisibilitySetter}
          unregisterVisibilitySetter={unregisterVisibilitySetter}
        />
      ) : (
        readingMode.includes("horizontal") && (
          <HorizontalReader
            key={readingMode}
            pages={pages}
            initialIndex={chapterInitialIndex}
            onEndReached={onEndReached}
            throttledSave={throttledSave}
            isReversed={readingMode === "horizontal-rtl"}
          />
        )
      )}

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

      {/* Place this AFTER the Readers but BEFORE the Settings Overlay or at the very bottom */}
      {isToastVisible && !isSettingsVisible && (
        <ReaderToast
          isVisible={isToastVisible}
          onClose={closeToast}
          onAction={onNavigateToNextChapter}
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
