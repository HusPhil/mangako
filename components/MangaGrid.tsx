import { MangaRender } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";
import MangaCard from "./MangaCard";

const NUM_COLUMNS = 3;

type MangaGridItem = MangaRender;

interface MangaGridProps<T extends MangaGridItem> {
  mangaList: T[];
}

const MangaGrid = <T extends MangaGridItem>({
  mangaList,
}: MangaGridProps<T>) => {
  const renderItem = ({ item }: { item: MangaGridItem }) => (
    <MangaCard
      key={item.mangaId}
      mangaSourceId={item.mangaSourceId}
      mangaId={item.mangaId}
      mangaUrl={item.mangaUrl}
      mangaTitle={item.mangaTitle}
      mangaCover={item.mangaCover}
    />
  );

  return (
    <View className="flex-1">
      <FlashList
        data={mangaList}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.mangaId}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
};

export default MangaGrid;
