import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Image } from 'expo-image';
import { fetchData } from './_chapters';

import { getImageDimensions } from './_chapters';

const ChapterPage = forwardRef(({
  currentManga, imgSrc, 
  pageUrl, pageNum, 
  onPageLoad, onRetry
}, ref) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
  const [pageImgSrc, setPageImgSrc] = useState(imgSrc);

  useImperativeHandle(ref, () => ({
    getPageNum: () => pageNum,
  }));

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadImage = async () => {
      try {
        if (imgSrc) {
            if(!pageImgSrc.fileExist) {
                const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal);
                if (fetchedImgSrc.error) throw fetchedImgSrc.error
                imgSize = await getImageDimensions(fetchedImgSrc.data)
                setPageImgSrc({imgUri: fetchedImgSrc.data, fileExist: true, imgSize});
            }
        }
      } catch (error) {
        console.log("Error loading image in chapterPage", error);
      }
    };

    loadImage();

    return () => {
      controller.abort();
    };
  }, [imgSrc, pageUrl]);

  return (
    <View className="mt-[-1px]" key={pageImgSrc}>
      {pageImgSrc?.fileExist ? (
        <Image
          source={{ uri: pageImgSrc.imgUri }}
          style={{
            height: undefined, 
            width: screenWidth, 
            aspectRatio: pageImgSrc.imgSize.width/pageImgSrc.imgSize.height
          }}
          onLoad={(event) => {
            const { height: pageHeight } = event.source;
            onPageLoad(pageNum, pageHeight);
          }}
          contentFit='scale'
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
  );
});

export default React.memo(ChapterPage);
