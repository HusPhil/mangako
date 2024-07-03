import { View, Text, ScrollView } from 'react-native'
import React, {useState, useRef, useEffect} from 'react'
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as backend from "./_manga_reader"


const MangaReaderScreen = () => {
    const {mangaUrl, currentChapterData } = useLocalSearchParams()
    
    const [chapterPages, setChapterPages] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const controllerRef = useRef(null)
    const parsedCurrentChapterData = useRef(JSON.parse(currentChapterData))

    const AsyncEffect = async () => {
        setIsLoading(true)

        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal

        const fetchedChapterPages = await backend.fetchData(mangaUrl, parsedCurrentChapterData.current.chapterUrl, signal)
        setChapterPages(setChapterPages.data)

        setIsLoading(false)
    }

    useEffect(() => {
        AsyncEffect()
        return () => {
            controllerRef.current.abort()
        }
    }, [])

    return (
        <SafeAreaView>
        <Text>{mangaUrl}</Text>
        <Text>{currentChapterData}</Text>
        </SafeAreaView>
    )
}

export default MangaReaderScreen