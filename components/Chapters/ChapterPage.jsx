import { View, Dimensions, ActivityIndicator, Text, TouchableOpacity, ToastAndroid } from 'react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image } from 'expo-image';
import colors from '../../constants/colors';
import { getChapterPageImage } from '../../services/MangakakalotClient';

const ChapterPage = forwardRef(({
  currentManga, imgSrc, id,
  pageUrl, pageNum, 
  onError, onRetry,
  horizontal, vertical,
}, ref) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
  const [tick, setTick] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({totalBytesExpectedToWrite: 1, totalBytesWritten: 0, finished: false})

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
    getPageSrc: () => imgSrc,
    toggleRender: async ({ aspectRatio }) => {
      setTick(prev => prev + 1);
      setAspectRatio(aspectRatio);
    },
    toggleDownloadProgress: (downloadProgress) => {
      const convertedExpectedBytes = bytesToMegaBytes(downloadProgress.totalBytesExpectedToWrite)
      const convertedWrittenBytes = bytesToMegaBytes(downloadProgress.totalBytesWritten)
      const finished = convertedWrittenBytes/convertedExpectedBytes === 1

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

  const handleRetry = useCallback((gestureEvent) => {
    
  }, [pageNum, pageUrl])

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

  return (
    <View>
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
              recyclingKey={id}
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
              {imgSrc.imgRetry && (
                <Text className="font-pregular text-white text-xs mt-3">
                  {`Trying to retry page ${pageNum}..`}
                </Text>
              )}
              <Text className="font-pregular text-white text-xs mt-3">
              {
                (downloadProgress.totalBytesWritten > 0) && (!downloadProgress.finished) &&
                `${downloadProgress.totalBytesWritten}/${downloadProgress.totalBytesExpectedToWrite} MB`
              }
              </Text>
            </View>
          )
        )
      ) : (
        <View className="justify-center items-center" style={{width: screenWidth, height: screenHeight}}>
          <Text className="font-pregular text-white text-base">Something went wrong</Text>
          <Text className="font-pregular text-white text-base">while loading this page</Text>
          
          <TouchableOpacity onPress={(gestureEvent) => {
            gestureEvent.stopPropagation()
            console.log("HELLORETRYs:")
            onRetry(pageNum, pageUrl)
          }}>
            <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">Click this to retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// Memoizing ChapterPage with React.memo to prevent unnecessary re-renders
export default React.memo(ChapterPage) 
