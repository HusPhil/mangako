import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, StatusBar, Text, View } from "react-native";

// Components
import AddToLibraryModal from "@/components/manga-info-screen-components/AddToLibraryModal";
import MangaInfoChapterList from "@/components/manga-info-screen-components/MangaInfoChapterList";
import MangaInfoHero from "@/components/manga-info-screen-components/MangaInfoHero";
import MangaInfoLoader from "@/components/manga-info-screen-components/MangaInfoLoader";
import MangaStickyHeader from "@/components/manga-info-screen-components/MangaInfoStickyHeader";
import { useMangaInfoScreenLogic } from "@/hooks/manga-info-screen-hooks/useMangaInfoScreenLogic";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.7;

type LocalSearchParams = {
  mangaId?: string;
  mangaSourceId?: string;
  mangaCover?: string;
  mangaTitle?: string;
  mangaUrl?: string;
};

const MangaInfoScreen = () => {
  const { mangaId, mangaTitle, mangaCover, mangaUrl, mangaSourceId } =
    useLocalSearchParams<LocalSearchParams>();

  if (!mangaTitle || !mangaCover || !mangaUrl || !mangaSourceId || !mangaId)
    return null;

  const {
    isLoading,
    isError,
    mangaInfo,
    scrollY,
    onChapterPress,
    onChapterLongPress,
    onBack: handleBack,
    onScroll: handleScroll,
    onAddToLibrary: handleAddToLibrary,
  } = useMangaInfoScreenLogic(
    mangaSourceId,
    mangaUrl,
    mangaId,
    mangaTitle,
    mangaCover,
  );

  const mangaDetails = mangaInfo?.mangaDetails;

  const listHeader = useMemo(
    () => (
      <MangaInfoHero
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        mangaAuthor={mangaDetails?.mangaAuthor ?? ""}
        mangaSynopsis={mangaDetails?.mangaDescription ?? ""}
        mangaStatus={mangaDetails?.mangaStatus ?? ""}
        mangaTags={mangaDetails?.mangaTags ?? []}
        mangaAlternativeNames={mangaDetails?.mangaAlternativeNames ?? []}
        mangaRating={"4.9"}
        scrollY={scrollY}
        HERO_HEIGHT={HERO_HEIGHT}
        onBack={handleBack}
        onAddToLibrary={handleAddToLibrary}
      />
    ),
    [mangaCover, mangaTitle, mangaDetails, scrollY, handleBack],
  );

  if (isLoading) return <MangaInfoLoader />;

  if (isError) return <Text>Error</Text>;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <MangaStickyHeader
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        scrollY={scrollY}
      />
      <MangaInfoChapterList
        mangaChapters={mangaInfo?.mangaChapters ?? []}
        onChapterPress={onChapterPress}
        onChapterLongPress={onChapterLongPress}
        listHeader={listHeader}
        onScroll={handleScroll}
      />
      <AddToLibraryModal />
    </View>
  );
};

export default MangaInfoScreen;
