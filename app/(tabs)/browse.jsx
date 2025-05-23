import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Toast from "react-native-toast-message";

import HorizontalRule from "../../components/HorizontalRule";
import { MangaGrid, MangaSlide } from "../../components/manga_menu";
import icons from "../../constants/icons";
import {
  useGetLatestMangaList,
  useGetPopularMangaList,
} from "../../services/useGetMangaList";

const BrowseTab = () => {
  // const [newestManga, setNewestManga] = useState([]);
  // const [popularManga, setPopularManga] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [errorData, setErrorData] = useState();

  const currentNewestMangaPage = useRef(1);
  const currentPopularMangaPage = useRef(1);

  const {
    data: latestMangaData,
    error: latestMangaError,
    isLoading: latestMangaLoading,
    fetchNextPage: fetchNextLatestManga,
    hasNextPage: hasMoreLatestManga,
    isFetchingNextPage: isFetchingMoreLatestManga,
  } = useGetLatestMangaList("mangakakalot");

  const latestMangaList = useMemo(() => {
    if (!latestMangaData) return [];

    const seen = new Map();

    latestMangaData.pages.forEach((page) => {
      page.latest_manga.forEach((manga) => {
        if (!seen.has(manga.mangaId)) {
          seen.set(manga.mangaId, manga);
        }
      });
    });

    return Array.from(seen.values());
  }, [latestMangaData]);

  const {
    data: popularMangaData,
    error: popularMangaError,
    isLoading: popularMangaLoading,
  } = useGetPopularMangaList("mangakakalot");

  const handleSearchButton = () => {
    router.push({
      pathname: "screens/manga_searcher",
    });
  };

  const getMoreManga = async (type) => {
    if (latestMangaLoading) {
      console.log("latestMangaLoading", latestMangaLoading);
      return;
    }
    if (type === "latest" && hasMoreLatestManga) {
      Toast.show({
        type: "info",
        text1: "Loading..",
        text2: "More manga coming up!",
      });
      await fetchNextLatestManga();
      Toast.show({
        type: "success",
        text1: "New mangas available!",
        text2: "Scroll down for more mangas..",
      });
    }
  };

  return (
    <SafeAreaView className="h-full w-full bg-primary">
      <View className="px-4 py-3 pt-4">
        <TouchableOpacity
          className="flex-row justify-between  bg-secondary-100 rounded-lg p-2"
          onPress={handleSearchButton}
        >
          <Text className="text-white font-pregular text-sm">
            Search a manga..
            {/* {data && <Text>{data.message}</Text>} */}
          </Text>
          <Image source={icons.search} className="h-[18px] w-[18px]" />
        </TouchableOpacity>
      </View>
      {!errorData ? (
        <>
          <HorizontalRule
            displayText={"Most Popular"}
            otherStyles={"my-4 mx-4"}
          />
          <MangaSlide
            mangaData={
              popularMangaLoading ? null : popularMangaData?.popular_manga
            }
            limit={100}
            numColumns={3}
            isLoading={popularMangaLoading}
            onEndReached={() => {
              // TODO: so something
            }}
          />
          <HorizontalRule
            displayText={"Latest Releases"}
            otherStyles={"my-4 mx-4"}
          />
          <MangaGrid
            mangaData={latestMangaLoading ? null : latestMangaList}
            numColumns={3}
            isLoading={latestMangaLoading || isFetchingMoreLatestManga}
            onEndReached={() => {
              getMoreManga("latest");
            }}
          />
        </>
      ) : (
        <View className="flex-1 w-full my-5 justify-center items-center">
          <MaterialIcons name="not-interested" size={50} color="white" />
          <Text className="text-white font-pregular mt-2">
            Something went wrong.
          </Text>
          <TouchableOpacity
            className="p-2 bg-accent rounded-md mt-4"
            onPress={() => {
              setNewestManga([]);
              setPopularManga([]);
              setErrorData(undefined);
              fetchData();
            }}
          >
            <Text className="text-white font-pregular text-center">
              Would you like to retry?
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default BrowseTab;
