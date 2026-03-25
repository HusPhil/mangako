import HomeScreenHeader from "@/components/home-screen-components/HomeScreenHeader";
import MangListFilter from "@/components/home-screen-components/MangListFilter";
import { View } from "react-native";

const DUMMY_SOURCE = "mangafox";

const HomeScreen = () => {
  return (
    <View className="flex-1 bg-secondary">
      <HomeScreenHeader />
      <MangListFilter />
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
