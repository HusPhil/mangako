import { View, Dimensions, ActivityIndicator, Text } from 'react-native'
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Image } from 'expo-image'

import { fetchData, getImageDimensions, tryLang } from './_chapters'

const ChapterPage = forwardRef(({currentManga, imgSrc, pageNum, onPageLoad}, ref) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    const imgSrcTest = useRef(null)

    useImperativeHandle(ref, () => ({
        getPageNum: () => pageNum,
        getImageSrc: () => {
            if(imgSrcTest.current) return imgSrcTest.current
            return "No image src available"
        },
        setImageSrc: (src) => imgSrcTest.current = src
    }));


    return (
        <View className="mt-[-1px]">
        {imgSrc ? (
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
                console.log(event.source.url)
            }}
        />
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