import BrowseScreenHeader from "@/components/BrowseScreenHeader";
import MangaGrid from "@/components/MangaGrid";
import { useGetLatestMangaList } from "@/hooks/api/useGetMangaList";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const Browse = () => {
  // 1. Destructure for cleaner code
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

  const handleFastPress = () => {
    // We use the simplest possible navigation call
    // No URLSearchParams, no complex objects
    router.push({
      pathname: "/manga/test-id",
      params: {
        mangaTitle: "Test Manga",
        mangaSourceId: "asura",
        mangaUrl: "https://example.com",
      },
    });
  };

  return (
    <View className="flex-1 bg-secondary">
      <BrowseScreenHeader />
      <Pressable
        onPress={handleFastPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#333" : "#6200ee",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
        })}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          🚀 TEST NAVIGATION SPEED
        </Text>
      </Pressable>
      <MangaGrid mangaList={data?.latest_manga} />
    </View>
  );
};

export default Browse;
