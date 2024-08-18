import { View, Text, ActivityIndicator, StatusBar, BackHandler, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';

import ChapterList from '../../components/chapters/ChapterList';
import MangaHeader from '../../components/manga_info/MangaHeader';
import Accordion from '../../components/Accordion';
import HorizontalRule from '../../components/HorizontalRule';

import * as backend from "./_manga_info";
import { readMangaListItemConfig } from '../../services/Global';

const MangaInfoScreen = () => {
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = useLocalSearchParams();;
  const [mangaInfo, setMangaInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabsListed, setTabsListed] = useState([])
  const [errorData, setErrorData] = useState(null);
  const [listMode, setListMode] = useState(backend.CHAPTER_LIST_MODE.SELECT_MODE)


  const controllerRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();
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

  const AsyncEffect = async () => {
    setIsLoading(true);

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    
    try {
      const listItemConfig = await readMangaListItemConfig(mangaUrl);
      const isListed = listItemConfig?.length > 0

      if(isListed) {
        const mangaDir = shorthash.unique(mangaUrl)
        const mangaCacheDir = `${FileSystem.cacheDirectory}${mangaDir}`
        const mangaDocsDir = `${FileSystem.documentDirectory}${mangaDir}`

        const mangaCacheInfo = await FileSystem.getInfoAsync(mangaCacheDir)
        if(mangaCacheInfo.exists) {
          const mangaDirCacheContent = await FileSystem.readDirectoryAsync(mangaCacheDir)
          console.log("mangaDirContent Cache", mangaDirCacheContent, typeof(mangaDirCacheContent))

          mangaDirCacheContent.forEach(async item => {
            const content = await FileSystem.readDirectoryAsync(mangaCacheDir + `/${item}`)
          })

          await FileSystem.copyAsync({
            from: mangaCacheDir,
            to: mangaDocsDir
          })
          await FileSystem.deleteAsync(mangaCacheInfo.uri)
          console.log("COPIED DONE")
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
  

  const handleListModeChange = useCallback((currentListMode) => {
    setListMode(currentListMode)
  }, [])

  const handleMarkAsRead = useCallback(() => {
    console.log("the chapters to be selected as read:\n", selectedChapters.current)
  }, [])

  const handleChapterSelect = useCallback((currentSelectedChapters) => {
    selectedChapters.current = currentSelectedChapters;
  }, [])

  


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
          listMode={listMode}
          onMarkAsRead={handleMarkAsRead}
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
              isListed={tabsListed?.length > 0}
              onListModeChange={handleListModeChange}
              onChapterSelect={handleChapterSelect}
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
                  
                  <HorizontalRule displayText="Chapter list" otherStyles={"mx-4 sticky"} />
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
