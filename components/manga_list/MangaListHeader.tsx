import { images } from "@/constants";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface MangaListHeaderProps {
  handleShowAddTab: () => void;
  handleShowDeleteTab: () => void;
  handleShowSortTab: () => void;
}

const MangaListHeader = ({
  handleShowAddTab,
  handleShowDeleteTab,
  handleShowSortTab,
}: MangaListHeaderProps) => (
  <View className="flex-row justify-between items-center mx-4">
    <View className="flex-row justify-center items-center">
        <Image
          source={images.ramenMiniIcon}
          style={{
            height: "undefined" as any,
            width: 35,
            aspectRatio: 1,
            marginTop: 20,
            marginRight: 5,
          }}
        />
        <Text className="text-2xl mt-7 mb-2 text-white font-pregular ">
          MangaKo
        </Text>
      </View>
      <View className="flex-row mt-4 justify-around w-[35%]">
        <TouchableOpacity className="p-2" onPress={handleShowAddTab}>
          <MaterialIcons name="playlist-add" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={handleShowDeleteTab}>
          <MaterialIcons name="playlist-remove" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={handleShowSortTab}>
          <MaterialIcons name="edit-note" size={20} color="white" />
        </TouchableOpacity>
      </View>
  </View>
);

export default MangaListHeader;
