import { View, Text, ScrollView, TouchableWithoutFeedback, BackHandler } from 'react-native'
import React, { useCallback, useEffect, useRef } from 'react'
import { debounce } from 'lodash'

import ChapterPage from '../chapters/ChapterPage'
import { savePageLayout } from './_reader'


const VerticalReader = ({currentManga, chapterPages}) => {

    const scrollRef = useRef(null)
    const pageLayout = useRef([])

    const renderItem = useCallback((item, index) => {
        return (
            <ChapterPage  
                key={index}
                pageUrl={item}
                currentManga={currentManga}
                onPageLoad={onPageLoad}
                pageNum={index}
            />
        )
    }, [])

    const debouncedSaveDataToCache = useCallback(debounce((async () => {
        console.log("called debounced func")
        await savePageLayout(currentManga.manga, currentManga.chapter, pageLayout.current)
    }), 500), []);

    const onPageLoad = useCallback((pageNum, pageHeight) => {
        pageLayout.current[pageNum] = pageHeight
        console.log(pageLayout.current)
        debouncedSaveDataToCache()
    }, [pageLayout])

    useEffect(() => {
        pageLayout.current = Array(chapterPages.length).fill(0)
        scrollRef.current.scrollTo({y: 500, animated: true})
    }, [])


    return (
        <ScrollView ref={scrollRef}>
            <TouchableWithoutFeedback onPress={()=>{console.log("tapped")}}>
            <View className="flex-1">
                {chapterPages.map((item, index) => renderItem(item, index))}
            </View>
            </TouchableWithoutFeedback>
        </ScrollView>
    )
}

export default VerticalReader