import HomeScreenHeader from "@/components/home-screen-components/HomeScreenHeader";
import MangListFilter from "@/components/home-screen-components/MangListFilter";
import { useLibraryStore } from "@/stores/library-store";
import { useEffect } from "react";
import { Text, View } from "react-native";

const DUMMY_SOURCE = "mangafox";

const HomeScreen = () => {
  const library = useLibraryStore((state) => state.library);

  useEffect(() => {
    console.log(library);
  }, [library]);

  return (
    <View className="flex-1 bg-secondary">
      <HomeScreenHeader />
      <MangListFilter />
      {library.map((manga) => {
        return <Text key={manga.manga_id}>{manga.title}</Text>;
      })}
      {/* <MangaGrid
        mangaList={MANGA_LIST_DUMMY_DATA}
        mangaSourceId={DUMMY_SOURCE}
      />
      <Link href={"./(modals)/test-modal"} asChild>
        <Pressable>
          <Text>Open Modal</Text>
        </Pressable>
      </Link> */}
    </View>
  );
};

export default HomeScreen;
