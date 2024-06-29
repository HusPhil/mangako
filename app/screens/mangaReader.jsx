import { 
  View, Text, ActivityIndicator, 
  Alert, Dimensions, Button, 
  TouchableWithoutFeedback, 
  StatusBar, ScrollView 
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef,  } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import ModalPopup from '../../components/ModalPopup';
import colors from '../../constants/colors';
import { VerticalReaderMode, HorizontalReaderMode } from '../../components/readerModes';
import * as NavigationBar from 'expo-navigation-bar';
import HorizontalRule from '../../components/HorizontalRule';
import DropDownList from '../../components/DropDownList';

import * as backend from "./_mangaReader"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MangaReaderScreen = () => {
  const { currentChapterData, mangaLink } = useLocalSearchParams();
  
  const [currentPageNum, setCurrentPageNum] = useState(0)
  const [isLoading, setIsLoading] = useState(true);
  const [chapterUrls, setChapterUrls] = useState([]);
  const [errorData, setErrorData] = useState(null);
  const [showModal, setShowModal] = useState(false)
  const [readingMode, setReadingMode] = useState(backend.readerModeOptions['2'])
  
  const currentChapter = useRef(JSON.parse(currentChapterData).chapterUrl)
  const readerModeRef = useRef(null)

  const AsyncEffect = async () => {
    setIsLoading(true);

    await NavigationBar.setVisibilityAsync('hidden');
    await NavigationBar.setBehaviorAsync('overlay-swipe')
    
    const lastSavePage = await backend.readMangaConfigData(mangaLink, currentChapter.current)
    setCurrentPageNum(lastSavePage ? lastSavePage.currentPage : 0)
    
    const fetchedChapterPageUrls = await backend.fetchData(mangaLink, currentChapter.current)
    if(!fetchedChapterPageUrls.error) {
      setChapterUrls(fetchedChapterPageUrls.data)
    }
    setErrorData(fetchedChapterPageUrls.error)
    setIsLoading(false  );

  }

  const navigateToChapter = async (next) => {
    setIsLoading(true)
    const nextChapterPageUrls  = await backend.chapterNavigator(mangaLink, currentChapter.current, next)
    
    if(nextChapterPageUrls.error) {
      
      alert(next ? "Next chapter not found." : "Previous chapter not found")
      setIsLoading(false)
      return
    }
    setChapterUrls(nextChapterPageUrls.data)
    currentChapter.current = nextChapterPageUrls.url
    setIsLoading(false)
  }

  const handleShowModal = useCallback(() => {
    NavigationBar.setVisibilityAsync('hidden');
    if (!showModal) {
      StatusBar.setBackgroundColor(colors.secondary.DEFAULT);
    } else {
      StatusBar.setBackgroundColor('transparent');
    }
    setShowModal(!showModal);
  }, [showModal]);

  useEffect(() => {
    AsyncEffect()
  }, [currentChapter]);

  return (

    <View className="flex-1 bg-primary">
        {isLoading ? (
          <View className="h-full w-full justify-center items-center">
            <ActivityIndicator />
          </View>
        ) : errorData ? (
          <View className="h-full w-full justify-center items-center">
            <Text className="text-white">Error: {errorData.message}</Text>
          </View>
        ) : (
        <View>
          <ModalPopup visible={showModal} handleClose={handleShowModal}>
            <View className="justify-start w-full">
              <Text numberOfLines={1} className="text-white font-pregular text-base text-center p-2 py-3">{JSON.parse(currentChapterData).chTitle}</Text>
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
              <Button title='Retry' onPress={async ()=>{
                readerModeRef.current.retryFetch()
                console.log(await backend.readItemLayout(mangaLink, currentChapter.current)) // prints {"_h": 0, "_i": 0, "_j": null, "_k": null}
                // console.log(await backend.readMangaConfigData(mangaLink, currentChapter.current)) // prints {"_h": 0, "_i": 0, "_j": null, "_k": null}
              }}/>
              <Button title='Save' onPress={()=>{
                // backend.saveMangaConfigData(mangaLink, currentChapter.current, {currentPage: 4, finished: true, extraData: "another data"})
                backend.saveMangaConfigData(mangaLink, currentChapter.current, {finished: false,})
              }}/>
              <Button title='Delete' onPress={()=>{
                backend.deleteConfigData(mangaLink, currentChapter.current, 'layout')
              }}/>
            </View>
          </ModalPopup>
          <View className="h-full w-full justify-center items-center relative">
            
            {readingMode.value === "hor" ? (
              <HorizontalReaderMode 
                ref={readerModeRef}
                currentPageNum={currentPageNum}
                chapterUrls={chapterUrls} 
                onReaderLoadPage={()=>{}}
                onPageChange={(index) => {
                  backend.saveMangaConfigData(mangaLink, currentChapter.current, {currentPage: index})
                  setCurrentPageNum(index)
                }}
                onTap={handleShowModal} 
                />
            ) : readingMode.value === "hor-inv" ? (
              <HorizontalReaderMode 
                ref={readerModeRef}
                currentPageNum={currentPageNum}
                chapterUrls={chapterUrls}
                onReaderLoadPage={()=>{}}
                onPageChange={(index) => {
                  backend.saveMangaConfigData(mangaLink, currentChapter.current, {currentPage: index})
                  setCurrentPageNum(index)
                }}
                onTap={handleShowModal} 
                inverted
                />
            ) : readingMode.value === "ver" && (
              <VerticalReaderMode 
                ref={readerModeRef}
                chapterUrls={chapterUrls}
                currentManga={{manga: mangaLink, chapter: currentChapter.current}}
                onReaderLoadPage={()=>{}}
                onPageChange={(index) => {
                  backend.saveMangaConfigData(mangaLink, currentChapter.current, {currentPage: index})
                  setCurrentPageNum(index)
                }}
                initialScrollIndex={currentPageNum}
                onTap={handleShowModal}
            />
            )}
                  
            {/* <Button title='Prev' onPress={async () => {await navigateToChapter(false)}}/>
          <Button title='Next' onPress={async() => {await navigateToChapter(true)}}/> */}
          </View>

          <View className="absolute bottom-0 w-full items-center">
            <Text className="text-white font-pregular">{currentPageNum+1}/{chapterUrls.length}</Text>
          </View>
          
        </View>
        )}
    </View>

  );
};

export default MangaReaderScreen;
