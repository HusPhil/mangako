import { View, Dimensions, ActivityIndicator, Text, TouchableOpacity, ToastAndroid } from 'react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image } from 'expo-image';
import colors from '../../constants/colors';
import { getChapterPageImage } from '../../services/MangakakalotClient';

const ChapterPage = forwardRef(({
  currentManga, imgSrc, 
  pageUrl, pageNum, 
  onRetry, onError,
  onTap, pageLayout,
  horizontal, vertical,
  isLoadingRef,
  onStartShouldSetResponder,
}, ref) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
  const [tick, setTick] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({totalBytesExpectedToWrite: 1, totalBytesWritten: 0, finished: false})

  const thisPageLoadingRef = useRef(isLoadingRef)

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
    getPageSrc: () => imgSrc,
    toggleRender: async ({ aspectRatio }) => {
      setTick(prev => prev + 1);
      setAspectRatio(aspectRatio);
    },
    toggleDownloadProgress: (downloadProgress) => {
      console.log(downloadProgress)
      const convertedExpectedBytes = bytesToMegaBytes(downloadProgress.totalBytesExpectedToWrite)
      const convertedWrittenBytes = bytesToMegaBytes(downloadProgress.totalBytesWritten)
      const finished = convertedWrittenBytes/convertedExpectedBytes === 1

      console.log(finished)

      setDownloadProgress(prev => {
        return {
          totalBytesExpectedToWrite: convertedExpectedBytes,
          totalBytesWritten: convertedWrittenBytes,
          finished,
        }
      })
    }
  }));

  const bytesToMegaBytes = useCallback((bytes) => {
    const convertedResult = bytes / (1024*1024)
    return convertedResult.toFixed(2);
  }, [])

  useEffect(() => {
    if(imgSrc.imgError) {
      ToastAndroid.show(
        "an error occured " + pageNum,
        ToastAndroid.SHORT
      )
    }
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
    <View onPress={onTap}>
      {!imgSrc.imgError ? (
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
              onError={(error) => {
                onError(pageNum, error.error, imgSrc.imgUri)
                console.error("CHAPTER PAGE ERROR: "+ error.error)
              }}
            />
          </View>
        ) : (
          (
            <View className="justify-center items-center" 
              style={{height: screenHeight, width: screenWidth}}
            >
              <ActivityIndicator size={30} color={colors.accent.DEFAULT}/>
              <Text className="font-pregular text-white text-xs mt-3">
              {
                (downloadProgress.totalBytesWritten > 0) &&
                (!downloadProgress.finished) && 
                `${downloadProgress.totalBytesWritten}/${downloadProgress.totalBytesExpectedToWrite} MB`
              }
              </Text>
            </View>
          )
        )
      ) : (
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
      )}
    </View>
  );
});

// Memoizing ChapterPage with React.memo to prevent unnecessary re-renders
export default ChapterPage 
