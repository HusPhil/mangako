import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React, { memo, useCallback } from "react";
import { Dimensions, Pressable } from "react-native";
import MangaReaderPage from "./MangaReaderPage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VerticalReaderProps {
  pages: MangaChapterPage[];
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: any[] }) => void;
  registerVisibilitySetter: (
    index: number,
    setter: (v: boolean) => void,
  ) => void;
  unregisterVisibilitySetter: (index: number) => void;
}

const VerticalReader = ({
  pages,
  onViewableItemsChanged,
  registerVisibilitySetter,
  unregisterVisibilitySetter,
}: VerticalReaderProps) => {
  const toggleIsSettingsVisible =
    useReaderSessionStore.getState().toggleIsSettingsVisible;
  const currentChapter = useReaderSessionStore((state) => state.currentChapter);
  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => (
      <Pressable className="flex-1" onLongPress={toggleIsSettingsVisible}>
        <MangaReaderPage
          item={item}
          index={index}
          registerVisibilitySetter={registerVisibilitySetter}
          unregisterVisibilitySetter={unregisterVisibilitySetter}
        />
      </Pressable>
    ),
    [currentChapter, registerVisibilitySetter, unregisterVisibilitySetter],
  );
  return (
    <FlashList
      data={pages}
      renderItem={renderItem}
      keyExtractor={(item) => item.pageId}
      maxItemsInRecyclePool={5}
      drawDistance={SCREEN_HEIGHT * 1.25}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 1 }}
    />
  );
};

export default memo(VerticalReader);
