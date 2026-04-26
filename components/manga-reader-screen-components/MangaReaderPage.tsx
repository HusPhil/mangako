import { Colors } from "@/constants/colors";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import React, { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    useEffect(() => {
      const debouncedSetter = (v: boolean) => {
        if (visibilityTimerRef.current)
          clearTimeout(visibilityTimerRef.current);
        if (v) {
          setIsVisible(true);
        } else {
          visibilityTimerRef.current = setTimeout(
            () => setIsVisible(false),
            300,
          );
        }
      };

      registerVisibilitySetter(index, debouncedSetter);
      return () => {
        if (visibilityTimerRef.current)
          clearTimeout(visibilityTimerRef.current);
        unregisterVisibilitySetter(index);
      };
    }, [index, registerVisibilitySetter, unregisterVisibilitySetter]);

    const containerStyle = {
      width: SCREEN_WIDTH,
      height: displayHeight,
      backgroundColor: "#1a1a1a",
    };

    const showSpinner = !isVisible;

    return (
      <View style={containerStyle}>
        <Image
          recyclingKey={item.pageId}
          source={isVisible ? { uri: item.pageImageUrl } : null}
          contentFit="contain"
          style={{ width: SCREEN_WIDTH, height: displayHeight }}
          cachePolicy="disk"
          transition={0}
          priority={isVisible ? "normal" : "low"}
          decodeFormat="rgb"
        />

        {showSpinner && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>
    );
  },
);

export default MangaReaderPage;
