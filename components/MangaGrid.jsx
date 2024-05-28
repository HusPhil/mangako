import React, { useState, useEffect } from 'react';
import { Alert, View, Text } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import MangaCard from './MangaCard';
import { getMangaByOrder } from '../utils/MangaDexClient';

import {LinearGradient} from 'expo-linear-gradient';
import colors from '../constants/colors';

const MangaGrid = ({ order, limit, numColumns, listStyles }) => {
  const [mangaData, setMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const placeholderData = new Array(3*10).fill(null).map((_, index) => ({
    id: `placeholder-${index}`,
    title: null,
    cover: null,
    details: null,
  }));

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getMangaByOrder(order, limit);
        setMangaData(result);
      } catch (error) {
        Alert.alert("Error", error.message);
        setMangaData(placeholderData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [order, limit]);

  const MangaText = ({mangaTitle}) => {
    return (
      <View className="absolute  bg-opacity-0 max-h-[40px]  bottom-0 w-full justify-end py-1 bg-secondary-100">
        <Text className="text-white text-xs text-left px-1 font-pregular overflow-auto">
        {mangaTitle ? (mangaTitle.length > 30 ? `${mangaTitle.substring(0, 30)}...` : mangaTitle) : 'Loading..'}
        </Text>
      </View>
    )
}

  const renderItem = ({ item }) => (
    <View className="w-full px-2">
      <MangaCard 
        mangaId={item.id}
        mangaTitle={item.title}
        mangaCover={item.cover}
        mangaDetails={item.details}
        containerStyles={"my-1 w-[100%]"}
        coverStyles={"w-[100%] h-[150px]"}
        
      >
      <MangaText mangaTitle={item.title}/>
      </MangaCard>
    </View>
  );

  

  return (
    <View className="h-full w-full self-center px-2 mt-2">  
        {mangaData ? (
          <FlashList
            data={isLoading ? placeholderData : mangaData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={limit}
            numColumns={numColumns}
            contentContainerStyle={listStyles}
            />
            
          ) : (
            <Text>Error loading</Text>
          )}
    </View>
  );
};

export default MangaGrid;
