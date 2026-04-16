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
    return <LoadingOverlay message="Fetching Mangas.." />;
  }

  if (isError) {
    return <ErrorOverlay message="An error occurred while fetching mangas." />;
  }

  if (!data) {
    return <ErrorOverlay message="No data received from the server." />;
  }

  return (
    <View className="flex-1 bg-secondary">
      <BrowseScreenHeader currentSelectedSource={currentSelectedSource} />
      <MangaGrid mangaList={mapResponseListToRenderList(data?.latest_manga)} />
    </View>
  );
};

export default Browse;
