import { View, Dimensions, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image } from 'expo-image';
import colors from '../../constants/colors';
import { getChapterPageImage } from '../../services/MangakakalotClient';

const ChapterPage = forwardRef(({
  currentManga, imgSrc, 
  pageUrl, pageNum, 
  onRetry,
  onTap, pageLayout,
  horizontal, vertical,
  isLoadingRef,
  onStartShouldSetResponder,
}, ref) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
  const [tick, setTick] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(null);

  const thisPageLoadingRef = useRef(isLoadingRef)

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
    getPageSrc: () => imgSrc,
    toggleRender: async ({ aspectRatio }) => {
      setTick(prev => prev + 1);
      setAspectRatio(aspectRatio);
    }
  }));

  useEffect(() => {
    // const abortController =  new AbortController()
    // const abortSignal = abortController.signal

    // console.log("re-rendered page:", pageNum);
    // const tryRes = async () => {
    //   console.log( "chapter page",pageNum,  await getChapterPageImage(currentManga.manga, currentManga.chapter, imgSrc, abortSignal))
    // }

    // tryRes()
    return () => {
      setTick(-1);
    };
  }, [pageNum]);

  // Determine aspect ratio either from state or fallback to imgSrc dimensions
  const calculatedAspectRatio = aspectRatio || imgSrc?.imgSize?.width / imgSrc?.imgSize?.height;

  // Define an event handler for image load event
  const handleImageLoad = async (event) => {
    const { width: pageWidth, height: pageHeight } = event.source;
    if (horizontal) setAspectRatio(pageWidth / pageHeight);
  };

  return (
    <View onPress={onTap} key={tick}>
      {imgSrc && imgSrc.imgUri ? (
        imgSrc.imgUri ? (
          <View className="mt-[-1px]">
            <Image
              source={{ uri: imgSrc.imgUri }}
              style={{
                height: undefined, 
                width: screenWidth, 
                aspectRatio: calculatedAspectRatio,
                position: 'relative'
              }}
              onLoad={handleImageLoad}
              cachePolicy='none'
              allowDownscaling={false}
              contentFit='cover'
              placeholder={"loading the image yet"}
            />
            {horizontal && tick >= 0 && (
              <View className="h-full w-full justify-center items-center bg-transparent absolute -z-50">
                <ActivityIndicator color={colors.accent.DEFAULT} size='large' />
              </View>
            )}
          </View>
        ) : (
          imgSrc?.error && (
            <View className="h-full justify-center items-center">
              <Text className="font-pregular text-white text-base">Something went wrong</Text>
              <Text className="font-pregular text-white text-base">while loading this page</Text>
              {horizontal && (
                <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">Swipe down to retry</Text>
              )}
              {vertical && (
                <TouchableOpacity onPress={onRetry}>
                  <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">Click this to retry</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )
      ) : (
        <View
          className="justify-center items-center"
          style={{
            height: undefined,
            width: screenWidth,
            aspectRatio: pageLayout && pageLayout[pageNum] ? pageLayout[pageNum].width / pageLayout[pageNum].height : 1,
          }}
        >
          <ActivityIndicator color={colors.accent[100]} size='large' />
        </View>
      )}
    </View>
  );
});

// Memoizing ChapterPage with React.memo to prevent unnecessary re-renders
export default React.memo(ChapterPage, (prevProps, nextProps) => {
  return prevProps.pageNum === nextProps.pageNum && 
         prevProps.imgSrc?.imgUri === nextProps.imgSrc?.imgUri && 
         prevProps.imgSrc?.error === nextProps.imgSrc?.error &&
         prevProps.horizontal === nextProps.horizontal &&
         prevProps.vertical === nextProps.vertical;
});
