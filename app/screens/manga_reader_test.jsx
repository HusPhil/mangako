import { View, Text, Button } from 'react-native'
import React, {useState, useRef, useEffect, useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router';

import * as backend from "./_manga_reader"
import VerticalReader from '../../components/reader_mode/VerticalReader';
import HorizontalReader from '../../components/reader_mode/HorizontalReader';
import DropDownList from '../../components/modal/DropdownList';
import ModalPopup from '../../components/modal/ModalPopup';
import HorizontalRule from '../../components/HorizontalRule';


const MangaReaderScreen = () => {
    const {mangaUrl, currentChapterData } = useLocalSearchParams()
    
    const [chapterPages, setChapterPages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [errorData, setErrorData] = useState(null)

    const [showModal, setShowModal] = useState(false)
    const [readingMode, setReadingMode] = useState(backend.readerModeOptions['2'])

    const isMounted = useRef(true)
    const controllerRef = useRef(null)
    const parsedCurrentChapterData = useRef(JSON.parse(currentChapterData))

    const AsyncEffect = async () => {
        
        setIsLoading(true);

        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        try {
            const fetchedChapterPages = await backend.fetchData(mangaUrl, parsedCurrentChapterData.current.chapterUrl, signal);
            setChapterPages(fetchedChapterPages.data);
        } 
        catch (error) {
            if (signal.aborted) {
                console.log("Fetch aborted");
            } else {
                console.log("Error fetching chapter pages:", error);
            }
            setChapterPages([])
            setErrorData(error)
        } 
        finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        AsyncEffect()
        return () => {
            isMounted.current = false
            controllerRef.current.abort()
            setChapterPages([])
        }
    }, [])

    const handleShowModal = useCallback(() => {
        setShowModal(prev => !prev);
      }, []);

    return (
        <View className="h-full bg-primary">
            <ModalPopup visible={showModal} handleClose={handleShowModal}>
                <View className="mx-4">
                    <View className="justify-start w-full">
                    <Text numberOfLines={1} className="text-white font-pregular text-base text-center p-2 py-3">{parsedCurrentChapterData.current.chTitle}</Text>
                    </View>
                    <HorizontalRule />
                    <View className="w-full">
                    <DropDownList
                        title={"Reading mode:"}
                        otherContainerStyles={'rounded-md p-2 px-4  z-50 '}
                        details={"hello world"}
                        listItems={backend.readerModeOptions}
                        onValueChange={(data) => {
                          setReadingMode(data);
                        }}
                        selectedIndex={backend.readerModeOptions.indexOf(readingMode)}
                    />
                    </View>
                </View>
          </ModalPopup>
            {!isLoading && (
                <>
                {readingMode === backend.readerModeOptions[0] && (
                    <HorizontalReader 
                        chapterPages={chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.current.chapterUrl
                        }}
                        onTap={handleShowModal}
                    />
                )}

                {readingMode === backend.readerModeOptions[1] && (
                    <HorizontalReader 
                        chapterPages={chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.current.chapterUrl
                        }}
                        onTap={handleShowModal}
                        inverted
                    />
                )}

                {readingMode === backend.readerModeOptions[2] && (
                    <VerticalReader 
                        chapterPages={chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.current.chapterUrl
                        }}
                        onTap={handleShowModal}
                        inverted
                    />
                )}
                </>
                
            )}
        </View>
    )
}

export default MangaReaderScreen