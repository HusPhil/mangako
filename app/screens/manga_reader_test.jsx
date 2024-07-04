import { View, Text, ScrollView, Image } from 'react-native'
import React, {useState, useRef, useEffect} from 'react'
import { useLocalSearchParams } from 'expo-router';

import * as backend from "./_manga_reader"
import VerticalReader from '../../components/reader_mode/VerticalReader';


const MangaReaderScreen = () => {
    const {mangaUrl, currentChapterData } = useLocalSearchParams()
    
    const [chapterPages, setChapterPages] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const controllerRef = useRef(null)
    const parsedCurrentChapterData = useRef(JSON.parse(currentChapterData))

    const AsyncEffect = async () => {
        setIsLoading(true)

        controllerRef.current = new AbortController()
        const signal = controllerRef.current.signal

        const fetchedChapterPages = await backend.fetchData(mangaUrl, parsedCurrentChapterData.current.chapterUrl, signal)
        setChapterPages(fetchedChapterPages.data)

        setIsLoading(false)
    }

    useEffect(() => {
        AsyncEffect()
        return () => {
            controllerRef.current.abort()
            setChapterPages([])
        }
    }, [])

    return (
        <View className="h-full">
            {!isLoading && (
                <VerticalReader 
                    chapterPages={chapterPages}
                    currentManga={{
                        manga: mangaUrl,
                        chapter: parsedCurrentChapterData.current.chapterUrl
                    }}
                />
            )}
        </View>
    )
}

export default MangaReaderScreen