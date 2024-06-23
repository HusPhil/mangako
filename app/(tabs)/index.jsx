import { ScrollView, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, StatusBar } from 'expo-router';
import { useState, useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';


import MangaGrid from '../../components/MangaGrid';
import {LinearGradient} from 'expo-linear-gradient';
import { getMangaByOrder } from '../../utils/MangakakalotClient';
import colors from '../../constants/colors'
import icons from '../../constants/icons'

export default function App() {
  const [fetchedMangaData, setFetchedMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState()

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await getMangaByOrder(
        'https://mangakakalot.com/manga_list?type=topview&category=all&state=ongoing&page=0',
        'div.list-truyen-item-wrap'
      );
      setFetchedMangaData([...fetchedMangaData, ...result]);
    } catch (error) {
      Alert.alert("Error", error.message);
      setErrors(error)
      setFetchedMangaData(placeholderData);
    } finally {
      setIsLoading(false);
      }
      };
        
    useEffect(() => {
      NavigationBar.setVisibilityAsync('hidden')
      fetchData();
      }, []);
          
    const handleSearchButton = () => {
      router.navigate({
        pathname: "screens/mangaSearcher",
      });
    }
          return (
    <SafeAreaView className="bg-primary">
      <LinearGradient
                colors={[`${colors.primary.DEFAULT}`, `${colors.accent[100]}`]}
                start={{x:0, y:0}}
                end={{x:1, y:1}}
      >
          <View className="h-full">
            { !errors ? (
              <View>
            <View className="px-4 py-3 pt-4">
              <TouchableOpacity className="flex-row justify-between  bg-secondary-100 rounded-lg p-2"
                  onPress={handleSearchButton}
              >
                <Text className="text-white font-pregular text-sm">Search a manga..</Text>
                <Image source={icons.search} className="h-[18px] w-[18px]"/>
              </TouchableOpacity>
            </View>

              <ScrollView 
              className="w-full mb-2"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              >
                <MangaGrid
                  mangaData={isLoading ? null : fetchedMangaData}
                  ListEmptyComponent={()=>{
                   
                  }}
                  limit={100}
                  numColumns={3}
                  isLoading={isLoading}
                  />
              </ScrollView>
                  </View>
            ) : (
                <View className="h-full justify-center">
                  <Text className="text-white text-lg font-pregular">Something went wrong. Please check your  internet connection and try again.</Text>
                </View>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
  );
}

