import { View, Dimensions, ActivityIndicator, Text, TouchableWithoutFeedback } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Image } from 'expo-image';
import colors from '../../constants/colors';


const ChapterPage = forwardRef(({
  currentManga, imgSrc, 
  pageUrl, pageNum, 
  onRetry,
  onTap, pageLayout,
  horizontal, vertical,
}, ref) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
  const [tick, setTick] = useState(0)
  const [aspectRatio, setAspectRatio] = useState(null)

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
    toggleRender: async ({aspectRatio}) => {
        setTick(prev => prev + 1)
        setAspectRatio(aspectRatio)
    }
  }));

  useEffect(() => {
    return () => {
      setTick(-1)
    }
  }, [])



  return (
    <> 
        <TouchableWithoutFeedback disabled={!onTap} onPress={onTap} key={tick}>
        {imgSrc ? (
          imgSrc.imgUri ? (
            <View className="mt-[-1px]">
                <Image
                    source={{ uri: imgSrc.imgUri }}
                    style={{
                      height: undefined, 
                      width: screenWidth, 
                      aspectRatio: aspectRatio ? aspectRatio : imgSrc?.imgSize?.width/imgSrc?.imgSize?.height,
                      position: 'relative'
                    }}
                    onLoad={async (event) => {
                      const { width: pageWidth, height: pageHeight } = event.source;
                      if(horizontal) setAspectRatio(pageWidth/pageHeight)
                    }}
                    cachePolicy='none'
                    allowDownscaling={false}
                    contentFit='cover'
                    placeholder={"loading the image yet"}
                    keyExtractor={imgSrc.imgUri}
                />
                {horizontal && tick >= 0 && (
                  <View 
                      className="h-full w-full justify-center items-cente bg-transparent absolute -z-50"
                  >
                      <ActivityIndicator color={`${colors.accent.DEFAULT}`} size='large' />
                  </View>
                )}
                
            </View>
          ) : (
            imgSrc?.error && (
              <View className="mt-[-1px]" key={tick}>
                <Text className="font-pregular text-white">error</Text>
              </View>
            )
          )

        ) : (
          <View
            className="justify-center items-center"
            style={{
              height: undefined,
              width: screenWidth,
              aspectRatio: pageLayout && pageLayout[pageNum] ? pageLayout[pageNum].width/pageLayout[pageNum].height : 1,
            }}
          >
              <ActivityIndicator color={`${colors.accent[100]}`} size='large' />
          </View>
        )}
        </TouchableWithoutFeedback>
        
    </>
  );
});

export default React.memo(ChapterPage);
