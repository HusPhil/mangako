import { ScrollView, View, Text, TouchableOpacity, Image, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';


import MangaGrid from '../../components/MangaGrid';
import {LinearGradient} from 'expo-linear-gradient';
import { getMangaByOrder } from '../../utils/MangakakalotClient';
import colors from '../../constants/colors'
import icons from '../../constants/icons'

export default function App() {
  const [fetchedMangaData, setFetchedMangaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSearchButton = () => {
    router.navigate({
      pathname: "screens/mangaSearcher",
    });
  }
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await getMangaByOrder(
        'https://mangakakalot.com/manga_list?type=topview&category=all&state=completed&page=2',
        'div.list-truyen-item-wrap'
      );
      setFetchedMangaData([...fetchedMangaData, ...result]);
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
  
  return (
    <SafeAreaView className="bg-primary">
      <StatusBar backgroundColor={colors.secondary.DEFAULT} style='light'/>
      <LinearGradient
                colors={[`${colors.primary.DEFAULT}`, `${colors.accent[100]}`]}
                start={{x:0, y:0}}
                end={{x:1, y:1}}
      >
    <ScrollView 
    className="h-full w-full"
    showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}
    >
        <TouchableOpacity className="flex-row justify-between mt-3 bg-secondary-100 rounded-lg p-2 mx-4"
          onPress={handleSearchButton}
        >
          <Text className="text-white font-pregular text-sm">Search a manga..</Text>
          <Image source={icons.search} className="h-[18px] w-[18px]"/>
        </TouchableOpacity>

      <MangaGrid
        mangaData={isLoading ? null : fetchedMangaData}
        limit={100}
        numColumns={3}
        isLoading={isLoading}
      />
      
      </ScrollView>
      </LinearGradient>
      </SafeAreaView>
  );
}

