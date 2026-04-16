import { MangaRender } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";
import EmptyListPlaceholder from "./EmptyListPlaceholder";
import MangaCard from "./MangaCard";

const NUM_COLUMNS = 3;

type MangaGridItem = MangaRender;

interface MangaGridProps<T extends MangaGridItem> {
  mangaList: T[];
  listEmptyComponent?: React.ReactElement | null;
}

const MangaGrid = <T extends MangaGridItem>({
  mangaList,
  listEmptyComponent,
}: MangaGridProps<T>) => {
  const renderItem = ({ item }: { item: MangaGridItem }) => (
    <MangaCard
      mangaSourceId={item.mangaSourceId}
      mangaId={item.mangaId}
      mangaUrl={item.mangaUrl}
      mangaTitle={item.mangaTitle}
      mangaCover={item.mangaCover}
    />
  );

  return (
    <View className="flex-1 h-full">
      <FlashList
        data={mangaList}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.mangaId}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={{ padding: 10, flex: 1 }}
        ListEmptyComponent={listEmptyComponent || <EmptyListPlaceholder />}
      />
    </View>
  );
};

export default MangaGrid;
