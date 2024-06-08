import { View, Text, TextInput, StatusBar } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import MangaGrid from '../../components/MangaGrid'
import colors from '../../constants/colors'
import { getMangaBySearch } from '../../utils/MangakakalotClient'


const mangaSearcher = () => {
  const [mangaQuery, setMangaQuery] = useState('')

  const [fetchedMangaData, setFetchedMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setFetchedMangaData([])
      setIsLoading(true);
      const result = await getMangaBySearch(
        `https://mangakakalot.com/search/story/${mangaQuery}`,
        'div.story_item'
      );
      setFetchedMangaData([...result]);
    } catch (error) {
      Alert.alert("Error", error.message);
      setFetchedMangaData(placeholderData);
    } finally {
      setIsLoading(false);
      }
      };
        
    useEffect(() => {
      fetchData();
      }, []);

  const handleSearch = () => {
    console.log("searching: " + mangaQuery)
    setFetchedMangaData([])
    fetchData()
  }



  return (
    <SafeAreaView className="bg-primary">
      <StatusBar backgroundColor={colors.secondary.DEFAULT} style='light'/>
      <View className="h-full w-full">
        <View>
          <TextInput 
            placeholder='ex. One Piece' 
            placeholderTextColor={'#CDCDE0'} 
            className="bg-secondary-100 rounded-lg py-1 px-3 mt-4 mx-4 text-white font-pregular text-sm"  
            autoFocus
            onEndEditing={handleSearch}
            onChangeText={text => setMangaQuery(text)}
          />
        </View>
        <View className="h-full w-full">
          {
            (mangaQuery != '' || fetchedMangaData) && (<MangaGrid
              mangaData={isLoading ? null : fetchedMangaData}
              limit={100}
              numColumns={3}
              isLoading={isLoading}
            />)
          }
        </View>
      </View>
    </SafeAreaView>
  )
}

export default mangaSearcher