import { View, TouchableWithoutFeedback, Button, FlatList, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';


import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import {Gallery} from 'react-native-zoom-toolkit';

const HorizontalReader = ({ currentManga, chapterPages }) => {
    const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill('loading'));
    const [visiblePages, setVisiblePages] = useState([])
    const [errorData, setErrorData] = useState(null)

    const pagesRef = useRef([]);
    const [pageRange, setPageRange] = useState({start: 0, end: 3})

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

            const savedPageLayout = await readPageLayout(currentManga.manga, currentManga.chapter);
            if (!savedPageLayout.error) pageLayout.current = savedPageLayout.data;

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
    }, []);

    const renderItem = useCallback((item, index) => {
        return (
          <View>
           <ChapterPage
                currentManga={currentManga}
                pageUrl={chapterPages[index]}
                pageNum={index}
                onPageLoad={(pageNum, pageImgSrc, ) => {
                    setPageImages(prev => {
                        const newPageImages = [...prev];
                        newPageImages[pageNum] = pageImgSrc;
                        return newPageImages;
                    });
                }}
                onRetry={() => {}}
                autoloadData
            />
          </View>
        );
      }, []);

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

    const keyExtractor = useCallback((item, index) => {
        return `${item}-${index}`;
      }, []);


    return (
          <View className="flex-1">
                <Gallery
                data={pageImages}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onTap={()=>{console.log("gallery pressed")}}
                onEndReached={()=>{
                    console.log("end reached")
                }}
                onEndReachedThreshold={0.5}
                />
          </View>
    
    );
};

export default HorizontalReader;
