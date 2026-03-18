import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";
import MangaCard, { MangaCardProps } from "./MangaCard";

const NUM_COLUMNS = 3;

interface MangaItem extends MangaCardProps {}

interface MangaGridProps {
  mangaList: MangaItem[];
}

const MangaGrid = ({ mangaList }: MangaGridProps) => {
  const renderItem = ({ item }: { item: MangaItem }) => <MangaCard {...item} />;

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
