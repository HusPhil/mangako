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
  const [pageImgSrc, setPageImgSrc] = useState(imgSrc);
  const [tick, setTick] = useState(0)
  const [aspectRatio, setAspectRatio] = useState(null)

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
    toggleRender: ({aspectRatio}) => {
        setTick(prev => prev + 1)
        setAspectRatio(aspectRatio)
    }
  }));

  return (
    <View>
        {false && (
            <View key={pageImgSrc}>
            {pageImgSrc?.fileExist ? (
              <Image
                source={{ uri: pageImgSrc.imgUri }}
                recyclingKey={imgSrc.imgUri}
                style={{
                  height: undefined, 
                  width: screenWidth, 
                  aspectRatio: pageImgSrc.imgSize.width/pageImgSrc.imgSize.height
                }}
                onLoad={(event) => {
                  const { height: pageHeight } = event.source;
                  onPageLoad(pageNum, pageHeight);
                }}
                allowDownscaling={false}
                contentFit='cover'
                placeholder={{uri: images.pageTest}}
                alt='Loading image'
              />
            ) : (
              <View 
                className="justify-center items-center bg-primary"
                style={{ height: screenHeight / 2, width: screenWidth }}
              >
                <ActivityIndicator color={'white'} size={30} />
              </View>
            )}
          </View>
        ) }

        {imgSrc ? (
            <View className="mt-[-1px]" key={tick}>
                {imgSrc ? (
                <Image
                    source={{ uri: imgSrc.imgUri }}
                    style={{
                    height: undefined, 
                    width: screenWidth, 
                    aspectRatio: aspectRatio ? aspectRatio : imgSrc.imgSize.width/imgSrc.imgSize.height
                    }}
                    onLoad={async (event) => {
                    const { width: pageWidth, height: pageHeight } = event.source;
                    onPageLoad(pageNum, pageHeight);
                    // const imgSize = await getImageDimensions(imgSrc.imgUri)
                    if(!vertical) setAspectRatio(pageWidth/pageHeight)
                    }}
                    allowDownscaling={false}
                contentFit='cover'
                placeholder={"loading the image yet"}
                />
                ) : (
                <View 
                    className="justify-center items-center bg-primary"
                    style={{ height: screenHeight / 2, width: screenWidth }}
                >
                    <ActivityIndicator color={'white'} size='large' />
                    <Text className="font-pregular text-white">Loading pages..</Text>
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
        
    </View>
  );
});

export default React.memo(ChapterPage);
