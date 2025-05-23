import { MangaChapterPage, useGetChapterPages } from "@/services/useGetChapterPages"; // Adjust path as needed
import { ReactNativeZoomableView, ZoomableViewEvent } from '@openspacelabs/react-native-zoomable-view';
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Dimensions, GestureResponderEvent, PanResponderGestureState, Text, View, ViewToken } from "react-native";

const screenWidth = Dimensions.get("screen").width;
const screenHeight = Dimensions.get("screen").height;

const horizontal = true;
const inverted = false;

const MangaReaderScreen = () => {



  const router = useRouter();
  const { id: mangaId, chapterId, chapterUrl } = useLocalSearchParams();
  const { data: pages, isLoading, isError, error } = useGetChapterPages('mangakakalot', chapterUrl as string | undefined);
  
  const [panEnabled, setPanEnabled] = useState(false);
  const zoomableViewRef = useRef<ReactNativeZoomableView>(null);
  const flashListRef = useRef<FlashList<MangaChapterPage>>(null);
  const readerCurrentPage = useRef(0);

  const currentZoomLevel = useRef(1);
  const lastTouchStartTimeStamp = useRef(0);  
  const lastTouchEndTimeStamp = useRef(0);  
  const touchStartPageLocation = useRef({pageX: 0, pageY: 0});
  const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const cancelSingleTap = useRef(false);

  const renderItem = ({ item }: { item: MangaChapterPage }) => (
    <View className="h-full w-full justify-center items-center">
      <Image
      source={{ uri: item.pageImageUrl }}
      style={{
        width: screenWidth,
        height: undefined,
        aspectRatio: item.pageWidth / item.pageHeight,
      }}
      contentFit="contain"  // This makes the image scale to fit inside width & height without cropping
      recyclingKey={item.pageId}
      allowDownscaling={false}
      placeholder="loading the image yet"
      onError={(error) => {
        console.error("CHAPTER PAGE ERROR: " + error.error);
      }}
    />
    </View>
  );

  const handleOnTouchStart = async (event : GestureResponderEvent) => {

    const currentTouchTimeStamp = event.nativeEvent.timestamp
    const { pageX, pageY, } = event.nativeEvent

    // set the new info to share with other components
    touchStartPageLocation.current = {pageX, pageY}
    lastTouchStartTimeStamp.current = currentTouchTimeStamp; 
  }

  const handleOnTouchEnd = (event : GestureResponderEvent) => {
        
    if(cancelSingleTap.current) {
      cancelSingleTap.current = false;
      return
    }

    const TAP_DURATION_THRESHOLD = 200; //in ms
    const DOUBLE_TAP_TIME_THRESHOLD = 350; // in ms
    const TAP_DISTANCE_THRESHOLD = 10; //in px

    const currentTouchTimeStamp = event.nativeEvent.timestamp
    const touchDuration = currentTouchTimeStamp - lastTouchStartTimeStamp.current;
    const numOfTouch =  event.nativeEvent.touches.length

    const { pageX:touchEndPageX, pageY:touchEndPageY } = event.nativeEvent;
    const { pageX:touchStartPageX, pageY:touchStartPageY } = touchStartPageLocation.current;

    const distanceX = Math.abs(touchEndPageX - touchStartPageX)
    const distanceY = Math.abs(touchEndPageY - touchStartPageY)

    const isTapGesture = touchDuration < TAP_DURATION_THRESHOLD &&
      distanceX < TAP_DISTANCE_THRESHOLD &&
      distanceY < TAP_DISTANCE_THRESHOLD 
      // numOfTouch === 0
    
    const isDoubleTapGesture = currentTouchTimeStamp - lastTouchEndTimeStamp.current < DOUBLE_TAP_TIME_THRESHOLD;
    
    if(!isTapGesture) {
      lastTouchEndTimeStamp.current = currentTouchTimeStamp
      return
    }

    if(isDoubleTapGesture && singleTapTimeout.current) {

      clearTimeout(singleTapTimeout.current)
      onDoubleTap()
      
      lastTouchEndTimeStamp.current = currentTouchTimeStamp
      return
    }

    singleTapTimeout.current = setTimeout(() => {
      onTap()
    }, DOUBLE_TAP_TIME_THRESHOLD);

    lastTouchEndTimeStamp.current = currentTouchTimeStamp        
  }

  const onDoubleTap = () => {

    if(currentZoomLevel.current <= 1) {
      zoomableViewRef?.current?.zoomBy(0.5)
      return
    }
    
    if(currentZoomLevel.current <= 1) {
      zoomableViewRef?.current?.zoomTo(2)
    }

  }

  const onTap = () => {
    console.log("onTap")
  }
  
  const handleOnTransform = ({zoomLevel}: {zoomLevel: number}) => {
    if(zoomLevel === 1) setPanEnabled(false) 
    else setPanEnabled(true)
    currentZoomLevel.current = zoomLevel;
  }

  const handleOnDoubleTapAfter = () => {
    if(currentZoomLevel.current > 1) {
      zoomableViewRef.current?.zoomTo(1);
    }
  }

  const handleOnShiftingEnd = (gestureEvent: GestureResponderEvent, gestureState: PanResponderGestureState, zoomableViewEventObject: ZoomableViewEvent)=>{

    const halfScaledWidth = (zoomableViewEventObject.zoomLevel * zoomableViewEventObject.originalWidth) / 2
    const quarterScreenWidth = screenWidth/4
    const screenOffsetXConstant = screenWidth / (2 * halfScaledWidth) 
    const scrollToNextThreshold =  (screenWidth/2) - (quarterScreenWidth * screenOffsetXConstant)

    if((Math.abs(zoomableViewEventObject.offsetX)) < scrollToNextThreshold) return
    
    zoomableViewRef.current?.zoomTo(1, {x: 0, y: 0}) 
    if(zoomableViewEventObject.offsetX < 0) {
      handleReaderNavigation({mode: inverted ? 'prev' : 'next'})
      return
    } 
    handleReaderNavigation({mode: inverted ? 'next' : 'prev'})

  }

  const handleReaderNavigation = (navigationMode: {mode: string, jumpIndex?: number, jumpOffset?: number}) => {

    if(flashListRef.current) {
      if(!navigationMode.mode) throw Error("No mentioned navigation mode.")

      let targetIndex;
      switch (navigationMode.mode) {
        case "prev":
          targetIndex = readerCurrentPage.current - 1 
          flashListRef.current.scrollToIndex({index: targetIndex, animated: true})
          // zoomableViewRef.current?.
          break;
        case "next":
          targetIndex = readerCurrentPage.current + 1 
          flashListRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "jump":
          if(!navigationMode.jumpIndex) throw Error("No mentioned jumpIndex.")
          if(navigationMode.jumpIndex === readerCurrentPage.current) {
            return
          }
          flashListRef.current.scrollToIndex({index: navigationMode.jumpIndex, animated: true})
          break;
        case "jumpToOffset":
          if(!navigationMode.jumpOffset) throw Error("No mentioned jumpOffset.")
          flashListRef.current.scrollToOffset({offset: navigationMode.jumpOffset, animated: true})
          break;
        default:
          break;
      }
    } 
  }

  const onPageChange = (currentPageNum: number | null) => {
    console.log("Current page:", currentPageNum)
  }

  const handleViewableItemsChanged = async({ viewableItems }: { viewableItems: ViewToken[] }) => {

    if(viewableItems.length > 0) {
      const currentPageNum = horizontal ? viewableItems[0].index : viewableItems.splice(-1)[0].index;
      readerCurrentPage.current = currentPageNum ?? 0;
      // console.log("Current page:", readerCurrentPage.current)
      // call the callback func to update the ui back in the parent component
      onPageChange(currentPageNum)
      
      // await debouncedLoadPageImages(currentPageNum)

    }
  }

  return (
    <View className="h-full w-full bg-black">
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Loading Chapter...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center">
            Error loading chapter pages.
            {error instanceof Error ? `\n${error.message}` : ""}
          </Text>
        </View>
      ) : !pages || pages.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-white text-center">No pages found for this chapter.</Text>
        </View>
      ) : (
        
        <View className="h-full w-full"
        onTouchStart={handleOnTouchStart}
        onTouchEnd={handleOnTouchEnd}
      >
        <ReactNativeZoomableView
            ref={zoomableViewRef}
            zoomStep={3}
            minZoom={1}
            maxZoom={3.5}
            pinchToZoomInSensitivity={1.5}
            bindToBorders
            contentWidth={screenWidth}
            contentHeight={screenHeight}
            onTransform={handleOnTransform}
            onDoubleTapAfter={handleOnDoubleTapAfter} 
            onShiftingEnd={handleOnShiftingEnd} 
          >
            <View className="h-full w-full justify-center items-center">
            <FlashList
            className=""
            data={pages}
            keyExtractor={(item) => item.pageId}
            renderItem={renderItem}
            onEndReached={() => {
              const query = new URLSearchParams({
                chapterUrl: "https://www.mangakakalot.gg/manga/magic-emperor/chapter-404",
              }).toString();
        
              router.replace(`/manga/${mangaId}/${chapterId}?${query}`);
              // router.push(`/manga/${mangaId}/${pages[pages.length - 1].pageId}`);
            }}
            showsVerticalScrollIndicator={false}
            pointerEvents={panEnabled ? 'none' : 'auto'}
              ref={flashListRef}
              estimatedItemSize={horizontal ? screenWidth : screenHeight}
              onViewableItemsChanged={handleViewableItemsChanged}
              // onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              pagingEnabled={horizontal}
              horizontal={horizontal}
              inverted={inverted} 
            />
          </View>
        </ReactNativeZoomableView>
      </View>
           
      )}
    </View>
  );
}

export default MangaReaderScreen;
