import { View, Text, TextInput, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import MangaGrid from '../../components/MangaGrid'
import colors from '../../constants/colors'
import icons from '../../constants/icons';
import {LinearGradient} from 'expo-linear-gradient';
import { getMangaBySearch } from '../../utils/MangakakalotClient'


const mangaSearcher = () => {
  const [mangaQuery, setMangaQuery] = useState('')
  const [firstTimeQuery, setFirstTimeQuery] = useState(true)
  const [fetchedMangaData, setFetchedMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const textInputRef = useRef(null)

  const fetchData = async () => {
    try {
      setFetchedMangaData([])
      setIsLoading(true);

      const formattedMangaQuery = mangaQuery.toLowerCase().replace(/\s+/g, '_')
      
      const result = await getMangaBySearch(
        `https://mangakakalot.com/search/story/${formattedMangaQuery}`,
        'div.story_item'
      );
      if(result.length > 0) {
        setFetchedMangaData([...result]);
      } else {
        setFetchedMangaData(null)
      }
    } catch (error) {
      Alert.alert("Error", error.message);
      setFetchedMangaData(placeholderData);
    } finally {
      setIsLoading(false);
      }
      };
      
  const handleSearch = () => {
    setFetchedMangaData([])
    setFirstTimeQuery(false)
    fetchData()
  }

  const clearInput = () => {
    if(textInputRef.current) {
      setFirstTimeQuery(true)
      textInputRef.current.clear()
      textInputRef.current.focus()
    }
  }

  return (
    <SafeAreaView className="bg-primary">
    <StatusBar backgroundColor={colors.secondary.DEFAULT} barStyle={'light-content'}/>
      <LinearGradient
                colors={[`${colors.primary.DEFAULT}`, `${colors.accent[100]}`]}
                start={{x:0, y:0}}
                end={{x:1, y:1}}
      >
          <View className="h-full">
            <View className="flex-row px-4 py-3 pt-4 items-center justify-center">
              <TextInput 
                  ref={textInputRef}
                  placeholder='ex: One Piece' 
                  placeholderTextColor={'#CDCDE0'} 
                  className="bg-secondary-100 rounded-lg py-1 px-3 text-white font-pregular text-sm w-[90%]"  
                  autoFocus
                  textAlignVertical='bottom'
                  onEndEditing={handleSearch}
                  onChangeText={text => setMangaQuery(text)}
              />
              {
                isLoading ? (
                  <ActivityIndicator className="justify-center items-center ml-2" color={colors.accent[100]}/>
                ) : (
                  <TouchableOpacity className="justify-center items-center pl-2 py-2" onPress={clearInput}>
                    <MaterialIcons name="clear" size={20} color="white"/>
                  </TouchableOpacity>
                )
              }
            </View>

            {
              (firstTimeQuery && fetchedMangaData) && (
                <View className="flex-1 items-center justify-center h-full">
                    <MaterialCommunityIcons name="text-search" size={100} color="white" />
                    <Text className="font-pregular text-sm text-white p-3">Search your manga</Text>
                </View>
                )
            }
              
           { 
           

           (!isLoading && fetchedMangaData && !firstTimeQuery) ? (
            <ScrollView 
            className="w-full mb-2"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            >
              <MangaGrid
              mangaData={fetchedMangaData}
              limit={100}
              numColumns={3}
              isLoading={isLoading}
              />
            </ScrollView>
          ) :
          (
            !fetchedMangaData && (
              <View className="flex-1 items-center justify-center h-full">
                  <AntDesign name="closecircleo" size={100} color={'white'} />
                  <Text className="font-pregular text-sm text-white p-3">No results were found...</Text>
              </View>
            )
          )
          }
          </View>
        </LinearGradient>
      </SafeAreaView>
  )
}

export default mangaSearcher