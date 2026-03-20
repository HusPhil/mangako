import { Colors } from "@/constants/colors";
import { MangaRender } from "@/types/ResponseTypes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface MangaCardProps extends MangaRender {}

const MangaCard = ({
  mangaId,
  mangaCover,
  mangaSourceId,
  mangaTitle,
  mangaUrl,
}: MangaCardProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(
    () =>
      new URLSearchParams({
        mangaSourceId: mangaSourceId ?? "",
        mangaCover: mangaCover ?? "",
        mangaTitle: mangaTitle ?? "",
        mangaUrl: mangaUrl ?? "NONE",
      }).toString(),
    [mangaSourceId, mangaCover, mangaTitle, mangaUrl],
  );

  const handlePress = () => {
    try {
      router.push(`/manga/${mangaId}?${query}`);
    } catch (error) {
      console.warn("Navigation failed:", error);
    }
  };

  return (
    <View className="flex-1 p-2">
      <Pressable onPress={handlePress}>
        {({ pressed }) => (
          <View
            className="bg-background rounded-lg overflow-hidden border border-backgroud"
            style={{
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            }}
          >
            {/* Image Container */}
            <View className="relative w-full" style={{ aspectRatio: 0.7 }}>
              <Image
                source={mangaUrl}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
                onLoadStart={() => setIsLoading(true)}
                // onLoadEnd={() => setIsLoading(false)}
              />

              {/* Placeholder Icon Overlay */}
              {isLoading && (
                <View
                  style={StyleSheet.absoluteFill}
                  className="items-center justify-center mb-7 bg-secondary/30"
                >
                  <Ionicons
                    name="image-outline"
                    size={38}
                    color={Colors.primary}
                  />
                </View>
              )}
            </View>

            {/* Title Overlay */}
            <View className="absolute bottom-0 left-0 right-0 p-2 h-12 justify-center bg-background/80">
              <Text
                className="text-white text-[10px] font-semibold"
                numberOfLines={2}
              >
                {mangaTitle}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
};

export default MangaCard;
