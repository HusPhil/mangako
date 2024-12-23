import { View, Text, ActivityIndicator, StatusBar, BackHandler, TouchableOpacity, ToastAndroid } from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert } from 'react-native';
import _ from 'lodash';

import ChapterList from '../../components/Chapters/ChapterList';
import MangaHeader from '../../components/manga_info/MangaHeader';
import Accordion from '../../components/Accordion';
import HorizontalRule from '../../components/HorizontalRule';

import * as backend from "./_manga_info";
import { readMangaListItemConfig, readSavedMangaList, saveMangaList } from '../../services/Global';
import colors from '../../constants/colors';
import { prev } from 'cheerio/lib/api/traversing';

const MangaInfoScreen = () => {
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = useLocalSearchParams();;
  const [mangaInfo, setMangaInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabsListed, setTabsListed] = useState([])
  const [errorData, setErrorData] = useState(null);
  const [lastReadChapterIndex, setLastReadChapterIndex] = useState(null);
  const [numberOfReadChapters, setNumberOfReadChapters] = useState(0);

  const controllerRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();
  const navigation = useNavigation();
  const selectedChapters = useRef([])

  const handleBackPress = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    router.back();
    return true;
  };

  const handleRefresh = async () => {
    setIsLoading(true)
    const isListed = tabsListed?.length > 0

    await backend.deleteSavedMangaInfo(mangaUrl, isListed)
    await AsyncEffect()
    setIsLoading(false)
  } 

  const handleClearMangaCache = () => {
    Alert.alert(
      'Clearing manga data',
      'All the saved data on this manga will be deleted, do you still wish to proceed?',
      [
        
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const mangaDir = shorthash.unique(mangaUrl)
              const mangaCacheDir = `${FileSystem.cacheDirectory}${mangaDir}`
              const mangaDocsDir = `${FileSystem.documentDirectory}${mangaDir}`

              const mangaCacheInfo = await FileSystem.getInfoAsync(mangaCacheDir)
              const mangaDocsInfo = await FileSystem.getInfoAsync(mangaDocsDir)

              
              await removeMangaFromMangaList()


                if(mangaCacheInfo.exists) {
                  await FileSystem.deleteAsync(mangaCacheInfo.uri)
                }
                if(mangaDocsInfo.exists) {
                  await FileSystem.deleteAsync(mangaDocsInfo.uri)
                }
                navigation.goBack();
                ToastAndroid.show(
                  'Manga data cleared',
                  ToastAndroid.SHORT
                )
            } catch (error) {
              ToastAndroid.show(
                'Clearing the manga data failed',
                ToastAndroid.SHORT
              )
              console.error(error)
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  }

  const removeMangaFromMangaList = async () => {
    const listItemConfig = await readMangaListItemConfig(mangaUrl);
    const newMangaListToSave = await readSavedMangaList();

    for(inListedTab of listItemConfig) {
      newMangaListToSave.forEach((tab, index) => {
        if(tab.title === inListedTab) {
          
          tab.data.forEach((manga, index) => {
            if(manga.link === mangaUrl) {
              tab.data.splice(index, 1)
            }
          })

        }
      })
    }
    
    await saveMangaList(newMangaListToSave)

  }

  const debouncedSetLastReadChapterIndex = _.debounce((lastReadChapterIndex, numberOfReadChapters) => {
    setNumberOfReadChapters(numberOfReadChapters);
    setLastReadChapterIndex(lastReadChapterIndex);
  }, 300);

  const handleSetLastReadChapterIndex = (lastReadChapterIndex, numberOfReadChapters) => {
    debouncedSetLastReadChapterIndex(lastReadChapterIndex, numberOfReadChapters);
  }

  const handleReadingResume = () => {
    setLastReadChapterIndex(prev => {
      console.log("prev", prev)
      return prev
    })
    
    const targetChapterIndex = lastReadChapterIndex != null ? lastReadChapterIndex : mangaInfo.chapterList.length - 1
    const targetChapter = mangaInfo.chapterList[targetChapterIndex]
    targetChapter["index"] = targetChapterIndex
    
    console.log("targetChapter", targetChapter)
    
    const chapterData = targetChapter
    const isListed = tabsListed?.length > 0
    console.log("mangaUrl", mangaUrl)



    router.push({
      pathname: "screens/manga_reader",
      params: {
        currentChapterData: JSON.stringify(chapterData),
        currentChapterIndex: targetChapterIndex,
        isListedAsString: isListed,
        mangaUrl, 
      }
    });
  }
  
  const AsyncEffect = async () => {
    setIsLoading(true);

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    
    try {
      const listItemConfig = await readMangaListItemConfig(mangaUrl);
      const isListed = listItemConfig?.length > 0
      
      if (isListed) {
        try {
          const mangaDir = shorthash.unique(mangaUrl);
          const mangaCacheDir = `${FileSystem.cacheDirectory}${mangaDir}`;
          const mangaDocsDir = `${FileSystem.documentDirectory}${mangaDir}`;
      
          // Check if the cache directory exists
          const mangaCacheInfo = await FileSystem.getInfoAsync(mangaCacheDir);
          if (mangaCacheInfo.exists) {
            // Read the contents of the cache directory
            const mangaDirCacheContent = await FileSystem.readDirectoryAsync(mangaCacheDir);
            console.log("Cache Directory Content:", mangaDirCacheContent);
      
            // Ensure the destination directory exists
            const mangaDocsInfo = await FileSystem.getInfoAsync(mangaDocsDir);
            if (!mangaDocsInfo.exists) {
              await FileSystem.makeDirectoryAsync(mangaDocsDir, { intermediates: true });
            }
      
            // Copy files from the cache directory to the document directory
            for (const fileName of mangaDirCacheContent) {
              const fromPath = `${mangaCacheDir}/${fileName}`;
              const toPath = `${mangaDocsDir}/${fileName}`;
              await FileSystem.copyAsync({ from: fromPath, to: toPath });
              console.log(`Copied: ${fileName}`);
            }
      
            // Delete the cache directory after copying
            await FileSystem.deleteAsync(mangaCacheDir, { idempotent: true });
            console.log("Cache Directory Deleted");
          } 
        } catch (error) {
          console.error("Error in manga file operations:", error);
        }
      }
       

      const res = await backend.fetchData(mangaUrl, signal, isListed);
      setTabsListed(listItemConfig ?? [])

      if (isMounted.current) {
        setMangaInfo(res.data);
      }
      
    } catch (error) {
      setMangaInfo([]);
      setErrorData(error)
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    } finally { 
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    AsyncEffect();
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      setIsLoading(false);
      setMangaInfo([]);
      backHandler.remove();
      isMounted.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [mangaUrl]);

  return (
    <View className="h-full w-full bg-primary">
      <StatusBar backgroundColor={'transparent'} barStyle={'light-content'} />
      <View className="h-full w-full">
        <MangaHeader 
          key={tabsListed}
          mangaCover={mangaCover}
          mangaId={mangaId}
          mangaTitle={mangaTitle}
          mangaUrl={mangaUrl}
          details={mangaInfo ? mangaInfo.mangaDetails : null}
          isLoading={isLoading}
          tabsListed={tabsListed}
        />
        
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={'white'} size={'large'}/>
            <Text className="font-pregular text-white text-md mt-3">Loading chapter list..</Text>
          </View>            
        ) : (
          !errorData ? (
            <ChapterList 
              mangaUrl={mangaUrl}
              chaptersData={mangaInfo.chapterList}  
              listStyles={{paddingBottom: 8, paddingHorizontal: 8}}
              onRefresh={handleRefresh}
              onChapterReadStatusChange={handleSetLastReadChapterIndex}
              isListed={tabsListed?.length > 0}
              headerComponent={
                <View>
                  
                  {mangaInfo.mangaDetails && mangaInfo.mangaDetails.tags.length > 0 && mangaInfo.mangaDetails.tags[0] !== "" && (
                    <View className="flex-row flex-wrap mt-5 mx-4">
                      {mangaInfo.mangaDetails.tags.map((g, i) => (
                        <Text key={i} className="p-2 m-1 font-pregular text-xs rounded-md text-white bg-accent-100">
                          {g}
                        </Text>
                      ))}
                    </View>
                  )}

                  {mangaInfo.mangaDetails && (
                    <View>
                      <Accordion details={mangaInfo.mangaDetails.alternativeNames.join('\n')}>
                        <Text className="text-white font-pbold">Alternative Titles</Text>
                      </Accordion>
                    </View>
                  )}

                  <View className="flex-row mx-3 justify-between">
                    <TouchableOpacity onPress={handleClearMangaCache} className="py-2 px-3 bg-white  rounded-md flex-1 flex-row justify-center">
                      <View className="mr-2">
                        <MaterialIcons name="delete-outline" size={15} color={colors.accent.DEFAULT} />
                      </View>
                      <Text className="font-pregular text-accent text-center text-xs" numberOfLines={1}>Clear data</Text>
                    </TouchableOpacity>
                    {numberOfReadChapters !== mangaInfo.chapterList.length && (
                      <TouchableOpacity onPress={handleReadingResume} className="py-2 px-3 bg-white  rounded-md flex-1 flex-row justify-center ml-2">
                        <View className="mr-2">
                            <MaterialIcons name="play-arrow" size={15} color={colors.primary.DEFAULT} />
                        </View>
                        <Text className="font-pregular text-primary text-center text-xs" numberOfLines={1}>{`${numberOfReadChapters > 0 ? `Resume` : 'Start Reading'}`}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <HorizontalRule displayText="Chapter list" otherStyles={"mx-4 sticky my-2"} />
                </View>
              }
          />
          ) : (
            <View className="h-full justify-center items-center">
                <Text className="font-pregular text-white text-base">Something went wrong</Text>
                <Text className="font-pregular text-white text-base">while loading the chapters</Text>
                <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">Swipe down to retry</Text>
            </View>
          )
        )}
      </View>

    </View>
  );
};

export default MangaInfoScreen;
