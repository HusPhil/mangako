import { View, Dimensions, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Image } from 'expo-image'

import { fetchData, getImageDimensions, tryLang } from './_chapters'

const ChapterPage = ({currentManga, pageUrl, pageNum, onPageLoad}) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    const [isLoading, setIsLoading] = useState(false)
    const [errorData, setErrorData] = useState(null)
    const [imgSrc, setImgSrc] = useState(null)

    const controllerRef = useRef(null)

    const AsyncEffect = async () => {
        setIsLoading(true)

        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal

        const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal)

        let imgSize;

        await getImageDimensions(fetchedImgSrc.data)
            .then(dimensions => {
                imgSize = dimensions
            })
            .catch(error => {
                setErrorData(error)
            })
        
        onPageLoad(pageNum, imgSize.height)
        setImgSrc({imgUri: fetchedImgSrc.data, imgSize})
        
        setIsLoading(false)
    }

    useEffect(() => {
        
        AsyncEffect()
        return () => {
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