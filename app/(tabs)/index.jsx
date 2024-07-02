import { View, Text, Alert, TouchableOpacity, Image, StatusBar } from 'react-native'
import React, {useState, useEffect} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import icons from '../../constants/icons'
import { MangaGrid } from "../../components/manga_menu"
import { getMangaByOrder } from '../../services/MangakakalotClient'
import colors from '../../constants/colors'
import { useFocusEffect } from 'expo-router'

const HomeTab = () => {
  const [fetchedMangaData, setFetchedMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await getMangaByOrder(
        'https://mangakakalot.com/manga_list?type=hot&category=all&state=completed&page=1',
        'div.list-truyen-item-wrap'
      );
      setFetchedMangaData([...fetchedMangaData, ...result]);
    } catch (error) {
      console.log(error)
      Alert.alert("Error", error.message);
      setFetchedMangaData(placeholderData);
    } finally {
      setIsLoading(false);
      }
      };
        
    useEffect(() => {
      fetchData();
    }, []);

    useFocusEffect(
      React.useCallback(() => {
        StatusBar.setBackgroundColor(colors.secondary.DEFAULT)
        StatusBar.setBarStyle('light-content')
      }, [])
    );
    
          
  const handleSearchButton = () => {
    router.navigate({
      pathname: "screens/mangaSearcher",
    });
  }

  return (
    <SafeAreaView>
      <View className="h-full w-full bg-primary">
        <View className="px-4 py-3 pt-4">
          <TouchableOpacity className="flex-row justify-between  bg-secondary-100 rounded-lg p-2"
              onPress={handleSearchButton}
          >
            <Text className="text-white font-pregular text-sm">Search a manga..</Text>
            <Image source={icons.search} className="h-[18px] w-[18px]"/>
          </TouchableOpacity>
        </View>
        <MangaGrid
            mangaData={isLoading ? null : fetchedMangaData}
            limit={100}
            numColumns={3}
            isLoading={isLoading}
            />
      </View>
    </SafeAreaView>
  )
}

export default HomeTab