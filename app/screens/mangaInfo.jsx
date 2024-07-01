import { View, Text, ScrollView, ImageBackground, Alert, ActivityIndicator, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';

import colors from '../../constants/colors';
import MangaCard from '../../components/MangaMenu/MangaCard';
import Accordion from '../../components/Accordion';
import ChapterList from '../../components/Chapters/ChapterList';
import HorizontalRule from '../../components/HorizontalRule';
import { getMangaDetails } from '../../services/MangakakalotClient';

const MangaInfoScreen = () => {
  const params = useLocalSearchParams();
  const { mangaId, mangaCover, mangaTitle, mangaLink } = params;
  const [details, setDetails] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const mangaDetails = await getMangaDetails(mangaLink);
      setDetails(mangaDetails);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mangaLink]);

  const handleDetailsRefresh = async () => {
    console.log("refresh details");

    try {
      setRefreshing(true);
      const cacheKey = shorthash.unique(mangaLink + "[details]");
      await AsyncStorage.removeItem(cacheKey);

      const mangaDetails = await getMangaDetails(mangaLink);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(mangaDetails));
      setDetails(mangaDetails);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setRefreshing(false);
    }
  };

  

  return (
    <View className="h-full w-full bg-primary">
      <StatusBar backgroundColor={'transparent'} barStyle={'light-content'}/>
      <View className="">
        <ScrollView>
          <View>
            <ImageBackground
              source={{ uri: mangaCover }}
              className="h-[250px] w-full relative"
              style={{ opacity: 0.3, backgroundColor: colors.primary.DEFAULT }}
              resizeMode="cover"
            />
            <View className="flex-row w-full px-2 absolute bottom-3 max-h-[185px]">
              <MangaCard
                mangaId={mangaId}
                mangaTitle={mangaTitle}
                mangaCover={mangaCover}
                containerStyles="my-1 w-[100px]"
                coverStyles="w-[100%] h-[150px]"
                disabled
              >
                <Text className="text-white text-xs text-center font-pregular mt-1">
                  {details && !isLoading ? details.status.toUpperCase() : "Loading"}
                </Text>
              </MangaCard>
              <View className="ml-3 mt-1 w-[65%]">
                <Text className="text-white font-pmedium text-lg" numberOfLines={3}>{mangaTitle}</Text>
                <ScrollView className="rounded-md max-w-[98%] max-h-[60%]" showsVerticalScrollIndicator={false}>
                  <Text className="text-white p-2 font-pregular text-xs text-justify">{details ? details.desc : "Loading"}</Text>
                </ScrollView>
                <Text numberOfLines={2} className="text-white p-2 font-pregular text-xs text-justify">{details ? `By: ${details.author}` : ""}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
      </View>
        <View className="flex-1 mx-2 mb-5 h-full">
            <ChapterList mangaLink={mangaLink}
              headerComponent={
                <View>
                  {isLoading ? (
                    <ActivityIndicator color={colors.accent[100]} />
                    ) : (
                    <>
                      <View className="flex-row flex-wrap mt-5 mx-4">
                        {details.tags.map((g, i) => (
                          <Text key={i} className="p-2 m-1 rounded-md text-white bg-accent-100">
                            {g}
                          </Text>
                        ))}
                      </View>
                      {details && (
                        <View>
                          <Accordion details={details.alternativeNames.join('\n')}>
                            <Text className="text-white font-pbold ">Alternative Titles</Text>
                          </Accordion>
                        </View>
                      )}
                    </>
                  )}
                  <HorizontalRule displayText="Chapter list" otherStyles={"mx-4 sticky"} />
                </View>
              }
            />
        </View>
    </View>
  );
};

export default MangaInfoScreen;