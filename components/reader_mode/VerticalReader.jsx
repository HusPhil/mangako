import { View, TouchableWithoutFeedback, Button } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import { FlashList } from '@shopify/flash-list';

const VerticalReader = ({ currentManga, chapterPages }) => {
    const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));

    const pagesRef = useRef([]);

    const isMounted = useRef(true);
    const contentLoaded = useRef(false);
    const controllerRef = useRef(new AbortController());
    const flashRef = useRef(null);
    const pageLayout = useRef([]);
    const prevPageNumOffset = useRef(0);

    const renderItem = useCallback(({ item, index }) => (
        <ChapterPage
            key={index}
            ref={(page) => { pagesRef.current[index] = page;}}
            imgSrc={item}
            pageUrl={chapterPages[index]}
            currentManga={currentManga}
            onPageLoad={onPageLoad}
            pageNum={index}
            onRetry={handleRetry}
        />
    ), [currentManga, onPageLoad]);

    const handleRetry = async (pageNum) => {
        console.log("handle retry from parent called")
        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal;

        try {
            const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, chapterPages[pageNum], signal);
            if (fetchedImgSrc.error) {
                setPageImages(prev => {
                    const newPageImages = [...prev];
                    newPageImages[pageNum] = { imgUri: "N/A", imgSize, error: fetchedImgSrc.error };
                    return newPageImages;
                });
                throw fetchedImgSrc.error
            };

            const imgSize = await getImageDimensions(fetchedImgSrc.data);
            if (isMounted.current) {
                setPageImages(prev => {
                    const newPageImages = [...prev];
                    newPageImages[pageNum] = { imgUri: fetchedImgSrc.data, imgSize };
                    return newPageImages;
                });
            }
        } catch (error) {
            console.log("Error loading pages:", error);
        }
    }

    const debouncedSaveDataToCache = useCallback(debounce(async () => {
        console.log("called debounced func");
        await savePageLayout(currentManga.manga, currentManga.chapter, pageLayout.current);
    }, 500), [currentManga]);

    const onPageLoad = useCallback((pageNum, pageHeight) => {
        if (pageLayout.current[pageNum] !== -1 && isMounted.current) return;
        pageLayout.current[pageNum] = pageHeight;
        debouncedSaveDataToCache();
    }, [debouncedSaveDataToCache]);

    const AsyncEffect = async () => {
        if (!isMounted.current) return;

        try {
            controllerRef.current = new AbortController()
            const signal = controllerRef.current.signal;
            const pageDataPromises = chapterPages.map(async (pageUrl, index) => {
                try {
                    const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
                    if (fetchedImgSrc.error) {
                        setPageImages(prev => {
                            const newPageImages = [...prev];
                            newPageImages[index] = { imgUri: undefined, imgSize, error: fetchedImgSrc.error };
                            return newPageImages;
                        });
                        throw fetchedImgSrc.error
                    };

                    const imgSize = await getImageDimensions(fetchedImgSrc.data);
                    if (isMounted.current) {
                        setPageImages(prev => {
                            const newPageImages = [...prev];
                            newPageImages[index] = { imgUri: fetchedImgSrc.data, imgSize };
                            return newPageImages;
                        });
                    }
                } catch (error) {
                    console.log("Error loading pages:", error);
                }
            });

            await Promise.allSettled(pageDataPromises)
            
            const savedPageLayout = await readPageLayout(currentManga.manga, currentManga.chapter);
            if (!savedPageLayout.error) pageLayout.current = savedPageLayout.data;

            console.log(savePageLayout.data)
        } catch (error) {
            setErrorData(error);
        }
    };

    useEffect(() => {
        pageLayout.current = Array(chapterPages.length).fill(-1);
        AsyncEffect();

        return () => {
            isMounted.current = false;
            controllerRef.current.abort();
        };
    }, [chapterPages, currentManga]);
    

    const handleContentSizeChange = useCallback((contentHeight) => {
        console.log("status:", prevPageNumOffset.current, contentHeight);
        if (contentHeight > prevPageNumOffset.current && !contentLoaded.current) {
            prevPageNumOffset.current = scrollToPageNum(chapterPages.length - 1, pageLayout.current);
            flashRef.current.scrollToIndex({ index: chapterPages.length - 1, animated: true });
            contentLoaded.current = true;
        }
    }, [chapterPages]);

    const handleTestSetButton = () => {
        for (let index = 0; index < 5; index++) {
          pagesRef.current[index].setImageSrc(`imgsrc: ${index}`)
        }
      }
    
      const handleTestGetButton = () => {
        for (let index = 0; index < 5; index++) {
          console.log(pagesRef.current[index].getImageSrc())
        }
      }

    return (
        <View className="h-full">
                <View className="flex-1 relative">
                    <FlashList
                        ref={flashRef}
                        data={pageImages}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        estimatedItemSize={200} 
                        />
                </View>
            <View className="absolute bg-white bottom-3 self-center">
                <Button title="set imgSrc" onPress={handleTestSetButton}/>
                <Button title="get imgSrc" onPress={handleTestGetButton}/>
            </View>
        </View>
    );
};

export default VerticalReader;
