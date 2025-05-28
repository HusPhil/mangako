import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

interface MangaCardProps {
  mangaId: string;
  mangaUrl: string;
  mangaTitle: string; 
  mangaCover: string;
  children: React.ReactNode;
  containerStyles?: string;
  coverStyles?: string;
  autoload?: boolean;
  disabled?: boolean;
}

const MangaCard = ({
  mangaId,
  mangaUrl,
  containerStyles,
  coverStyles,
  mangaTitle,
  mangaCover,
  autoload,
  children,
  disabled,
}: MangaCardProps) => {
  const handlePress = () => {
    const query = new URLSearchParams({
      mangaCover: mangaCover ?? "",
      mangaTitle: mangaTitle ?? "",
      mangaUrl: mangaUrl ?? "NONE",
    }).toString();

    router.push(
      `/manga/${mangaId}?${query}`
    );
  };

  const source = autoload ? null : mangaCover;

  return (
    <TouchableOpacity
      className={`${containerStyles} rounded-md overflow-hidden bg-accent-100 border-2 border-accent-100 disabled:bg-gray-700 disabled:border-gray-500`}
      onPress={handlePress}
      disabled={disabled}
    >
      <ImageBackground
        source={{ uri: mangaCover }}
        className={`${coverStyles} relative`}
        onError={(e) => {
          console.error("Error loading manga cover", e, mangaCover);
        }}
        contentFit="cover"
      >
        <View className="justify-end h-full bg-acc">{children}</View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default MangaCard;
