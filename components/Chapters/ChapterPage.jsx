import { View, Dimensions } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Image } from 'expo-image'

import { fetchData, tryLang } from './_chapters'

const ChapterPage = ({currentManga, pageUrl}) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    const [isLoading, setIsLoading] = useState(false)
    const [imgSrc, setImgSrc] = useState(null)

    const controllerRef = useRef(null)

    const AsyncEffect = async () => {
        setIsLoading(true)

        await tryLang(currentManga.manga)

        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal

        const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal)
        console.log(fetchedImgSrc.data)
        setImgSrc(fetchedImgSrc.data)
        
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
        <View>
        {!isLoading && imgSrc && (
            <Image
            source={{uri: imgSrc}}
            style={{height: undefined, width: screenWidth, aspectRatio: 1}}
        />
        )}
        </View>
    )
}

export default ChapterPage