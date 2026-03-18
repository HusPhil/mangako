import HomeScreenHeader from "@/components/HomeScreenComponents/HomeScreenHeader";
import MangListFilter from "@/components/HomeScreenComponents/MangListFilter";
import MangaGrid from "@/components/MangaGrid";
import { MANGA_LIST_DUMMY_DATA } from "@/constants/dummyData";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const DUMMY_SOURCE = "mangafox";

const HomeScreen = () => {
  return (
    <View className="flex-1 bg-secondary">
      <HomeScreenHeader />
      <MangListFilter />
      <MangaGrid
        mangaList={MANGA_LIST_DUMMY_DATA}
        mangaSourceId={DUMMY_SOURCE}
      />
      <Link href={"./(modals)/test-modal"} asChild>
        <Pressable>
          <Text>Open Modal</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default HomeScreen;
