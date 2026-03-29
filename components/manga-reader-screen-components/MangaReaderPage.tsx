import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React, { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const thumbhashCache = new Map<string, string>();

const MangaReaderPage = memo(
  ({
    item,
    index,
    registerVisibilitySetter,
    unregisterVisibilitySetter,
  }: {
    item: MangaChapterPage;
    index: number;
    registerVisibilitySetter: (
      index: number,
      setter: (v: boolean) => void,
    ) => void;
    unregisterVisibilitySetter: (index: number) => void;
  }) => {
    const intrinsicWidth = Number(item.pageWidth);
    const intrinsicHeight = Number(item.pageHeight);
    const isValidDimensions = intrinsicWidth > 0 && intrinsicHeight > 0;

    const displayHeight = isValidDimensions
      ? (intrinsicHeight / intrinsicWidth) * SCREEN_WIDTH
      : SCREEN_WIDTH * 1.5;

    const [isVisible, setIsVisible] = useState(true);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [thumbhash, setThumbhash] = useState<string | null>(
      thumbhashCache.get(item.pageImageUrl) ?? null,
    );
    const thumbhashGeneratedRef = useRef(thumbhashCache.has(item.pageImageUrl));

    useEffect(() => {
      registerVisibilitySetter(index, setIsVisible);
      return () => unregisterVisibilitySetter(index);
    }, [index, registerVisibilitySetter, unregisterVisibilitySetter]);

    const onLoadEnd = async () => {
      setIsImageLoading(false);

      if (thumbhashGeneratedRef.current || !item.pageImageUrl) return;
      thumbhashGeneratedRef.current = true;

      try {
        const hash = await Image.generateThumbhashAsync(item.pageImageUrl);
        thumbhashCache.set(item.pageImageUrl, hash);
        setThumbhash(hash);
      } catch {
        // Non-critical
      }
    };

    const containerStyle = { width: SCREEN_WIDTH, height: displayHeight };

    return (
      <View style={containerStyle}>
        {thumbhash && (
          <Image
            source={{ thumbhash, width: SCREEN_WIDTH, height: displayHeight }}
            contentFit="cover"
            cachePolicy="none"
            style={[containerStyle, { position: "absolute" }]}
          />
        )}

        <Image
          recyclingKey={item.pageId}
          source={isVisible ? { uri: item.pageImageUrl } : null}
          enforceEarlyResizing={true}
          contentFit="cover"
          cachePolicy="disk"
          decodeFormat={Platform.OS === "android" ? "rgb" : undefined}
          transition={0}
          priority={isVisible ? "normal" : "low"}
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={onLoadEnd}
          style={containerStyle}
        />

        {isImageLoading && isVisible && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="small" color="#ffffff80" />
          </View>
        )}
      </View>
    );
  },
);

export default MangaReaderPage;
