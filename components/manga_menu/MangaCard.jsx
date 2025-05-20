import { images } from "@/constants";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

const MangaCard = ({
  mangaId,
  mangaUrl,
  containerStyles,
  coverStyles,
  mangaTitle,
  mangaCover,
  mangaDetails,
  autoload,
  children,
  disabled,
}) => {
  const handlePress = () => {
    if (!mangaDetails) {
      router.push({
        pathname: "screens/manga_info",
        params: {
          mangaId: mangaId,
          mangaCover: mangaCover,
          mangaTitle: mangaTitle,
          mangaUrl: mangaUrl || "NONE",
        },
      });
    }
  };

  const source = autoload ? null : mangaCover;

  return (
    <TouchableOpacity
      className={`${containerStyles} rounded-md overflow-hidden bg-accent-100 border-2 border-accent-100 disabled:bg-gray-700 disabled:border-gray-500`}
      onPress={handlePress}
      disabled={disabled}
    >
      {source ? (
        <ImageBackground
          source={{
            uri: source ?? images.test,
            headers: {
              Referer: "https://www.mangakakalot.gg/",
              "User-Agent": "Mozilla/5.0 (ExpoApp)",
            },
          }}
          className={`${coverStyles} relative`}
          contentFit="cover"
        >
          <View className="justify-end h-full bg-acc">{children}</View>
        </ImageBackground>
      ) : (
        <View className="justify-end h-full bg-acc" />
      )}
    </TouchableOpacity>
  );
};

export default MangaCard;
