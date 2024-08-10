import { View, Text, Alert, TouchableOpacity, Image, StatusBar } from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-simple-toast';

import colors from '../../constants/colors'
import icons from '../../constants/icons'
import { MangaGrid, MangaSlide } from "../../components/manga_menu"

import { getMangaByOrder } from '../../services/MangakakalotClient'

const BrowseTab = () => {
  const [newestManga, setNewestManga] = useState([]);
  const [popularManga, setPopularManga] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorData, setErrorData] = useState()

  const currentNewestMangaPage = useRef(1)
  const currentPopularMangaPage = useRef(1)

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const newestManga = await getMangaByOrder(
        'https://mangakakalot.com/manga_list?type=latest&category=all&state=all&page=1',
        'div.list-truyen-item-wrap'
      );
      const popularManga = await getMangaByOrder(
        'https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=1',
        'div.list-truyen-item-wrap'
      );

      console.log(popularManga[0])
      setNewestManga(newestManga)
      setPopularManga(popularManga)

    } catch (error) {
      setErrorData(error)
      Toast.show(
        `An error occured: ${error}`,
        Toast.LONG,
      );
      setNewestManga([])
      setPopularManga([])
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
    router.push({
      pathname: "screens/manga_searcher",
    });
  }

  const getMoreManga = async (type) => {
    if(isLoading) return

    Toast.show(
      'Fetching more manga..',
      Toast.LONG,
    );

    if(type === 'popular'){
      currentPopularMangaPage.current += 1;
      const morePopularManga = await getMangaByOrder(
        `https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=${currentPopularMangaPage.current}`,
        'div.list-truyen-item-wrap'
      );
      setPopularManga([...popularManga, ...morePopularManga])
      return
      }
      
      if(type === 'newest') {
        currentNewestMangaPage.current += 1;
        const moreNewestManga = await getMangaByOrder(
        `https://mangakakalot.com/manga_list?type=latest&category=all&state=all&page=${currentNewestMangaPage.current}`,
        'div.list-truyen-item-wrap'
      );
      setNewestManga([...newestManga, ...moreNewestManga])
      return
    }
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
        {!errorData ? (
          <>
            <Text className="font-pregular text-white text-xl mx-4 py-2">New release..</Text>
            <MangaSlide
                mangaData={isLoading ? null : newestManga}
                limit={100}
                numColumns={3}
                isLoading={isLoading}
                listEmptyComponent={
                  <View className="flex-1 w-full my-5 justify-center items-center">
                    <MaterialIcons name="not-interested" size={50} color="white" />
                    <Text className="text-white font-pregular mt-2">No available manga..</Text>
                    <Text className="text-white font-pregular mt-2 text-center">Pull down to refresh.</Text>
                  </View>
                } 
                onEndReached={()=>{getMoreManga('newest')}}
            />
            <Text className="font-pregular text-white text-xl mx-4 py-2">Most popular..</Text>
            <MangaGrid
                mangaData={isLoading ? null : popularManga}
                numColumns={3}
                isLoading={isLoading}
                listEmptyComponent={
                  <View className="flex-1 w-full my-5 justify-center items-center">
                    <MaterialIcons name="not-interested" size={50} color="white" />
                    <Text className="text-white font-pregular mt-2">No available manga..</Text>
                    <Text className="text-white font-pregular mt-2 text-center">Pull down to refresh.</Text>
                  </View>
                } 
                onEndReached={()=>{getMoreManga('popular')}}
            />
          </>
        ) : (
          <View className="flex-1 w-full my-5 justify-center items-center">
            <MaterialIcons name="not-interested" size={50} color="white" />
            <Text className="text-white font-pregular mt-2">Something went wrong.</Text>
            <TouchableOpacity className="p-2 bg-accent rounded-md mt-4" 
              onPress={()=> {
                setNewestManga([])
                setPopularManga([])
                setErrorData(undefined)
                fetchData()
              }}
            >
              <Text className="text-white font-pregular text-center">Would you like to retry?</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default BrowseTab