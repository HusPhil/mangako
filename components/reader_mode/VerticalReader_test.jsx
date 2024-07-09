import { View, TouchableWithoutFeedback, Button } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';


import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import { FlashList } from '@shopify/flash-list';

const VerticalReader = ({ currentManga, chapterPages }) => {
    const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
    const [visibleRange, setVisibleRange] = useState(3)
  
    const controllerRef = useRef(null)
    const isMounted = useRef(true);
  
    const AsyncEffect = async () => {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
    
      const hashedPagePaths = await Promise.all(chapterPages.map(async (pageUrl) => {
        const pageFileName = shorthash.unique(pageUrl);
        const cachedChapterPageImagesDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName);
        const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath)
  
        let imgSize = {width: 1, height: 1}
  
        if(fileInfo.exists) imgSize = await getImageDimensions(cachedChapterPageImagesDir.cachedFilePath)
        
        return {imgUri: cachedChapterPageImagesDir.cachedFilePath, fileExist: fileInfo.exists, imgSize};
      }));
    
      setPageImages(hashedPagePaths);
    };
    useEffect(() => {
  
        AsyncEffect();
  
        return () => {
          controllerRef.current.abort();
        };
    }, [currentManga]);
  
    const renderItem = useCallback((item, index) => {
      return (
        <View>
         <ChapterPage
              // ref={(page) => { pagesRef.current[index] = page;}}
              currentManga={currentManga}
              imgSrc={item}
              pageUrl={chapterPages[index]}
              pageNum={index}
              onPageLoad={()=>{}}
              onRetry={()=>{}}
          />
        </View>
      );
    }, [visibleRange]);
    const keyExtractor = useCallback((item, index) => {
      return ` ${item}-${index}`;
    }, []);


    return (
        <View className="h-full">
                <View className="flex-1 relative">
                    <FlashList
                        ref={flashRef}
                        data={pageImages}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        estimatedItemSize={200} 
                        initialScrollIndex={2}
                        // onContentSizeChange={(w,h) => {handleContentSizeChange(h)}}
                        />
                </View>
            <View className="absolute bg-white bottom-3 self-center">
                <Button title="log saved pagelayout" onPress={ async() => {
                     const savedPageLayout = await readPageLayout(currentManga.manga, currentManga.chapter);
                    console.log(savedPageLayout)
                }}/>
                {/* <Button title="get imgSrc" onPress={handleTestGetButton}/> */}
            </View>
        </View>
    );
};

export default VerticalReader;
