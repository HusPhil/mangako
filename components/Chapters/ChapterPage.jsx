import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native'
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Image } from 'expo-image'

import { fetchData, getImageDimensions, tryLang } from './_chapters'

const ChapterPage = forwardRef(({currentManga, imgSrc, pageUrl, pageNum, onPageLoad}, ref) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    const imgSrcRetry = useRef(null)
    const controllerRef = useRef(null)

    useImperativeHandle(ref, () => ({
        getPageNum: () => pageNum,
        // getImageSrc: () => {
        //     if(imgSrcTest.current) return imgSrcTest.current
        //     return "No image src available"
        // },
        // setImageSrc: (src) => imgSrcTest.current = src
    }));

    const handleRetry = useCallback(async () => {
        console.log("retry");
        try {
            imgSrc = undefined
            controllerRef.current = new AbortController();
            const signal = controllerRef.current.signal;
            const retryFetchedImage = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if(retryFetchedImage.error) throw retryFetchedImage.error
            const imgSize = await getImageDimensions(retryFetchedImage.data);

            imgSrc = { imgUri: retryFetchedImage.data, imgSize };
        } catch (error) {
            console.error("An error occured, retry again.");
            imgSrc = { imgUri: undefined, imgSize, error }
        }
    }, [currentManga, pageUrl]);

    useEffect(() => {
        console.log(imgSrc)
    }, [handleRetry])


    return (
        <View className="mt-[-1px]">
        {imgSrc ?  (
            !imgSrc.error ? (
                <Image
                    source={{uri: imgSrc.imgUri}}
                    style={{
                        height: undefined, 
                        width: screenWidth, 
                        aspectRatio: imgSrc.imgSize.width/imgSrc.imgSize.height
                    }}
                    onLoad={(event) => {
                        const { height: pageHeight } = event.source
                        onPageLoad(pageNum, pageHeight);
                        // console.log(event.source.url)
                    }}
                />  
            ) : (
                <View 
                    className="justify-center items-center bg-primary"
                    style={{height: screenHeight/2, width: screenWidth}}
                >
                    <Text className="font-pregular text-white">An error occured</Text>
                    <Button title="retry" onPress={handleRetry} />
                </View>
            )
        ) : (
            
            <View 
                className="justify-center items-center bg-primary"
                style={{height: screenHeight/2, width: screenWidth}}
            >
                <ActivityIndicator color={'white'} size={30} />
            </View>
        )}
        </View>
    )
})

export default ChapterPage