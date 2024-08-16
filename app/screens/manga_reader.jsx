import { View, Text, ActivityIndicator, TouchableOpacity, ToastAndroid } from 'react-native'
import React, {useRef, useEffect, useReducer, useCallback } from 'react'
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-simple-toast';
import { Feather } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { debounce } from 'lodash';
import Slider from '@react-native-community/slider';


import * as backend from "./_manga_reader"
import { CONFIG_READ_WRITE_MODE, readMangaConfigData, readMangaListItemConfig, saveMangaConfigData } from '../../services/Global';
import MangaReaderComponent from '../../components/manga_reader/MangaReaderComponent';
import DropDownList from '../../components/modal/DropdownList';
import ModalPopup from '../../components/modal/ModalPopup';
import HorizontalRule from '../../components/HorizontalRule';
import * as FileSystem from 'expo-file-system';

import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { readerReducer, INITIAL_STATE } from '../../redux/readerScreen/readerReducer';
import { READER_ACTIONS } from '../../redux/readerScreen/readerActions';
import colors from '../../constants/colors';

const MangaReaderScreen = () => {
    const {mangaUrl, currentChapterData, currentChapterIndex, isListedAsString } = useLocalSearchParams()
    const parsedCurrentChapterData = JSON.parse(currentChapterData)
    
    const [state, dispatch] = useReducer(readerReducer, INITIAL_STATE)

    const chapterDataRef = useRef(parsedCurrentChapterData)
    const chapterNumRef = useRef(parseInt(currentChapterIndex))
    const chapterFinishedref = useRef(false)
    const isListedRef = useRef(isListedAsString === "true")
    const longHeightWarned = useRef(false)
    const isMounted = useRef(true)
    const controllerRef = useRef(null)

    const AsyncEffect = useCallback(async () => {
        dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES})
        
        const listItemConfig = await readMangaListItemConfig(mangaUrl);
        dispatch({type: READER_ACTIONS.SET_IS_LISTED, payload: listItemConfig?.length > 0})
        isListedRef.current = listItemConfig?.length > 0

        const savedConfig = await readMangaConfigData(mangaUrl, chapterDataRef.current.chapterUrl, (listItemConfig?.length > 0))

        
        if(savedConfig) dispatch({type: READER_ACTIONS.LOAD_CONFIG, payload: {
            currentPage: savedConfig?.chapter?.currentPage || 0,
            readingModeIndex: savedConfig?.manga?.readingModeIndex || 0,
            scrollOffSetY: savedConfig?.chapter?.scrollOffSetY || 0,
            finished: savedConfig?.chapter?.finished,
            loadingRange: savedConfig?.manga?.loadingRange || 1,
        }})

        if(savedConfig?.manga?.readingStats) {
            const currentChapterReadingStatus = savedConfig.manga.readingStats[chapterDataRef.current.chapterUrl]; 
            dispatch({
                type:READER_ACTIONS.SET_STATUS_FINISHED, 
                payload: currentChapterReadingStatus ? currentChapterReadingStatus.finished : false
            })
            chapterFinishedref.current = currentChapterReadingStatus ? currentChapterReadingStatus.finished : false;
        }
        
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        try {
            const fetchedChapterPages = await backend.fetchData(
                mangaUrl, chapterDataRef.current.chapterUrl, 
                signal, (listItemConfig?.length > 0)
                );
            if(fetchedChapterPages.error) {
                console.log(fetchedChapterPages.error)
                throw fetchedChapterPages.error
            }
            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_SUCCESS, payload: fetchedChapterPages.data})
        } 
        catch (error) {
            console.log(error)
            router.back()
            Toast.show(
                `An error occured: ${error}`,
                Toast.LONG,
            );
            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_ERROR, payload: {error, chapterPages: []}})
            
        } 
        
    }, [])

    const saveLastViewedChapterPage = debounce(async (pageToSave) => {
        console.log("isListedRef.current sa saveLastKineme", isListedRef.current)
        await saveMangaConfigData(mangaUrl, chapterDataRef.current.chapterUrl, {"currentPage": pageToSave}, isListedRef.current)
      }, 500)

    useEffect(() => {
        AsyncEffect()
        return () => {
            isMounted.current = false
            controllerRef.current.abort()
            dispatch({type: READER_ACTIONS.EFFECT_CLEAN_UP})
        }
    }, [])

    const handleTap = useCallback((testData) => {
        dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
    }, [])

    const handleClearCache = useCallback(async () => {
        const pageFileName = "NO-PAGE-FILE"
        const pageMangaDir = getMangaDirectory(
            mangaUrl, chapterDataRef.current.chapterUrl, 
            "chapterPageImages", pageFileName,
            `${isListedRef.current ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
            )
        
        ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
        console.log("pageMangaDir.cachedFolderPath:", pageMangaDir.cachedFolderPath)
    
        await FileSystem.deleteAsync(pageMangaDir.cachedFolderPath)

        router.back()

        ToastAndroid.show(
            "Cache cleared!",
            ToastAndroid.SHORT
        )
    
      })

    const handlePageChange = useCallback(async (currentPage, readingStatus) => {
        console.log("isListed sa handlePgeChange", isListedRef.current)
        dispatch({ type: READER_ACTIONS.SET_CURRENT_PAGE, payload: currentPage });
        if (readingStatus?.finished && !chapterFinishedref.current) {
            await handleReadFinish()
            dispatch({type:READER_ACTIONS.SET_STATUS_FINISHED, payload: true})
            Toast.show('Finished! Tap to navigate chapters!');
            chapterFinishedref.current = true
        }
    
        saveLastViewedChapterPage(currentPage);
    
    }, [isListedRef.current])

    const handleChapterNavigation = async (navigationMode) => {
        try {
            const savedMangaConfigData = await readMangaConfigData(mangaUrl, CONFIG_READ_WRITE_MODE.MANGA_ONLY, isListedRef.current)

            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES})
            dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
            
    
            controllerRef.current =  new AbortController()
            const signal = controllerRef.current.signal
    
            const currentChapterPages = state.chapterPages
    
            const currentIndex = chapterNumRef.current
            const targetIndex = navigationMode === backend.CHAPTER_NAVIGATION.NEXT ? 
                currentIndex - 1 : currentIndex + 1
        
            const chapterNavigator = await backend.chapterNavigator(mangaUrl, targetIndex, signal)
    
            if(chapterNavigator.error) {
                dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_ERROR, payload: {chapterPages: currentChapterPages}})
                const alertMessage = navigationMode === backend.CHAPTER_NAVIGATION.NEXT ? "Next chapter no found." : "Previous chapter not found." 
                Toast.show(
                    alertMessage,
                    Toast.LONG,
                  );
                return
            }
    
            if(savedMangaConfigData?.manga?.readingStats) {
                const currentChapterReadingStatus = savedMangaConfigData.manga.readingStats[chapterNavigator.targetChapter.chapterUrl]; 
                dispatch({
                    type:READER_ACTIONS.SET_STATUS_FINISHED, 
                    payload: currentChapterReadingStatus ? currentChapterReadingStatus.finished : false
                })
                chapterFinishedref.current = currentChapterReadingStatus ? currentChapterReadingStatus.finished : false
            }
    
            dispatch({type: READER_ACTIONS.SET_CURRENT_PAGE, payload: 0})
            dispatch({type: READER_ACTIONS.GET_CHAPTER_PAGES_SUCCESS, payload: chapterNavigator.data})
            chapterDataRef.current = chapterNavigator.targetChapter
            chapterNumRef.current = targetIndex
    
        } catch (error) {
            console.error(error)
        }
    }

    const handleReadFinish = async () => {
        dispatch({type:READER_ACTIONS.SET_STATUS_FINISHED, payload: !state.finished})
        chapterFinishedref.current = !state.finished
        const savedMangaConfigData = await readMangaConfigData(mangaUrl, CONFIG_READ_WRITE_MODE.MANGA_ONLY, isListedRef.current)
        let newReadingStats;

        newReadingStats = {}
        
        if(savedMangaConfigData?.manga?.readingStats) {
            newReadingStats = savedMangaConfigData.manga.readingStats
        }
        
        newReadingStats[chapterDataRef.current.chapterUrl] = {finished: !state.finished}
        console.log("isListed sa handleReAdFInsig", isListedRef.current)
        await saveMangaConfigData(
            mangaUrl, 
            chapterDataRef.current.chapterUrl, 
            {readingStats: newReadingStats}, 
            isListedRef.current,
            CONFIG_READ_WRITE_MODE.MANGA_ONLY
        )

    }

    const handleDropDownValueChange = useCallback(async (data) => {
        dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})
        console.log("isListed sa handleDropDownValueChange", isListedRef.current)

        await saveMangaConfigData (
            mangaUrl, 
            chapterDataRef.current.chapterUrl, 
            {"readingModeIndex": backend.READER_MODES.indexOf(data)},
            isListedRef.current,
            CONFIG_READ_WRITE_MODE.MANGA_ONLY
        )
        dispatch({type: READER_ACTIONS.SET_READER_MODE, payload: data})
    }
    , [isListedRef.current])

    const handleSliderValueChange = useCallback(debounce(async (currentValue) => {
        dispatch({type: READER_ACTIONS.SET_LOADING_RANGE, payload: currentValue})
        console.log("isListed sa handleSliderValueChange", isListedRef.current)

        await saveMangaConfigData(
            mangaUrl, 
            chapterDataRef.current.chapterUrl, 
            {loadingRange: currentValue},
            isListedRef.current,
            CONFIG_READ_WRITE_MODE.MANGA_ONLY
        )
        console.log("currentValue", currentValue)

    }, [500]), [state.loadingRange, isListedRef.current])

    return (
        <View className="h-full bg-primary">
            <ModalPopup 
                visible={state.showModal} otherStyles={{backgroundColor: 'transparent',}}
                handleClose={() => {dispatch({type: READER_ACTIONS.SHOW_MODAL, payload: state.showModal})}}
            >
                <View className="h-full w-full justify-end items-center bg-transparent">
                    <View className="bg-secondary justify-end rounded-md p-1 px-2">
                        <TouchableOpacity onPress={handleReadFinish}>
                            <View className="justify-center items-center w-full flex-row ">
                                <Text numberOfLines={1} className="text-white font-pregular text-base text-center pr-1 py-3 flex-1 ">{chapterDataRef.current.chTitle}</Text>
                                {state.finished && <Feather name="check-circle" size={24} color="red" />}
                            </View>
                        </TouchableOpacity>

                        <HorizontalRule />
                    
                        <View className="w-full">
                            <DropDownList
                                title={"Reading mode:"}
                                otherContainerStyles={'rounded-md p-2 px-4  z-50 '}
                                listItems={backend.READER_MODES}
                                onValueChange={handleDropDownValueChange}
                                selectedIndex={backend.READER_MODES.indexOf(state.readingMode)}
                            />
                        </View>  

                        <View>
                            <View className="flex-row pl-4 items-center justify-between pt-2 ">
                                <Text className="font-pregular text-white text">Loading range:</Text>
                                <Slider
                                    style={{flex: 1}}
                                    value={state.loadingRange}
                                    minimumValue={1}
                                    maximumValue={10}
                                    step={1}
                                    thumbTintColor={colors.accent.DEFAULT}
                                    minimumTrackTintColor={colors.accent.DEFAULT}
                                    maximumTrackTintColor={colors.primary.DEFAULT}
                                    onValueChange={handleSliderValueChange}
                                    />  
                                <Text className="text-white font-pregular text-xs pr-4">{state.loadingRange}</Text>
                            </View>     
                            <Text className="text-white font-pregular text-xs mt-2 px-4">{"• " + backend.loadingRangeDesc}</Text>
                        </View>       
                    
                        <View className="flex-row justify-between m-2 my-3">
                            <View className="flex-row justify-between">
                                <TouchableOpacity className="py-1 px-3 justify-center items-center bg-accent rounded-md " onPress={async () => {
                                    await handleChapterNavigation(backend.CHAPTER_NAVIGATION.PREV)
                                }}>
                                    <AntDesign name="stepbackward" size={12} color="white" />
                                </TouchableOpacity>
                                
                                <TouchableOpacity className="py-1 px-3 justify-center items-center bg-accent rounded-md ml-2" onPress={async () => {
                                    await handleChapterNavigation(backend.CHAPTER_NAVIGATION.NEXT)
                                }}>
                                    <AntDesign name="stepforward" size={12} color="white" />
                                </TouchableOpacity> 
                            </View>

                            <TouchableOpacity className="py-1 px-3 bg-accent rounded-md flex-1 ml-4 " onPress={handleClearCache}>
                                <Text className="text-white font-pregular text-center">Clear cache</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            
          </ModalPopup>
            {!state.isLoading ? (
                !state.errorData ? (
                    <View key={state.loadingRange}>
                        {state.readingMode === backend.READER_MODES[0] && (
                            <MangaReaderComponent 
                                chapterPages={state.chapterPages}
                                loadingRange={state.loadingRange}
                                currentManga={{
                                    manga: mangaUrl,
                                    chapter: chapterDataRef.current.chapterUrl
                                }}
                                onTap={handleTap}
                                currentPage={state.currentPage}
                                onPageChange={handlePageChange}
                                isListed={isListedRef.current}
                                inverted={false}
                                horizontal={true}
                            />
                        )}

                        {state.readingMode === backend.READER_MODES[1] && (
                            <MangaReaderComponent 
                                chapterPages={state.chapterPages}
                                loadingRange={state.loadingRange}
                                currentManga={{
                                    manga: mangaUrl,
                                    chapter: chapterDataRef.current.chapterUrl
                                }}
                                onPageChange={handlePageChange}
                                isListed={isListedRef.current}
                                onTap={handleTap}
                                currentPage={state.currentPage}
                                inverted={true}
                                horizontal={true}
                            />
                        )}

                        {state.readingMode === backend.READER_MODES[2] && (
                            <MangaReaderComponent 
                                chapterPages={state.chapterPages}
                                loadingRange={state.loadingRange}
                                currentManga={{
                                    manga: mangaUrl,
                                    chapter: chapterDataRef.current.chapterUrl
                                }}
                                onPageChange={handlePageChange}
                                isListed={isListedRef.current}
                                onTap={handleTap}
                                currentPage={state.currentPage}
                                inverted={false}
                                horizontal={false}
                            />
                        )}
                        <View pointerEvents='none' className="bg-transparent absolute bottom-2 items-center w-full">
                            <Text className="font-pregular text-white text-xs"
                                style={{textShadowColor: "#000", textShadowRadius: 5,}}
                            >
                                {state.currentPage + 1}/{state.chapterPages.length}
                            </Text>
                        </View>
                    </View>
                    ) : (
                        <View className="h-full justify-center items-center">
                            <Text className="font-pregular text-white text-base textShadowColor texts">Something went wrong</Text>
                            <Text className="font-pregular text-white text-base">while loading the pages</Text>
                            <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">Exit and try again</Text>
                        </View>
                    )
            ) : (
                <View className="h-full justify-center">
                    <ActivityIndicator color={`white`} size='large' />
                </View>
            )}

        </View>
    )
}

export default React.memo(MangaReaderScreen)