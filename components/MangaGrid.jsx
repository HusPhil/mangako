import React, { useState, useEffect, memo } from 'react';
import { Alert, View, Text, Button } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import MangaCard from './MangaCard';


const MangaGrid = ({ mangaData, limit, numColumns, listStyles, isLoading }) => {

  const placeholderData = new Array(3*10).fill(null).map((_, index) => ({
    id: `placeholder-${index}`,
    title: null,
    cover: null,
    details: null,
  }));

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
        mangaLink={item.link}
        mangaTitle={item.title}
        mangaCover={item.cover}
        containerStyles={"my-1 w-[100%]"}
        coverStyles={"w-[100%] h-[150px]"}
        disabled={isLoading}
      >
      <MangaText mangaTitle={item.title}/>
      </MangaCard>
    </View>
  );

  

  return (
    <View className="h-full w-full self-center px-2 mt-2 flex-1">  
        <FlashList
          data={mangaData ? mangaData : placeholderData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={limit}
          numColumns={numColumns}
          contentContainerStyle={listStyles}
        />
    </View>
  );
};

export default memo(MangaGrid);
