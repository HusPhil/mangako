import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from "@shopify/flash-list";

import MangaCard from './MangaCard';

const MangaSlide = ({ mangaData, listStyles, isLoading, listEmptyComponent, onEndReached}) => {
    const placeholderData = new Array(3*10).fill(null).map((_, index) => ({
        id: `placeholder-${index}`,
        title: null,
        cover: null,
        details: null,
    }));

    const MangaText = ({mangaTitle}) => {
        return (
        <View className="absolute  bg-opacity-0 bottom-0 w-full justify-end py-1 bg-secondary-100">
            <Text className="text-white text-xs text-left px-1 font-pregular overflow-auto" numberOfLines={3}>
            {mangaTitle ?  mangaTitle : 'Loading..'}
            </Text>
        </View>
        )
    }

    const renderItem = ({ item }) => (
        <View>
        <MangaCard 
            mangaId={item.id}
            mangaUrl={item.link}
            mangaTitle={item.title}
            mangaCover={item.cover}
            containerStyles={"my-1 w-[120px]"}
            coverStyles={"w-[120px] h-[150px]"}
            disabled={isLoading}
            
        >
        <MangaText mangaTitle={item.title}/>
        </MangaCard>
        </View>
    );

    const renderSeparator = () => (
        <View className="m-2" />
      );
    
    return (
    <View className="mx-4">
        <FlashList
        data={mangaData ? mangaData : placeholderData}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        keyExtractor={(item) => item.id}
        estimatedItemSize={300}
        contentContainerStyle={listStyles}
        showsHorizontalScrollIndicator={false}
        horizontal        
        ListEmptyComponent={listEmptyComponent}
        onEndReached={onEndReached}
    />
    </View>
    )
}

export default MangaSlide