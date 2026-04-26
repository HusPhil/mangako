import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import React, { memo, useCallback, useMemo } from "react";
import { Dimensions, ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import MangaReaderPage from "./MangaReaderPage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VerticalReaderProps {
  pages: MangaChapterPage[];
  onEndReached: () => void;
  initialIndex: number;
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: any[] }) => void;
  registerVisibilitySetter: (
    index: number,
    setter: (v: boolean) => void,
  ) => void;
  unregisterVisibilitySetter: (index: number) => void;
}

const VerticalReader = ({
  pages,
  initialIndex,
  onEndReached,
  onViewableItemsChanged,
  registerVisibilitySetter,
  unregisterVisibilitySetter,
}: VerticalReaderProps) => {
  const toggleIsSettingsVisible =
    useReaderSessionStore.getState().toggleIsSettingsVisible;

  const gesture = useMemo(
    () =>
      Gesture.LongPress().onStart(() => {
        scheduleOnRN(toggleIsSettingsVisible);
      }),
    [toggleIsSettingsVisible],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MangaChapterPage; index: number }) => (
      <MangaReaderPage
        item={item}
        index={index}
        registerVisibilitySetter={registerVisibilitySetter}
        unregisterVisibilitySetter={unregisterVisibilitySetter}
      />
    ),
    [registerVisibilitySetter, unregisterVisibilitySetter],
  );

  const renderScrollComponent = useCallback(
    (props: any) => <ScrollView {...props} bounces={false} />,
    [gesture],
  );

  return (
    <GestureDetector gesture={gesture}>
      <FlashList
        data={pages}
        renderItem={renderItem}
        initialScrollIndex={initialIndex}
        keyExtractor={(item) => item.pageId}
        renderScrollComponent={renderScrollComponent}
        onEndReached={onEndReached}
        maxItemsInRecyclePool={5}
        drawDistance={SCREEN_HEIGHT * 1.25}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </GestureDetector>
  );
};

export default memo(VerticalReader);
