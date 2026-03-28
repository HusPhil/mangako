import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React, { memo } from "react";
import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MangaReaderPage = memo(({ item }: { item: MangaChapterPage }) => {
  const intrinsicWidth = Number(item.pageWidth);
  const intrinsicHeight = Number(item.pageHeight);
  const isValidDimensions = intrinsicWidth > 0 && intrinsicHeight > 0;

  const displayHeight = isValidDimensions
    ? (intrinsicHeight / intrinsicWidth) * SCREEN_WIDTH
    : SCREEN_WIDTH * 1.5;

  return (
    <Image
      recyclingKey={item.pageId}
      source={{
        uri: item.pageImageUrl,
        width: SCREEN_WIDTH,
        height: displayHeight,
      }}
      enforceEarlyResizing={true}
      contentFit="cover"
      cachePolicy="disk"
      decodeFormat={Platform.OS === "android" ? "rgb" : undefined}
      placeholder={item.pageBlurhash}
      transition={0}
      style={{ width: SCREEN_WIDTH, height: displayHeight }}
    />
  );
});

export default MangaReaderPage;
