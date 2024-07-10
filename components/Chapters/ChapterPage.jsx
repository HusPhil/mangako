import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { fetchData } from './_chapters';

import { getImageDimensions } from './_chapters';
import * as FileSystem from 'expo-file-system'
import images from "../../constants/images"


const ChapterPage = forwardRef(({
  currentManga, imgSrc, 
  pageUrl, pageNum, 
  onPageLoad, onRetry,
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
  })

  return (
    <>
        {imgSrc ? (
            <View className="mt-[-1px]" key={tick}>
                <Image
                    source={{ uri: imgSrc.imgUri }}
                    style={{
                    height: undefined, 
                    width: screenWidth, 
                    aspectRatio: aspectRatio ? aspectRatio : imgSrc.imgSize.width/imgSrc.imgSize.height,
                    position: 'relative'
                    }}
                    onLoad={async (event) => {
                    const { width: pageWidth, height: pageHeight } = event.source;
                    onPageLoad(pageNum, pageHeight);
                    if(horizontal) setAspectRatio(pageWidth/pageHeight)
                    }}
                    allowDownscaling={false}
                    contentFit='cover'
                    placeholder={"loading the image yet"}
                />
                {horizontal && tick >= 0 && (
                  <View 
                      className="h-full w-full justify-center items-center bg-primary absolute -z-50"
                  >
                      <ActivityIndicator color={'white'} size='large' />
                  </View>
                )}
                
            </View>
        ) : (
                <View 
                    className="justify-center items-center bg-primary"
                    style={{ height: screenHeight / 2, width: screenWidth }}
                >
                    <ActivityIndicator color={'white'} size='large' />
                    <Text className="font-pregular text-white">Loading page: {pageNum + 1}</Text>
                </View>
        )}
        
    </>
  );
});

export default React.memo(ChapterPage);
