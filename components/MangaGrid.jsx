import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import MangaCard from './MangaCard';
import { getMangaByOrder } from '../utils/MangaDexClient';

const MangaGrid = ({ order, limit, numColumns, listStyles }) => {
  const [mangaData, setMangaData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getMangaByOrder(order, limit);
        setMangaData(result);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

    fetchData();
  }, [order, limit]);

  const renderItem = ({ item }) => (
      
      <View className="w-full px-1">
          <MangaCard 
            mangaTitle={item.title}
            mangaCover={item.cover}
            containerStyles={"mt-1 w-[100%]"}
            coverStyles={"w-[100%] h-[150px]"}
          />
      </View>
      
  );

  return (
    <View className="h-full w-full self-center">
        <FlashList
          data={mangaData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={limit}
          numColumns={numColumns}
          contentContainerStyle={listStyles}
        />
    </View>
  );
};

export default MangaGrid;
