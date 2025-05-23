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
        pathname: "/manga/" + mangaId,
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
      <ImageBackground
        source={{ uri: `https://mangako-worker.manga-image-proxy.workers.dev/?url=${encodeURIComponent(mangaCover)}` }}
        className={`${coverStyles} relative`}
        // style={{
        //   width: "100%",
        //   height: "100%",
        // }}
        onError={(e) => {
          // console.error("Error loading manga cover", e);
        }}
        contentFit="cover"
      >
        <View className="justify-end h-full bg-acc">{children}</View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default MangaCard;
