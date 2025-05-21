import { FlashList } from "@shopify/flash-list";
import React, { memo, useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import MangaCard from "./MangaCard";

const MangaGrid = ({
  mangaData,
  numColumns,
  listStyles,
  isLoading,
  listEmptyComponent,
  onEndReached,
}) => {
  const placeholderData = useMemo(
    () =>
      new Array(30).fill(null).map((_, index) => ({
        mangaId: `placeholder-${index}`,
        mangaTitle: null,
        mangaCover: null,
        mangaDetails: null,
      })),
    []
  );

  const MangaText = ({ mangaTitle }) => {
    return (
      <View className="absolute  bg-opacity-0 bottom-0 w-full justify-end py-1 bg-secondary-100">
        <Text
          className="text-white text-xs text-left px-1 font-pregular overflow-auto"
          numberOfLines={3}
        >
          {mangaTitle || "Loading.."}
        </Text>
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }) => (
      <View
        className={`w-full px-2 mt-3 h-[150] ${
          isLoading ? "animate-pulse" : ""
        }`}
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
    ),
    [isLoading]
  );

  return (
    <View className="flex-1 px-2">
      <FlashList
        data={mangaData || placeholderData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.mangaId ?? `placeholder-${index}`}
        estimatedItemSize={150}
        numColumns={numColumns}
        contentContainerStyle={listStyles}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default memo(MangaGrid);
