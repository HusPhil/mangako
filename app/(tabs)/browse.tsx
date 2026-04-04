import BrowseScreenHeader from "@/components/browse-screen-components/BrowseScreenHeader";
import MangaGrid from "@/components/MangaGrid";
import { useGetLatestMangaList } from "@/hooks/api/useGetMangaList";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import { mapResponseListToRenderList } from "@/types/ResponseTypes";
import React from "react";
import { Text, View } from "react-native";

const Browse = () => {
  const currentSelectedSource = useSourceSelectionStore(
    (state) => state.currentSelectedSource,
  );
  const { data, isLoading, isError } = useGetLatestMangaList(
    currentSelectedSource?.sourceId || "",
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (isError) {
    return <Text>Error</Text>;
  }

  if (!data) {
    return <Text>No data</Text>;
  }

  return (
    <View className="flex-1 bg-secondary">
      <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
      <MangaGrid mangaList={mapResponseListToRenderList(data?.latest_manga)} />
    </View>
  );
};

export default Browse;
