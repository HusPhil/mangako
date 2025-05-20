import { FlashList } from "@shopify/flash-list";
import React from "react";
import { Text, View } from "react-native";

import MangaCard from "./MangaCard";

const MangaSlide = ({
  mangaData,
  listStyles,
  isLoading,
  listEmptyComponent,
  onEndReached,
}) => {
  const placeholderData = new Array(3 * 10).fill(null).map((_, index) => ({
    mangaId: `placeholder-${index}`,
    mangaTitle: null,
    mangaCover: null,
    mangaDetails: null,
  }));

  const MangaText = ({ mangaTitle }) => {
    return (
      <View className="absolute  bg-opacity-0 bottom-0 w-full justify-end py-1 bg-secondary-100">
        <Text
          className="text-white text-xs text-left px-1 font-pregular overflow-auto"
          numberOfLines={3}
        >
          {mangaTitle ? mangaTitle : "Loading.."}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View
      className={`w-[132] mt-3 h-[150] ${isLoading ? "animate-pulse " : ""}`}
    >
      <MangaCard
        mangaId={item.mangaId}
        mangaUrl={item.mangaUrl}
        mangaTitle={item.mangaTitle}
        mangaCover={item.mangaCover}
        containerStyles={"my-1 w-[100%]"}
        coverStyles={"w-[100%] h-[150px]"}
        disabled={isLoading}
      >
        <MangaText mangaTitle={item.mangaTitle} />
      </MangaCard>
    </View>
  );

  const renderSeparator = () => <View className="m-2" />;

  return (
    <View className="mx-4">
      <FlashList
        data={mangaData ? mangaData : placeholderData}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        keyExtractor={(item) => item.mangaId}
        estimatedItemSize={300}
        contentContainerStyle={listStyles}
        showsHorizontalScrollIndicator={false}
        horizontal
        ListEmptyComponent={listEmptyComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default MangaSlide;
