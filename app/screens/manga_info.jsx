import { View, Text, ActivityIndicator, StatusBar, BackHandler, Button } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { getMangaInfo } from '../../services/MangakakalotClient';

import ChapterList from '../../components/chapters/ChapterList';
import MangaHeader from '../../components/manga_info/MangaHeader';
import Accordion from '../../components/Accordion';
import HorizontalRule from '../../components/HorizontalRule';

import * as backend from "./_manga_info"

const MangaInfoScreen = () => {
  const params = useLocalSearchParams();
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = params;
  const [mangaInfo, setMangaInfo] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const controllerRef = useRef(null);
  const isMounted = useRef(true);

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
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        controllerRef.current.abort()
      }
    );
    AsyncEffect();

    return () => {
      isMounted.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [mangaUrl]);

  return (
    <View>
      {isMounted.current && (
        <View className="h-full w-full bg-primary">
          <StatusBar backgroundColor={'transparent'} barStyle={'light-content'} />
          <View className="h-full w-full">
            <MangaHeader 
              mangaCover={mangaCover}
              mangaId={mangaId}
              mangaTitle={mangaTitle}
              details={mangaInfo ? mangaInfo.mangaDetails : null}
              isLoading={isLoading}
            />
          
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <ChapterList 
                mangaUrl={mangaUrl}
                chaptersData={mangaInfo.chapterList}
                headerComponent={
                  <View>
                    <View className="flex-row flex-wrap mt-5 mx-4">
                      {mangaInfo.mangaDetails.tags.map((g, i) => (
                        <Text key={i} className="p-2 m-1 font-pregular text-xs rounded-md text-white bg-accent-100">
                          {g}
                        </Text>
                      ))}
                    </View>
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
      )}
    </View>
  );
};

export default MangaInfoScreen;
