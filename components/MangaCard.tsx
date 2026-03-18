import { MangaRender } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

export interface MangaCardProps extends MangaRender {}

const MangaCard = ({
  mangaId,
  mangaCover,
  mangaSourceId,
  mangaTitle,
  mangaUrl,
}: MangaCardProps) => {
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
    router.push(`/manga/${mangaId}?${query}`);
  };

  useEffect(() => {
    router.prefetch(`/manga/${mangaId}`);
  }, [mangaId]);

  return (
    <View key={mangaId} className="flex-1 p-2">
      <Pressable onPress={handlePress}>
        {({ pressed }) => (
          <View
            className="bg-secondary rounded-lg overflow-hidden border border-background"
            style={{
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            }}
          >
            <Image
              source={mangaCover}
              style={{ width: "100%", aspectRatio: 0.7 }}
              contentFit="cover"
              transition={200}
            />

            {/* The Overlay Container */}
            <View className="absolute bottom-0 left-0 right-0 p-2 h-12 justify-center bg-secondary/60">
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
