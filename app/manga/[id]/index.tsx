import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, StatusBar, Text, View } from "react-native";

// Components
import AddToLibraryModal from "@/components/manga-info-screen-components/AddToLibraryModal";
import MangaInfoChapterList from "@/components/manga-info-screen-components/MangaInfoChapterList";
import MangaInfoHero from "@/components/manga-info-screen-components/MangaInfoHero";
import MangaInfoLoader from "@/components/manga-info-screen-components/MangaInfoLoader";
import MangaStickyHeader from "@/components/manga-info-screen-components/MangaInfoStickyHeader";
import SelectionActionFooter from "@/components/manga-info-screen-components/SelectionActionFooter";
import SelectionHeader from "@/components/manga-info-screen-components/SelectionHeader";
import { useMangaInfoScreenLogic } from "@/hooks/manga-info-screen-hooks/useMangaInfoScreenLogic";
import { useLibraryStore } from "@/stores/library-store";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.7;

type LocalSearchParams = {
  id?: string;
  mangaSourceId?: string;
  mangaCover?: string;
  mangaTitle?: string;
  mangaUrl?: string;
};

const MangaInfoScreen = () => {
  const { id: mangaId } = useLocalSearchParams<LocalSearchParams>();

  if (!mangaId) return null;

  const getMangaById = useLibraryStore((state) => state.getMangaById);
  const ghostManga = useMemo(() => getMangaById(mangaId!), [mangaId]);

  const mangaUrl = ghostManga?.manga_url;
  const mangaCover = ghostManga?.cover_url;
  const mangaTitle = ghostManga?.title;
  const mangaSourceId = ghostManga?.source_id;

  if (!mangaTitle || !mangaCover || !mangaUrl || !mangaSourceId || !mangaId)
    return null;

  const {
    isLoading,
    isError,
    mangaInfo,
    scrollY,
    mangaChapters,

    isSelectionMode,
    selectedCount,
    readChaptersCount,
    onMarkChaptersAsRead,
    onMarkChaptersAsUnread,
    onSelectAll,
    onInvertSelect,
    onClose,

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
        mangaSourceId={mangaSourceId}
        readChaptersCount={readChaptersCount}
        totalChapters={mangaChapters.length}
        mangaRating={"4.9"}
        scrollY={scrollY}
        HERO_HEIGHT={HERO_HEIGHT}
        onBack={handleBack}
        onAddToLibrary={handleAddToLibrary}
      />
    ),
    [
      mangaCover,
      mangaTitle,
      mangaDetails,
      scrollY,
      readChaptersCount,
      handleBack,
    ],
  );

  if (isLoading) return <MangaInfoLoader />;

  if (isError) return <Text>Error</Text>;

  return (
    <View className="flex-1 bg-secondary">
      <StatusBar barStyle="light-content" />
      {!isSelectionMode && (
        <MangaStickyHeader
          mangaCover={mangaCover}
          mangaTitle={mangaTitle}
          scrollY={scrollY}
          onBackPress={handleBack}
        />
      )}
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={selectedCount}
          onInvert={onInvertSelect}
          onSelectAll={onSelectAll}
          onClose={onClose}
        />
      )}
      <MangaInfoChapterList
        mangaId={mangaId}
        mangaChapters={mangaChapters}
        onChapterPress={onChapterPress}
        onChapterLongPress={onChapterLongPress}
        listHeader={listHeader}
        onScroll={handleScroll}
      />
      {isSelectionMode && (
        <SelectionActionFooter
          onMarkRead={onMarkChaptersAsRead}
          onMarkUnread={onMarkChaptersAsUnread}
        />
      )}
      <AddToLibraryModal />
    </View>
  );
};

export default MangaInfoScreen;
