import { View, TouchableWithoutFeedback, Button } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';


import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import { FlashList } from '@shopify/flash-list';

const VerticalReader = ({ currentManga, chapterPages }) => {
    const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
    const [errorData, setErrorData] = useState(null)

    const pagesRef = useRef([]);

    const isMounted = useRef(true);
    const contentLoaded = useRef(false);
    const controllerRef = useRef(new AbortController());
    const flashRef = useRef(null);
    const pageLayout = useRef([]);
    const prevPageNumOffset = useRef(0);

    const AsyncEffect = async () => {
        if (!isMounted.current) return;

        try {
            controllerRef.current = new AbortController()
            const signal = controllerRef.current.signal;
            const pageDataPromises = chapterPages.map(async (pageUrl, index) => {
                await loadPageImages(index, pageUrl, signal)
            });
            
            await Promise.allSettled(pageDataPromises)
            
            const savedPageLayout = await readPageLayout(currentManga.manga, currentManga.chapter);
            if (!savedPageLayout.error) pageLayout.current = savedPageLayout.data;

            console.log("Loaded page layout:", pageLayout.current)
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

    const renderItem = useCallback(({ item, index }) => (
        <ChapterPage
            ref={(page) => { pagesRef.current[index] = page;}}
            currentManga={currentManga}
            imgSrc={item}
            pageUrl={chapterPages[index]}
            pageNum={index}
            onPageLoad={handlePageChange}
            onRetry={handleRetry}
        />
    ), [currentManga, handlePageChange]);

    const loadPageImages = async (pageNum, pageUrl, signal) => {
        try {
            const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if (fetchedImgSrc.error) {
                setPageImages(prev => {
                    const newPageImages = [...prev];
                    newPageImages[pageNum] = { imgUri: undefined, imgSize, error: fetchedImgSrc.error };
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

    const handleRetry = useCallback(async (pageNum) => {
        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal;

        await loadPageImages(pageNum, chapterPages[pageNum], signal)
    }, [])

    const debouncedSaveDataToCache = useCallback(debounce(async () => {
        await savePageLayout(currentManga.manga, currentManga.chapter, pageLayout.current);
    }, 1000), [currentManga]);

    const handlePageChange = useCallback((pageNum, pageHeight) => {
        pageLayout.current[pageNum] = pageHeight;        
        debouncedSaveDataToCache();
    }, [debouncedSaveDataToCache]);

    const handleContentSizeChange = useCallback((contentHeight) => {
        console.log("status:", prevPageNumOffset.current, contentHeight);
        if (contentHeight > prevPageNumOffset.current) {
            prevPageNumOffset.current = scrollToPageNum(chapterPages.length - 1, pageLayout.current);
            flashRef.current.scrollToIndex({ index: chapterPages.length - 1, animated: true });
            // contentLoaded.current = true;
        }
    }, [chapterPages]);


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