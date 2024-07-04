import { View, Dimensions, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Image } from 'expo-image'

import { fetchData, getImageDimensions, tryLang } from './_chapters'

const ChapterPage = ({currentManga, pageUrl, pageNum, onPageLoad}) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    const [isLoading, setIsLoading] = useState(false)
    const [errorData, setErrorData] = useState(null)
    const [imgSrc, setImgSrc] = useState(null)
    

    const isMounted = useRef(true)
    const controllerRef = useRef(null)

    const AsyncEffect = async () => {
        setIsLoading(true);
    
        if (!isMounted.current) return;
    
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;
    
        try {
            const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if(fetchedImgSrc.error) throw fetchedImgSrc.error
            
            let imgSize;
            
            try {
                imgSize = await getImageDimensions(fetchedImgSrc.data);
            } catch (error) {
                throw error;
            }
            
            
            setImgSrc({ imgUri: fetchedImgSrc.data, imgSize });
        } catch (error) {
            setErrorData(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        
        AsyncEffect()
        return () => {
            isMounted.current = false
            controllerRef.current.abort()
            setImgSrc(null)
        }
    }, [])





    return (
        <View className="mt-[-1px]">
        {!isLoading && imgSrc ? (
            <Image
                source={{uri: imgSrc.imgUri}}
                style={{
                    height: undefined, 
                    width: screenWidth, 
                    aspectRatio: imgSrc.imgSize.width/imgSrc.imgSize.height
                }}
                onLoad={(event) => {
                    console.log("hello world the image has been loaded!")
                    const { height: pageHeight } = event
                    onPageLoad(pageNum, pageHeight);
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
}

export default ChapterPage