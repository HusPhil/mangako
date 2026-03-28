// components/reader/MangaReaderPage.tsx
import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React, { memo } from "react";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MangaReaderPage = memo(({ item }: { item: MangaChapterPage }) => {
  const displayHeight = (item.pageHeight / item.pageWidth) * SCREEN_WIDTH;

  return (
    <Image
      source={{
        uri: item.pageImageUrl,
        // FORCE native downsampling to screen width
        width: SCREEN_WIDTH,
      }}
      recyclingKey={item.pageImageUrl} // Essential for FlashList
      placeholder={item.pageBlurhash}
      cachePolicy="disk" // Ensure disk is used over memory
      transition={0} // Disable animations to save GPU cycles
      style={{ width: SCREEN_WIDTH, height: displayHeight }}
    />
  );
});

export default MangaReaderPage;
