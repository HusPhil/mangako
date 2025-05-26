import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View, ViewToken } from "react-native";

import { useLastRead } from "@/services/cache/useLastRead";
import { useReadingOptions } from "@/services/cache/useReadingOptions";
import {
  MangaChapterPage,
  useGetChapterPages,
} from "@/services/useGetChapterPages";
import Toast from "react-native-toast-message";
import ReaderOptionsSheet from "./components/manga_reader/ReaderOptionsSheet";
import useReaderWrapperHandler from "./components/manga_reader/useReaderWrapperHandler";
import useZoomableViewHandlers from "./components/manga_reader/useZoomableViewHandlers";
import MangaZoomableReader from "./components/MangaZoomableReader";

const horizontal = !false;
const inverted = false;

const MangaReaderScreen = () => {
  const router = useRouter();
  const { id: mangaId, chapterId, chapterUrl } = useLocalSearchParams();
  const {
    data: pages,
    isLoading,
    isError,
    error,
  } = useGetChapterPages("mangakakalot", chapterUrl as string | undefined);

  const [panEnabled, setPanEnabled] = useState(false);
  const zoomableViewRef = useRef<ReactNativeZoomableView>(null);
  const flashListRef = useRef<FlashList<MangaChapterPage>>(null);

  const currentZoomLevel = useRef(1);
  const readerCurrentPage = useRef(0);

  const [showOptions, setShowOptions] = useState(false);
  
  const { updateLastRead, lastRead, isLoading: isLoadingLastRead } = useLastRead(mangaId as string);
  const {options, updateOptions, isLoading: isLoadingReadingOptions} = useReadingOptions(mangaId as string);
  
  const [readingMode, setReadingMode] = useState(horizontal ?? false);
  const [invertedMode, setInvertedMode] = useState(inverted ?? false);

  const handleReaderNavigation = (navigationMode: {
    mode: string;
    jumpIndex?: number;
    jumpOffset?: number;
  }) => {
    if (flashListRef.current) {
      if (!navigationMode.mode) throw Error("No mentioned navigation mode.");

      let targetIndex;
      switch (navigationMode.mode) {
        case "prev":
          targetIndex = readerCurrentPage.current - 1;
          if (targetIndex >= 0) {
            flashListRef.current.scrollToIndex({
              index: targetIndex,
              animated: true,
            });
          }
          break;
        case "next":
          targetIndex = readerCurrentPage.current + 1;
          if (targetIndex < (pages?.length || 0)) {
            flashListRef.current.scrollToIndex({
              index: targetIndex,
              animated: true,
            });
          }
          break;
        case "jump":
          if (navigationMode.jumpIndex === undefined) throw Error("No mentioned jumpIndex.");
          if (navigationMode.jumpIndex === readerCurrentPage.current) {
            return;
          }
          if (navigationMode.jumpIndex >= 0 && navigationMode.jumpIndex < (pages?.length || 0)) {
            // Close options sheet
            setShowOptions(false);
            
            // Update current page reference
            readerCurrentPage.current = navigationMode.jumpIndex;
            
            // Scroll to the specified index
            flashListRef.current.scrollToIndex({
              index: navigationMode.jumpIndex,
              animated: true,
            });
            
            // Show toast notification
            Toast.show({
              text1: `Jumped to page ${navigationMode.jumpIndex + 1}`,
              position: 'bottom',
            });
          }
          break;
        case "jumpToOffset":
          if (!navigationMode.jumpOffset)
            throw Error("No mentioned jumpOffset.");
          flashListRef.current.scrollToOffset({
            offset: navigationMode.jumpOffset,
            animated: true,
          });
          break;
        default:
          break;
      }
    }
  };

  const {
    handleOnTransform,
    handleOnDoubleTapAfter,
    handleOnShiftingEnd,
    handleOnStartShouldSetPanResponderCapture,
  } = useZoomableViewHandlers({
    setPanEnabled,
    handleReaderNavigation,
    currentZoomLevel,
    zoomableViewRef,
    inverted: invertedMode,
    horizontal: readingMode,
  });

  const onDoubleTap = () => {
    Toast.show({
      text1: "Double tap",
    });
    if (currentZoomLevel.current <= 1) {
      zoomableViewRef?.current?.zoomBy(0.5);
      return;
    } else {
      zoomableViewRef?.current?.zoomTo(1, { x: 0, y: 0 });
    }
  };

  const onTap = () => {
    setShowOptions(true);
  };

  const { handleOnTouchStart, handleOnTouchEnd } = useReaderWrapperHandler({
    onDoubleTap,
    onTap,
  });

  const onPageChange = (currentPageNum: number | null) => {
    if (currentPageNum === null) return;

    // Update the current page reference
    readerCurrentPage.current = currentPageNum;

    updateLastRead(chapterId as string, currentPageNum);

    // Log the current page for debugging
    console.log(`Current page: ${currentPageNum + 1} of ${pages?.length || 0}`);
  };

  const handleViewableItemsChanged = async ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    if(viewableItems.length > 0) {
      const currentPageNum = horizontal ? viewableItems[0].index : viewableItems.splice(-1)[0].index;
      // readerCurrentPage.current = currentPageNum;
      // console.log("Current page:", readerCurrentPage.current)
      // call the callback func to update the ui back in the parent component
      onPageChange(currentPageNum)
      
      // await debouncedLoadPageImages(currentPageNum)

    }
  };

  const handleToggleReadingMode = () => {
    // Toggle reading mode
    setReadingMode(!readingMode);
    updateOptions({ horizontal: !readingMode });

    // Close options sheet
    setShowOptions(false);
  };

  const handleToggleInverted = () => {
    // Toggle inverted mode
    setInvertedMode(!invertedMode);
    updateOptions({ inverted: !invertedMode });
    
    // Close options sheet
    setShowOptions(false);
  };

  useEffect(() => {
    if (lastRead) {
      console.log("lastRead", lastRead);
    }
  }, [lastRead]);

  useEffect(() => {
    if (options) {
      console.log("options", options);
    }
  }, [options]);

  return (
    <View className="h-full w-full bg-black">
      {isLoading ? (
        <MangaReaderLoader />
      ) : isError ? (
        <MangaReaderError error={error} />
      ) : !pages || pages.length === 0 ? (
        <MangaReaderEmpty />
      ) : (
        <View className="h-full w-full">
          <MangaZoomableReader
            pages={pages}
            currentPage={lastRead?.page ?? 0}
            flashListRef={flashListRef}
            zoomableViewRef={zoomableViewRef}
            panEnabled={panEnabled}
            horizontal={readingMode}
            inverted={invertedMode}
            
            handleOnTouchStart={handleOnTouchStart}
            handleOnTouchEnd={handleOnTouchEnd}
            handleViewableItemsChanged={handleViewableItemsChanged}
            
            handleOnShiftingEnd={handleOnShiftingEnd}
            handleOnTransform={handleOnTransform}
            handleOnDoubleTapAfter={handleOnDoubleTapAfter}
            handleOnStartShouldSetPanResponderCapture={
              handleOnStartShouldSetPanResponderCapture
            }
          />

          <Text>{JSON.stringify(lastRead)}</Text>

          <ReaderOptionsSheet
            flashListRef={flashListRef}
            visible={showOptions}
            onClose={() => setShowOptions(false)}
            currentPage={readerCurrentPage.current}
            totalPages={pages.length}
            onNavigate={handleReaderNavigation}
            horizontal={options.horizontal}
            inverted={options.inverted}
            onToggleReadingMode={handleToggleReadingMode}
            onToggleInverted={handleToggleInverted}
          />
        </View>
      )}
    </View>
  );
};

export default MangaReaderScreen;

const MangaReaderLoader = () => {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#fff" />
      <Text className="text-white mt-2">Loading Chapter...</Text>
    </View>
  );
};

const MangaReaderError = ({ error }: { error: Error }) => {
  return (
    <View className="flex-1 justify-center items-center px-4">
      <Text className="text-red-500 text-center">
        Error loading chapter pages.
        {error instanceof Error ? `\n${error.message}` : ""}
      </Text>
    </View>
  );
};

const MangaReaderEmpty = () => {
  return (
    <View className="flex-1 justify-center items-center px-4">
      <Text className="text-white text-center">
        No pages found for this chapter.
      </Text>
    </View>
  );
};
