import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState, useMemo, useCallback } from 'react';
import { Image } from 'expo-image';
import { fetchData, getImageDimensions } from './_chapters';
import * as FileSystem from 'expo-file-system';

const ChapterPage = forwardRef(({
    currentManga, imgSrc, 
    pageUrl, pageNum, 
    onPageLoad, onRetry
}, ref) => {
    const { height: screenHeight, width: screenWidth } = useMemo(() => Dimensions.get('screen'), []);

    useImperativeHandle(ref, () => ({
        getPageNum: () => pageNum,
    }), [pageNum]);

    const [tick, setTick] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [renderCount, setRenderCount] = useState(0);

    const loadPageData = useCallback(async (signal) => {
        try {
            const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if (fetchedImgSrc.error) throw fetchedImgSrc.error;

            const imgSize = await getImageDimensions(fetchedImgSrc.data);
            const pageData = { imgUri: fetchedImgSrc.data, imgSize };
            
            setImageLoaded(true);
        } catch (error) {
            console.log(error);
        }
    }, [currentManga, pageUrl, pageNum, onPageLoad]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        
        loadPageData(signal);

        return () => {
            controller.abort();
        };
    }, [loadPageData]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (true) {
                setTick(prev => prev + 1);
                setRenderCount(prev => prev + 1);
                console.log(pageNum);
            } else if (renderCount >= 3) {
                clearInterval(interval); // Stop interval after 3 renders
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pageNum, imageLoaded, renderCount]);

    const handleRetry = useCallback(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        
        loadPageData(signal);
    }, [loadPageData]);

    const renderContent = useMemo(() => {
        if (imgSrc) {
            if (!imgSrc.error) {
                return (
                    <Image
                        source={imgSrc}
                        style={{
                            height: undefined, 
                            width: screenWidth, 
                            aspectRatio: 1
                        }}
                        onLoad={async (event) => {
                            const loadedDimension = await getImageDimensions(event.source.url);
                            console.log(loadedDimension);
                        }}
                        contentFit='scale'
                    />
                );
            } else {
                return (
                    <View 
                        className="justify-center items-center bg-primary"
                        style={{ height: screenHeight / 2, width: screenWidth }}
                    >
                        <Text className="font-pregular text-white">An error occurred</Text>
                        <Button title="Retry" onPress={handleRetry} />
                    </View>
                );
            }
        } else {
            return (
                <View 
                    className="justify-center items-center bg-primary"
                    style={{ height: screenHeight / 2, width: screenWidth }}
                >
                    <ActivityIndicator color={'white'} size={30} />
                </View>
            );
        }
    }, [imgSrc, screenHeight, screenWidth, handleRetry]);

    return ( 
        <View key={tick}>
            {renderContent}
        </View>
    );
});

export default React.memo(ChapterPage);
