import { 
  View, Text, ActivityIndicator, 
  Alert, Dimensions, Button, 
  TouchableWithoutFeedback, 
  StatusBar, ScrollView 
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [chapterUrls, setChapterUrls] = useState([]);
  const [errorData, setErrorData] = useState(null);
  
  const currentChaper = useRef(JSON.parse(currentChapterData).chapterUrl)

  const AsyncEffect = async () => {
    setIsLoading(true);

    await NavigationBar.setVisibilityAsync('hidden');
    await NavigationBar.setBehaviorAsync('overlay-swipe')

    console.log("current chapter:", currentChaper.current)
    const fetchedChapterPageUrls = await fetchData(mangaLink, currentChaper.current)
    if(!fetchedChapterPageUrls.error) {
      setChapterUrls(fetchedChapterPageUrls.data)
    }
    setErrorData(fetchedChapterPageUrls.error)
    setIsLoading(false  );

  }

  const navigateToChapter = async (next) => {
    setIsLoading(true)
    const nextChapterPageUrls  = await chapterNavigator(mangaLink, currentChaper.current, next)
    
    if(nextChapterPageUrls.error) {
      
      alert(next ? "Next chapter not found." : "Previous chapter not found")
      setIsLoading(false)
      return
    }
    setChapterUrls(nextChapterPageUrls.data)
    currentChaper.current = nextChapterPageUrls.url
    setIsLoading(false)
  }

  useEffect(() => {
    AsyncEffect()
  }, [currentChaper]);

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
        // <ScrollView>
          <View className="h-full w-full justify-center items-center">
            <VerticalReaderMode 
              chapterUrls={chapterUrls}
              onPageChange={()=>{}}
              onReaderLoadPage={()=>{}}
              initialPageNum={6}
            />
                  
            {/* <Button title='Prev' onPress={async () => {await navigateToChapter(false)}}/>
          <Button title='Next' onPress={async() => {await navigateToChapter(true)}}/> */}
          </View>
          
          // </ScrollView>
        )}
    </View>

  );
};

export default MangaReaderScreen;
