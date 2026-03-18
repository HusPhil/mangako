import HomeScreenHeader from "@/components/HomeScreenHeader";
import MangaGrid from "@/components/MangaGrid";
import MangListFilter from "@/components/MangListFilter";
import { MANGA_LIST_DUMMY_DATA } from "@/constants/dummyData";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const HomeScreen = () => {
  return (
    <View className="flex-1 bg-secondary">
      <HomeScreenHeader />
      <MangListFilter />
      <MangaGrid mangaList={MANGA_LIST_DUMMY_DATA} />
      <Link href={"./(modals)/test-modal"} asChild>
        <Pressable>
          <Text>Open Modal</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default HomeScreen;
