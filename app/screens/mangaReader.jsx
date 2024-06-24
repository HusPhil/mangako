import { 
  View, Text, ActivityIndicator, 
  Alert, Dimensions, Button, 
  TouchableWithoutFeedback, 
  StatusBar, ScrollView 
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import ModalPopup from '../../components/ModalPopup';
import ChapterPage from '../../components/ChapterPage';
import colors from '../../constants/colors';
import { getChapterImageUrls } from '../../utils/MangakakalotClient';
import { VerticalReaderMode, HorizontalReaderMode } from '../../components/readerModes';
import * as NavigationBar from 'expo-navigation-bar';
import HorizontalRule from '../../components/HorizontalRule';
import DropDownList from '../../components/DropDownList';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MangaReaderScreen = () => {
  const { chapterUrl, chTitle } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);
  const [chapterUrls, setChapterUrls] = useState([]);
  const [readingMode, setReadingMode] = useState({ value: 'hor', index: 0 });
  const [errorData, setErrorData] = useState(null);
  const [toggleRetry, setToggleRetry] = useState('false')

  const fetchData = useCallback(async (url) => {
    try {
      const cacheKey = shorthash.unique(url);
      const cachedChapterPageUris = `${FileSystem.cacheDirectory}${cacheKey}`;
      let pageUrls = [];

      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris);

      if (fileInfo.exists) {
        const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris);
        pageUrls = JSON.parse(cachedPageData);
      } else {
        const requestedPageData = await getChapterImageUrls(url);
        pageUrls = requestedPageData;
        await FileSystem.writeAsStringAsync(cachedChapterPageUris, JSON.stringify(pageUrls));
      }

      setChapterUrls(pageUrls);
      setErrorData(null);  // Clear any previous errorData
    } catch (error) {
      setChapterUrls([]);
      setErrorData(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    setIsLoading(true);
    setChapterUrls([]);
    fetchData(currentChapterUrl);
  }, [currentChapterUrl, fetchData]);

  const clearCache = useCallback(async () => {
    try {
      const cacheKey = shorthash.unique(currentChapterUrl);
      const cachedImageUrlsFileUri = `${FileSystem.cacheDirectory}${cacheKey}`;
      const fileInfo = await FileSystem.getInfoAsync(cachedImageUrlsFileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachedImageUrlsFileUri);
      }

      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to delete', 'Cache already cleared');
      console.log(error);
    }
  }, [currentChapterUrl]);

  const handleShowModal = useCallback(() => {
    NavigationBar.setVisibilityAsync('hidden');
    if (!showModal) {
      StatusBar.setBackgroundColor(colors.secondary.DEFAULT);
    } else {
      StatusBar.setBackgroundColor('transparent');
    }
    setShowModal(!showModal);
  }, [showModal]);

  return (
    <View className="flex-1 bg-primary">
      <ModalPopup visible={showModal} handleClose={handleShowModal}>
        <View className="justify-start w-full">
          <Text numberOfLines={1} className="text-white font-pregular text-base text-center p-2 py-3">{chTitle}</Text>
        </View>
        <HorizontalRule />
        <View className="w-full">
          <DropDownList
            title={"Reading mode:"}
            otherContainerStyles={'rounded-md p-2 px-4  z-50 '}
            details={"hello world"}
            listItems={[
              {
                label: "Horizontal", value: "hor",
                desc: "Standard left-to-right viewing mode. Most commonly used for reading manhwas."
              },
              {
                label: "Horizontal (inverted)", value: "hor-inv",
                desc: "Reading direction is right-to-left. Most commonly used for reading mangas."
              },
              {
                label: "Vertical", value: "ver",
                desc: "Vertical top-to-bottom viewing mode. Perfect fit for reading manhuas."
              },
            ]}
            onValueChange={(data) => {
              setReadingMode(data);
            }}
            selectedIndex={readingMode.index}
          />
          <Button title='Retry' onPress={()=>{
            setToggleRetry(prev => !prev)
          }}/>
        </View>
      </ModalPopup>
      <View className="flex-1">
        {isLoading ? (
          <ActivityIndicator />
        ) : errorData ? (
          <View className="h-full w-full justify-center items-center">
            <Text className="text-white">Error: {errorData.message}</Text>
          </View>
        ) : (
          <View className="h-full w-full">
            {readingMode.value === "hor" ? (
              <HorizontalReaderMode chapterUrls={chapterUrls} onTap={handleShowModal} toggleRetry={toggleRetry}/>
            ) : readingMode.value === "hor-inv" ? (
              <HorizontalReaderMode chapterUrls={chapterUrls} onTap={handleShowModal} inverted />
            ) : readingMode.value === "ver" && (
              <VerticalReaderMode chapterUrls={chapterUrls} onTap={handleShowModal} />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;
