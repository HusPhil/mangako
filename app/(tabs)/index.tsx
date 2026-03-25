import HomeScreenHeader from "@/components/home-screen-components/HomeScreenHeader";
import MangaListFilter from "@/components/home-screen-components/MangListFilter";
import MangaGrid from "@/components/MangaGrid";
import { mapLibraryListToGridItems } from "@/services/db/types";
import { useLibraryStore } from "@/stores/library-store";
import { View } from "react-native";

const HomeScreen = () => {
  const library = useLibraryStore((state) => state.library);

  return (
    <View className="flex-1 bg-secondary">
      <HomeScreenHeader />
      <MangaListFilter />
      <MangaGrid mangaList={mapLibraryListToGridItems(library)} />
    </View>
  );
};

export default HomeScreen;
