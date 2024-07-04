import { View, ScrollView, TouchableWithoutFeedback } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { debounce } from 'lodash'

import ChapterPage from '../chapters/ChapterPage'
import { savePageLayout, readPageLayout, scrollToPageNum } from './_reader'


const VerticalReader = ({currentManga, chapterPages}) => {
    const [contentLoaded, setContentLoaded] = useState(false)

    const isMounted = useRef(true)
    const scrollRef = useRef(null)
    const pageLayout = useRef([])

    const prevPageNumOffset = useRef(0)


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
        // if(pageLayout.current[pageNum] != -1 && isMounted.current) return
        console.log(pageLayout.current)
        pageLayout.current[pageNum] = pageHeight
        debouncedSaveDataToCache()
    }, [pageLayout])

    const AsyncEffect = async () => {
        if(!isMounted.current) return
        const savedPageLayout = await readPageLayout(currentManga.manga, currentManga.chapter)
        if(!savedPageLayout.error) pageLayout.current = savedPageLayout.data

        

         
    } 

    useEffect(() => {
        pageLayout.current = Array(chapterPages.length).fill(-1)
        AsyncEffect()

        return () => {
            isMounted.current = false
        }

    }, [isMounted])

    const handleContentSizeChange = useCallback((contentHeight) => {
        console.log("status:", prevPageNumOffset.current, contentHeight)
        if (contentHeight > prevPageNumOffset.current && !contentLoaded) {
            scrollRef.current.scrollTo({ y: prevPageNumOffset.current, animated: true })
            setContentLoaded(true)
        }
    }, [contentLoaded])

    useEffect(() => {
        prevPageNumOffset.current = scrollToPageNum(chapterPages.length - 1, pageLayout.current)
    }, [contentLoaded, chapterPages.length])



    return (
        <ScrollView ref={scrollRef}
            onContentSizeChange={(width, height) => {
                handleContentSizeChange(height)
            }}
        >
            {chapterPages && (
                <TouchableWithoutFeedback onPress={()=>{console.log("tapped")}}>
                <View className="flex-1">
                    {chapterPages.map((item, index) => renderItem(item, index))}
                </View>
                </TouchableWithoutFeedback>
            )}
        </ScrollView>
    )
}

export default VerticalReader