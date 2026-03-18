import BrowseScreenHeader from "@/components/BrowseScreenComponents/BrowseScreenHeader";
import MangaGrid from "@/components/MangaGrid";
import { useGetLatestMangaList } from "@/hooks/api/useGetMangaList";
import React from "react";
import { Text, View } from "react-native";

const DUMMY_SOURCE = "mangafox";

const Browse = () => {
  const { data, isLoading, isError } = useGetLatestMangaList("mangafox");

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
      <BrowseScreenHeader />
      <MangaGrid mangaList={data?.latest_manga} mangaSourceId={DUMMY_SOURCE} />
    </View>
  );
};

export default Browse;
