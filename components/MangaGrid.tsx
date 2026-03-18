import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";
import MangaCard, { MangaCardProps } from "./MangaCard";

const NUM_COLUMNS = 3;

interface MangaItem extends MangaCardProps {}

const DUMMY_DATA: MangaItem[] = Array.from({ length: 20 }, (_, i) => ({
  mangaId: String(i),
  mangaTitle:
    i % 2 === 0
      ? "Manga Title"
      : "Very Long Manga Title Name For Testing Purposes",
  mangaCover: `https://picsum.photos/seed/${i + 1}/200/300`,
  mangaSourceId: "1",
  mangaUrl: `https://picsum.photos/seed/${i + 1}/200/300`,
}));

export function MangaGrid() {
  const renderItem = ({ item }: { item: MangaItem }) => <MangaCard {...item} />;

  return (
    <View className="flex-1">
      <FlashList
        data={DUMMY_DATA}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.mangaId}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}
