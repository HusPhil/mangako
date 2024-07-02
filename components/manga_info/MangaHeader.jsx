import { View, Text, ScrollView, ImageBackground, Alert, ActivityIndicator, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';

import colors from '../../constants/colors';
import { MangaCard } from '../../components/manga_menu';

const MangaHeader = ({
    mangaCover, 
    mangaId, 
    mangaTitle,
    isLoading,
    details
}) => {
  return (
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
                  {details && isLoading? details.status.toUpperCase() : "Loading"}
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
  )
}

export default MangaHeader