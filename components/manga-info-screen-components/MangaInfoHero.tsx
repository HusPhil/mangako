// components/MangaInfoScreenComponents/HeroSection.tsx
import { Colors } from "@/constants/colors";
import { useLibraryStore } from "@/stores/library-store";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MangaInfoHeroSectionProps {
  mangaCover: string;
  mangaTitle: string;
  mangaAuthor: string;
  mangaSynopsis: string;
  mangaStatus: string;
  mangaTags: string[];
  mangaAlternativeNames: string[];
  mangaSourceId: string;
  readChaptersCount: number;
  totalChapters: number;
  mangaRating: string;
  scrollY: SharedValue<number>;
  HERO_HEIGHT: number;
  onBack: () => void;
  onAddToLibrary: () => void;
}

const MangaInfoHeroSection = memo(
  ({
    mangaCover,
    mangaTitle,
    mangaAuthor,
    mangaSynopsis,
    mangaStatus,
    mangaTags,
    mangaRating,
    mangaSourceId,
    readChaptersCount,
    totalChapters,
    scrollY,
    HERO_HEIGHT,
    onBack,
    onAddToLibrary,
  }: MangaInfoHeroSectionProps) => {
    const insets = useSafeAreaInsets();
    const animatedCoverStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        scrollY.value,
        [0, HERO_HEIGHT * 0.25],
        [0, -40],
        Extrapolation.CLAMP,
      );
      return {
        transform: [{ translateY }],
      };
    });

    const animatedInfoStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, HERO_HEIGHT * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
      return { opacity, pointerEvents: opacity > 0.3 ? "auto" : "none" };
    });

    return (
      <>
        <View
          style={{ height: HERO_HEIGHT }}
          className="relative w-full overflow-hidden"
        >
          <Animated.View style={[StyleSheet.absoluteFill]}>
            <Image
              source={mangaCover}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={3}
              recyclingKey="hero-blur"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", Colors.background]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Back & Fav Buttons */}
          <View
            style={{ paddingTop: insets.top + 16 }}
            className="absolute top-0 left-0 right-0 z-20 flex-row justify-between px-6"
          >
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center border border-white/10"
            >
              <Octicons name="chevron-left" size={22} color="white" />
            </Pressable>
            <Pressable
              className="w-10 h-10  rounded-full bg-secondary/10 items-center justify-center border border-white/10"
              onPress={onAddToLibrary}
              onLongPress={() => useLibraryStore.getState().resetMangaLibrary()}
            >
              <Octicons
                style={{ marginTop: 2 }}
                name="heart"
                size={18}
                color="white"
              />
            </Pressable>
          </View>

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              animatedInfoStyle,
              animatedCoverStyle,
            ]}
            className="justify-end items-center px-6 pb-8"
          >
            {/* Parallax Cover */}
            <Animated.View className="shadow-2xl rounded-lg overflow-hidden w-44 aspect-[2/3] border border-white/20">
              <Image
                source={mangaCover}
                style={{ width: "100%", height: "100%" }}
              />
            </Animated.View>

            <Text
              numberOfLines={3}
              className="w-[75%] max-w-md text-xl font-bold text-white text-center mt-6 tracking-tight"
            >
              {mangaTitle}
            </Text>

            <View className="flex-row items-center bg-white/10 self-center px-3 py-1.5 rounded-md border border-white/10 mt-4">
              <Text className="text-[10px] font-bold text-primary uppercase  tracking-widest">
                {mangaSourceId.trim().replace("_", " ")}
              </Text>
            </View>

            <Text className="text-xs text-gray-400 uppercase mt-2 font-medium">
              By {mangaAuthor}
            </Text>

            <Pressable className="px-8 gap-2 max-w-xs bg-white py-3 rounded-2xl mt-5 flex-row items-center justify-center active:scale-95">
              {/* The Icon: 'book-open-page-variant' gives a premium reader feel */}
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={22}
                color="black"
                style={{ marginBottom: 3 }}
              />

              <Text className="text-black text-center font-bold uppercase text-base tracking-tighter">
                CONTINUE NOW
              </Text>
            </Pressable>

            {/* PROGRESS SECTION */}
            {readChaptersCount > 0 && (
              <View className="w-full max-w-[280px] mt-5 px-1">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-[10px] font-bold text-muted/85 uppercase">
                    Progress
                  </Text>
                  <Text className="text-[10px] font-bold text-muted uppercase">
                    {`${readChaptersCount} / ${totalChapters}`}
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${(readChaptersCount / totalChapters) * 100}%`,
                    }}
                    className="h-full bg-primary rounded-full"
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </View>

        {/* SYNOPSIS */}
        <View className="px-6 py-8">
          {mangaSynopsis ? (
            <>
              <Text className="text-[10px] font-bold text-gray-500 uppercase mb-3">
                Synopsis
              </Text>
              <Text className="text-gray-200 leading-6 font-light text-sm">
                {mangaSynopsis}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-[10px] font-bold text-gray-500 uppercase mb-3">
                Synopsis
              </Text>
              <Text className="text-gray-200 leading-6 font-light text-sm">
                No Synopsis Available
              </Text>
            </>
          )}

          {/* METADATA GRID */}
          <View className="flex-row border-y border-white/5 py-8 mt-10 mb-2">
            <View className="flex-1 items-center">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.accent}
              />
              <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                Status
              </Text>
              <Text className="text-sm font-semibold text-white">
                {mangaStatus}
              </Text>
            </View>
            {/* <View className="flex-1 items-center border-x border-white/5">
              <Ionicons name="star" size={20} color="#eab308" />
              <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                Rating
              </Text>
              <Text className="text-sm font-semibold text-white">
                {mangaRating}
              </Text>
            </View> */}
            <View className="flex-1 items-center">
              <MaterialCommunityIcons
                name="layers-outline"
                size={20}
                color={Colors.accent}
              />
              <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                Genre
              </Text>
              <Text className="text-sm font-semibold text-white">
                {mangaTags[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* CHAPTERS HEADER */}
        <View className="px-6 pb-4 flex-row justify-between items-center">
          <Text className="text-xl font-bold text-white">Chapters</Text>
          <Text className="text-xs text-gray-500">{`${totalChapters} Chapters`}</Text>
        </View>
      </>
    );
  },
);

export default MangaInfoHeroSection;
