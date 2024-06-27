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


import {
  fetchData,
  chapterNavigator,
} from "./_mangaReader"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MangaReaderScreen = () => {
  const { currentChapterData, mangaLink } = useLocalSearchParams();
  
  const [currentPageNum, setCurrentPageNum] = useState(0)
  const [isLoading, setIsLoading] = useState(true);
  const [chapterUrls, setChapterUrls] = useState([]);
  const [errorData, setErrorData] = useState(null);
  
  const currentChapter = useRef(JSON.parse(currentChapterData).chapterUrl)

  const AsyncEffect = async () => {
    setIsLoading(true);

    await NavigationBar.setVisibilityAsync('hidden');
    await NavigationBar.setBehaviorAsync('overlay-swipe')

    console.log("current chapter:", currentChapter.current)
    const fetchedChapterPageUrls = await fetchData(mangaLink, currentChapter.current)
    if(!fetchedChapterPageUrls.error) {
      setChapterUrls(fetchedChapterPageUrls.data)
    }
    setErrorData(fetchedChapterPageUrls.error)
    setIsLoading(false  );

  }

  const navigateToChapter = async (next) => {
    setIsLoading(true)
    const nextChapterPageUrls  = await chapterNavigator(mangaLink, currentChapter.current, next)
    
    if(nextChapterPageUrls.error) {
      
      alert(next ? "Next chapter not found." : "Previous chapter not found")
      setIsLoading(false)
      return
    }
    setChapterUrls(nextChapterPageUrls.data)
    currentChapter.current = nextChapterPageUrls.url
    setIsLoading(false)
  }

  useEffect(() => {
    AsyncEffect()
  }, [currentChapter]);

  useEffect(() => {
    console.log(currentPageNum)
  }, [currentPageNum])

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
          <View className="h-full w-full justify-center items-center relative">
            <VerticalReaderMode 
              chapterUrls={chapterUrls}
              onReaderLoadPage={()=>{}}
              currentPageNum={2} 
              onPageChange={(index) => {setCurrentPageNum(index)}}
            />
                  
            {/* <Button title='Prev' onPress={async () => {await navigateToChapter(false)}}/>
          <Button title='Next' onPress={async() => {await navigateToChapter(true)}}/> */}
          </View>

          <View className="absolute bottom-0 w-full items-center">
            <Text className="text-white font-pregular">{currentPageNum+1}/{chapterUrls.length-1}</Text>
          </View>
          
        </View>
        )}
    </View>

  );
};

export default MangaReaderScreen;
