import { Colors } from "@/constants/colors";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image, ImageProgressEventData } from "expo-image";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
    const [loadProgress, setLoadProgress] = useState(0);
    const [thumbhash, setThumbhash] = useState<string | null>(
      thumbhashCache.get(item.pageImageUrl) ?? null,
    );
    const thumbhashGeneratedRef = useRef(thumbhashCache.has(item.pageImageUrl));
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

    const onLoadStart = useCallback(() => {
      setIsImageLoading(true);
      setLoadProgress(0);
    }, []);

    const onProgress = useCallback((e: ImageProgressEventData) => {
      const { loaded, total } = e;
      if (total > 0) setLoadProgress(loaded / total);
    }, []);

    const onLoadEnd = useCallback(async () => {
      setLoadProgress(1);
      setIsImageLoading(false);

      if (thumbhashGeneratedRef.current || !item.pageImageUrl) return;
      thumbhashGeneratedRef.current = true;
      try {
        const hash = await Image.generateThumbhashAsync(item.pageImageUrl);
        thumbhashCache.set(item.pageImageUrl, hash);
        setThumbhash(hash);
      } catch {
        // Non-critical
        console.warn("Failed to generate thumbhash for", item.pageImageUrl);
      }
    }, [item.pageImageUrl]);

    const containerStyle = { width: SCREEN_WIDTH, height: displayHeight };
    const showThumbhash = thumbhash && (!isVisible || isImageLoading);
    const showSpinner = isImageLoading && isVisible && !thumbhash;

    return (
      <View style={containerStyle}>
        {showThumbhash && (
          <Image
            source={{
              thumbhash,
              width: intrinsicWidth > 0 ? intrinsicWidth : SCREEN_WIDTH,
              height: intrinsicHeight > 0 ? intrinsicHeight : displayHeight,
            }}
            contentFit="cover"
            cachePolicy="none"
            style={[containerStyle, { position: "absolute" }]}
          />
        )}

        <Image
          recyclingKey={item.pageId}
          source={isVisible ? { uri: item.pageImageUrl } : null}
          enforceEarlyResizing={true}
          style={containerStyle}
          contentFit="cover"
          cachePolicy="disk"
          decodeFormat={Platform.OS === "android" ? "rgb" : undefined}
          transition={0}
          priority={isVisible ? "normal" : "low"}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onProgress={(e) => onProgress(e)}
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

            {loadProgress > 0 && loadProgress < 1 && (
              <View
                style={{
                  width: 80,
                  height: 2,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.round(loadProgress * 100)}%`,
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    borderRadius: 1,
                  }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  },
);

export default MangaReaderPage;
