import { View, Text } from 'react-native'
import React, {useRef, useEffect, useReducer } from 'react'
import { useLocalSearchParams } from 'expo-router';

import * as backend from "./_manga_reader"
import VerticalReader from '../../components/reader_mode/VerticalReader';
import HorizontalReader from '../../components/reader_mode/HorizontalReader';
import DropDownList from '../../components/modal/DropdownList';
import ModalPopup from '../../components/modal/ModalPopup';
import HorizontalRule from '../../components/HorizontalRule';

import { readerReducer, INITIAL_STATE } from '../../redux/readerScreen/readerReducer';
import { READER_ACTIONS } from '../../redux/readerScreen/readerActions';

const MangaReaderScreen = () => {
    const {mangaUrl, currentChapterData } = useLocalSearchParams()
    const parsedCurrentChapterData = JSON.parse(currentChapterData)

    const [state, dispatch] = useReducer(readerReducer, INITIAL_STATE)

    const isMounted = useRef(true)
    const controllerRef = useRef(null)

    const AsyncEffect = async () => {
        
        dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES})
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        try {
            const fetchedChapterPages = await backend.fetchData(mangaUrl, parsedCurrentChapterData.chapterUrl, signal);
            if(fetchedChapterPages.error) throw fetchedChapterPages.error
            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_SUCCESS, payload: fetchedChapterPages.data})
        } 
        catch (error) {
            if (signal.aborted) {
                console.log("Fetch aborted");
            } else {
                console.log("Error fetching chapter pages:", error);
            }
            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_ERROR})
        } 
        
    }

    useEffect(() => {
        AsyncEffect()
        return () => {
            isMounted.current = false
            controllerRef.current.abort()
            dispatch({type: READER_ACTIONS.EFFECT_CLEAN_UP})
        }
    }, [])

    return (
        <View className="h-full bg-primary">
            <ModalPopup visible={state.showModal} handleClose={() => {dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})}}>
                <View className="mx-4">
                    <View className="justify-start w-full">
                    <Text numberOfLines={1} className="text-white font-pregular text-base text-center p-2 py-3">{parsedCurrentChapterData.chTitle}</Text>
                    </View>
                    <HorizontalRule />
                    <View className="w-full">
                    <DropDownList
                        title={"Reading mode:"}
                        otherContainerStyles={'rounded-md p-2 px-4  z-50 '}
                        details={"hello world"}
                        listItems={backend.readerModeOptions}
                        onValueChange={(data) => {
                          dispatch({type: READER_ACTIONS.SET_READER_MODE, payload: data})
                        }}
                        selectedIndex={backend.readerModeOptions.indexOf(state.readingMode)}
                    />
                    </View>
                </View>
          </ModalPopup>
            {!state.isLoading && (
                <>
                {state.readingMode === backend.readerModeOptions[0] && (
                    <HorizontalReader 
                        chapterPages={state.chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.chapterUrl
                        }}
                        onTap={() => {
                            dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
                        }}
                    />
                )}

                {state.readingMode === backend.readerModeOptions[1] && (
                    <HorizontalReader 
                        chapterPages={state.chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.chapterUrl
                        }}
                        onTap={() => {
                            dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
                        }}
                        inverted
                    />
                )}

                {state.readingMode === backend.readerModeOptions[2] && (
                    <VerticalReader 
                        chapterPages={state.chapterPages}
                        currentManga={{
                            manga: mangaUrl,
                            chapter: parsedCurrentChapterData.chapterUrl
                        }}
                        onTap={() => {
                            dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
                        }}
                        inverted
                    />
                )}
                </>
                
            )}
        </View>
    )
}

export default MangaReaderScreen