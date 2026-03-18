import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Dimensions, StatusBar, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import MangaInfoHero from "@/components/manga-info-screen-components/MangaInfoHero";
import MangaInfoLoader from "@/components/manga-info-screen-components/MangaInfoLoader";
import MangaStickyHeader from "@/components/manga-info-screen-components/MangaInfoStickyHeader";
import { useMangaInfoScreenLogic } from "@/hooks/manga-info-screen-hooks/useMangaInfoScreenLogic";
import { MangaChapter } from "@/types/ResponseTypes";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.7;

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList<MangaChapter>,
);

type LocalSearchParams = {
  id?: string;
  mangaSourceId?: string;
  mangaCover?: string;
  mangaTitle?: string;
  mangaUrl?: string;
};

const MangaInfoScreen = () => {
  const insets = useSafeAreaInsets();

  const { mangaTitle, mangaCover, mangaUrl, mangaSourceId } =
    useLocalSearchParams<LocalSearchParams>();

  if (!mangaTitle || !mangaCover || !mangaUrl || !mangaSourceId) return null;

  const { isLoading, isError, mangaInfo, handleBack, onScroll, scrollY } =
    useMangaInfoScreenLogic(mangaSourceId, mangaUrl);

  // Dummy Data
  const chapters = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: (124 - i).toString(),
        title: `Chapter ${124 - i}`,
        sub: i === 0 ? "The Final Threshold" : "Broken Vows",
        date: i === 0 ? "Today" : "Oct 24, 2023",
        isNew: i === 0,
        isRead: i > 3,
      })),
    [],
  );

  const renderItem: ListRenderItem<MangaChapter> = useCallback(
    ({ item }) => (
      <View className="py-5 px-6 border-b border-white/5">
        <View>
          <Text className="text-white font-medium">{item.chapterTitle}</Text>
          <Text className="text-gray-500 text-xs mt-1">
            {item.chapterTimeUploaded}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  const listHeader = useMemo(
    () => (
      <MangaInfoHero
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        mangaAuthor={mangaInfo?.mangaDetails.mangaAuthor ?? ""}
        mangaSynopsis={mangaInfo?.mangaDetails.mangaDescription ?? ""}
        scrollY={scrollY}
        HERO_HEIGHT={HERO_HEIGHT}
        onBack={handleBack}
      />
    ),
    [mangaCover, mangaTitle, scrollY, handleBack],
  );

  if (isLoading) return <MangaInfoLoader />;

  if (isError) return <Text>Error</Text>;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* <Text>{mangaInfo?.mangaDetails.mangaDescription}</Text> */}

      <MangaStickyHeader
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        scrollY={scrollY}
      />

      <AnimatedFlashList
        data={mangaInfo?.mangaChapters}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      />
    </View>
  );
};

export default MangaInfoScreen;
