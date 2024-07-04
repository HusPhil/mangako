import { View, Text, ScrollView } from 'react-native'
import React, {useState, useRef, useEffect} from 'react'
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as backend from "./_manga_reader"
import ChapterPage from '../../components/chapters/ChapterPage';


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
        <ScrollView>
            {!isLoading && (
                chapterPages.map((item, index) => {
                    return (
                        <ChapterPage  
                        key={index}
                            pageUrl={item}
                            currentManga={{
                                manga: mangaUrl,
                                chapter: parsedCurrentChapterData.current.chapterUrl
                            }}
                        />
                    )
                })
            )}
        </ScrollView>
    )
}

export default MangaReaderScreen