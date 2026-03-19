import { MangaChapter } from "@/types/ResponseTypes";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React, { useCallback } from "react";
import Animated, { ScrollHandlerProcessed } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MangaInfoChapterListItem from "./MangaInfoChapterListItem";

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList<MangaChapter>,
);

interface MangaInfoChapterListProps {
  mangaChapters: MangaChapter[];
  listHeader: React.JSX.Element;

  onChapterPress: (chapterId: string) => void;
  onChapterLongPress: (chapterId: string) => void;
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>;
}

const MangaInfoChapterList = ({
  mangaChapters,
  listHeader,

  onChapterPress,
  onChapterLongPress,
  onScroll,
}: MangaInfoChapterListProps) => {
  const insets = useSafeAreaInsets();

  const renderItem: ListRenderItem<MangaChapter> = useCallback(
    ({ item }) => (
      <MangaInfoChapterListItem
        chapterId={item.chapterId}
        chapterTitle={item.chapterTitle}
        chapterTimeUploaded={item.chapterTimeUploaded}
        chapterUrl={item.chapterUrl}
        onChapterPress={onChapterPress}
        onChapterLongPress={onChapterLongPress}
      />
    ),
    [onChapterPress, onChapterLongPress],
  );

  return (
    <AnimatedFlashList
      data={mangaChapters}
      renderItem={renderItem}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={listHeader}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    />
  );
};

export default MangaInfoChapterList;
