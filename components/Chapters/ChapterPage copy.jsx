import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState, useMemo, useCallback } from 'react';
import { Image } from 'expo-image';
import { fetchData, getImageDimensions } from './_chapters';

const ChapterPage = forwardRef(({
    currentManga, imgSrc, 
    pageUrl, pageNum, 
    onPageLoad, onRetry
}, ref) => {
    const { height: screenHeight, width: screenWidth } = useMemo(() => Dimensions.get('screen'), []);


    useImperativeHandle(ref, () => ({
        getPageNum: () => pageNum,
    }), [pageNum]);

    const loadPageData = useCallback(async (signal) => {
        try {
            const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if (fetchedImgSrc.error) throw fetchedImgSrc.error;

            const imgSize = await getImageDimensions(fetchedImgSrc.data);
            const pageData = { imgUri: fetchedImgSrc.data, imgSize };
            
            onPageLoad(pageNum, pageData);
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
                        source={{ uri: imgSrc.imgUri }}
                        style={{
                            height: undefined, 
                            width: screenWidth, 
                            aspectRatio: imgSrc.imgSize.width / imgSrc.imgSize.height
                        }}
                        onLoad={(event) => {
                            const { height: pageHeight } = event.source;
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
        <View>
            {renderContent}
        </View>
    );
});

export default React.memo(ChapterPage);
