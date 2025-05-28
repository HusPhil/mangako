import { MangaChapterPage } from "@/services/ResponseTypes";
import {
  ReactNativeZoomableView,
  ZoomableViewEvent,
} from "@openspacelabs/react-native-zoomable-view";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
  View,
  ViewToken,
} from "react-native";

interface MangaReaderProps {
  handleOnTouchStart: (event: GestureResponderEvent) => void;
  handleOnTouchEnd: (event: GestureResponderEvent) => void;
  handleOnStartShouldSetPanResponderCapture: (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => boolean;
  handleOnTransform: (zoomableViewEventObject: ZoomableViewEvent) => void;
  handleOnDoubleTapAfter: (event: GestureResponderEvent) => void;
  handleOnShiftingEnd: (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState,
    zoomableViewEventObject: ZoomableViewEvent
  ) => void;
  zoomableViewRef: React.RefObject<ReactNativeZoomableView | null>;
  handleViewableItemsChanged: (event: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => void;
  panEnabled: boolean;
  pages: MangaChapterPage[];
  flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
  horizontal: boolean;
  inverted: boolean;
  currentPage: number;
}

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const blurhash = "LJFFaY^-ENpJ.ANFROn%Ioa#xDoJ";

const MangaZoomableReader = ({
  handleOnTouchStart,
  handleOnTouchEnd,
  handleOnStartShouldSetPanResponderCapture,
  handleOnTransform,
  handleOnDoubleTapAfter,
  handleOnShiftingEnd,
  handleViewableItemsChanged,
  flashListRef,
  panEnabled,
  zoomableViewRef,
  pages,
  horizontal,
  inverted,
  currentPage,
}: MangaReaderProps) => {
  const renderItem = ({ item }: { item: MangaChapterPage }) => (
    <View className="flex-1 justify-center items-center">
      <Image
        source={{ uri: item.pageImageUrl }}
        style={{
          width: screenWidth,
          height: undefined,
          aspectRatio: item.pageWidth / item.pageHeight,
        }}
        contentFit="contain" // This makes the image scale to fit inside width & height without cropping
        recyclingKey={item.pageId}  
        allowDownscaling={false}
        placeholder={{blurhash}}
        onError={(error) => {
          console.error("CHAPTER PAGE ERROR: " + error.error);
        }}
      />
    </View>
  );

  const viewabilityConfig = {
    minimumViewTime: 300,           // How long an item should be visible (ms)
    itemVisiblePercentThreshold: 50, // Consider it visible if 30% is on screen
    waitForInteraction: false,
  };

  return (
    <View
      className="h-full w-full"
      onTouchStart={handleOnTouchStart}
      onTouchEnd={handleOnTouchEnd}
    >
      <ReactNativeZoomableView
        ref={zoomableViewRef}
        zoomStep={3}
        minZoom={1}
        maxZoom={3.5}
        pinchToZoomInSensitivity={1.5}
        movementSensibility={1}
        contentWidth={screenWidth}
        contentHeight={screenHeight}
        bindToBorders
        onDoubleTapBefore={(e, zoomableViewEventObject) => {
            e.preventDefault();
            e.stopPropagation();
        }}
        doubleTapZoomToCenter={false}
        onTransform={handleOnTransform}
        onDoubleTapAfter={handleOnDoubleTapAfter}
        onShiftingEnd={handleOnShiftingEnd}
        onStartShouldSetPanResponderCapture={
          handleOnStartShouldSetPanResponderCapture
        }
      >
        <View className="h-full w-full justify-center items-center">
          <FlashList
            className="w-screen h-screen"
            data={pages}
            initialScrollIndex={currentPage}
            keyExtractor={(item) => item.pageId}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            pointerEvents={panEnabled ? "none" : "auto"}
            ref={flashListRef}
            estimatedItemSize={horizontal ? screenWidth : screenHeight}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReachedThreshold={0.5}
            pagingEnabled={horizontal}
            horizontal={horizontal}
            inverted={inverted}
            
            onEndReached={() => {
                // Snackbar.show({
                //     text: "End reached",
                // });
            }}
            key={`manga-reader-${horizontal ? 'horizontal' : 'vertical'}`}
          />
          
        </View>
      </ReactNativeZoomableView>
    </View>
  );
};

export default MangaZoomableReader;
