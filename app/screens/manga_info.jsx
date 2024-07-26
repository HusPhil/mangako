import { View, Text, ActivityIndicator, StatusBar, BackHandler, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

import ChapterList from '../../components/chapters/ChapterList';
import MangaHeader from '../../components/manga_info/MangaHeader';
import Accordion from '../../components/Accordion';
import HorizontalRule from '../../components/HorizontalRule';

import * as backend from "./_manga_info";
import { readMangaConfigData, saveMangaConfigData, CONFIG_READ_WRITE_MODE } from '../../services/Global';



const MangaInfoScreen = () => {
  const params = useLocalSearchParams();
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = params;
  const [mangaInfo, setMangaInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const controllerRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();

  const handleBackPress = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    router.back();
    return true;
  };

  const handleRefresh = async () => {
    setIsLoading(true)
    await backend.deleteSavedMangaInfo(mangaUrl)
    await AsyncEffect()
    setIsLoading(false)
  }

  const AsyncEffect = async () => {
    setIsLoading(true);

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    
    try {
      const res = await backend.fetchData(mangaUrl, signal);
      if (isMounted.current) {
        setMangaInfo(res.data);
      }

      
    } catch (error) {
      setMangaInfo([]);
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
      <View className="h-full w-full" >
        <MangaHeader 
          mangaCover={mangaCover}
          mangaId={mangaId}
          mangaTitle={mangaTitle}
          details={mangaInfo ? mangaInfo.mangaDetails : null}
          isLoading={isLoading}
        />
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={'white'} size={'large'}/>
            <Text className="font-pregular text-white text-md mt-3">Loading chapter list..</Text>
          </View>            
        ) : (
          <ChapterList 
            mangaUrl={mangaUrl}
            chaptersData={mangaInfo.chapterList}
            listStyles={{paddingBottom: 8, paddingHorizontal: 8}}
            onRefresh={handleRefresh}
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
        )}
      </View>

    </View>
  );
};

export default MangaInfoScreen;
