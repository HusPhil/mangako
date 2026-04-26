import BrowseScreenHeader from "@/components/browse-screen-components/BrowseScreenHeader";
import MangaGrid from "@/components/MangaGrid";
import { useGetLatestMangaList } from "@/hooks/api/useGetMangaList";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import { mapResponseListToRenderList } from "@/types/ResponseTypes";
import React from "react";
import { View } from "react-native";
import { ErrorOverlay, LoadingOverlay } from "../_layout";

const Browse = () => {
  const currentSelectedSource = useSourceSelectionStore(
    (state) => state.currentSelectedSource,
  );
  const { data, isLoading, isError } = useGetLatestMangaList(
    currentSelectedSource?.sourceId || "",
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-secondary">
        <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
        <LoadingOverlay message="Fetching Mangas.." />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-secondary">
        <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
        <ErrorOverlay message="An error occurred, Try again." />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 bg-secondary">
        <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
        <ErrorOverlay message="No data received, Try again." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
      <MangaGrid mangaList={mapResponseListToRenderList(data?.latest_manga)} />
    </View>
  );
};

export default Browse;
