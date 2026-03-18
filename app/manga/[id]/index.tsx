import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.65;

const MangaInfoScreen = () => {
  const router = useRouter();
  const {
    mangaTitle,
    mangaUrl,
    id: mangaId,
  } = useLocalSearchParams<{
    mangaTitle: string;
    mangaUrl: string;
    id: string;
  }>();

  // 1. Scroll Tracker
  const scrollY = useRef(new Animated.Value(0)).current;

  // 2. Interpolations for the Sticky Header
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: "clamp",
  });

  // Dummy Chapter Data
  const chapters = Array.from({ length: 20 }, (_, i) => ({
    id: (124 - i).toString(),
    title: `Chapter ${124 - i}`,
    sub: i === 0 ? "The Final Threshold" : "Broken Vows",
    date: i === 0 ? "Today" : "Oct 24, 2023",
    isNew: i === 0,
    isRead: i > 3,
  }));

  const renderItem = ({ item }: { item: (typeof chapters)[0] }) => (
    <Pressable className="flex-row justify-between py-5 px-6 border-b border-white/5 active:bg-white/10">
      <View className="flex-1">
        <Text
          className={`font-medium ${item.isRead ? "text-gray-500" : "text-white"}`}
        >
          {item.title}
        </Text>
        <Text
          className={`text-xs mt-1 ${item.isRead ? "text-gray-600 italic" : "text-gray-500"}`}
        >
          {item.isRead ? "Read" : item.sub}
        </Text>
      </View>
      <View className="items-end justify-center">
        {item.isNew && (
          <Text className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter mb-1">
            New
          </Text>
        )}
        <Text className="text-[10px] text-gray-500">{item.date}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-black">
      {/* --- STICKY MINI HEADER --- */}
      <Animated.View
        style={[styles.stickyHeader, { opacity: stickyHeaderOpacity }]}
        className="z-50 flex-row items-center px-6 pt-14 pb-4 border-b border-white/10 bg-black"
      >
        <Image
          source={mangaUrl}
          style={{ width: 36, height: 36, borderRadius: 4 }}
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {mangaTitle}
          </Text>
          <Text className="text-[10px] text-gray-400 uppercase">
            Chapter 124 • Today
          </Text>
        </View>
        <Pressable className="bg-white px-5 py-2 rounded-full active:scale-95">
          <Text className="text-black text-xs font-bold">Read</Text>
        </Pressable>
      </Animated.View>

      {/* --- FLASH LIST --- */}
      <FlashList
        data={chapters}
        renderItem={renderItem}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        ListHeaderComponent={
          <>
            {/* HERO CONTAINER */}
            <View
              style={{ height: HERO_HEIGHT }}
              className="relative w-full overflow-hidden"
            >
              <Animated.View
                style={{ flex: 1, transform: [{ scale: heroScale }] }}
              >
                <Image
                  source={mangaUrl}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={15}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)", "black"]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Back & Fav Buttons */}
              <View className="absolute top-14 left-0 right-0 z-20 flex-row justify-between px-6">
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </Pressable>
                <Pressable className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10">
                  <Ionicons name="heart-outline" size={22} color="white" />
                </Pressable>
              </View>

              <View className="absolute inset-0 justify-end items-center px-6 pb-8">
                <View className="shadow-2xl rounded-lg overflow-hidden w-44 aspect-[2/3] border border-white/20">
                  <Image
                    source={mangaUrl}
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>
                <Text
                  numberOfLines={3}
                  className="w-[75%] max-w-md text-3xl font-bold text-white text-center mt-6 tracking-tight"
                >
                  {mangaTitle}
                </Text>
                <Text className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-medium">
                  By Haruki Yoshida
                </Text>
                <Pressable
                  // 'w-full' fills the container, but 'max-w-[280px]' stops it from growing too much
                  className="w-4/5 max-w-xs bg-white py-4 rounded-full mt-8 active:scale-95 shadow-lg"
                  style={({ pressed }) => [
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                  ]}
                >
                  <Text className="text-black text-center font-bold text-lg">
                    Read Chapter 1
                  </Text>
                </Pressable>
                {/* --- PROGRESS SECTION --- */}
                <View className="w-full max-w-[280px] mt-6 px-1">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[10px] font-bold text-muted/85 uppercase tracking-widest">
                      Progress
                    </Text>
                    <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">
                      53 / 124
                    </Text>
                  </View>

                  {/* Progress Bar Track */}
                  <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    {/* Progress Bar Fill */}
                    <View
                      style={{ width: `${(53 / 124) * 100}%` }}
                      className="h-full bg-indigo-400 rounded-full"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* SYNOPSIS */}
            <View className="px-6 py-8">
              <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Synopsis
              </Text>
              <Text className="text-gray-200 leading-6 font-light text-sm">
                In a world where memories can be harvested and sold, a young
                scavenger discovers a forbidden fragment belonging to the last
                king...
              </Text>

              {/* METADATA GRID (Added back) */}
              <View className="flex-row border-y border-white/5 py-8 mt-10 mb-2">
                <View className="flex-1 items-center">
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#818cf8"
                  />
                  <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                    Status
                  </Text>
                  <Text className="text-sm font-semibold text-white">
                    Ongoing
                  </Text>
                </View>
                <View className="flex-1 items-center border-x border-white/5">
                  <Ionicons name="star" size={20} color="#eab308" />
                  <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                    Rating
                  </Text>
                  <Text className="text-sm font-semibold text-white">4.9</Text>
                </View>
                <View className="flex-1 items-center">
                  <MaterialCommunityIcons
                    name="layers-outline"
                    size={20}
                    color="#818cf8"
                  />
                  <Text className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">
                    Genre
                  </Text>
                  <Text className="text-sm font-semibold text-white">
                    Sci-Fi
                  </Text>
                </View>
              </View>
            </View>

            {/* CHAPTERS HEADER */}
            <View className="px-6 pb-4 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-white">Chapters</Text>
              <Text className="text-xs text-gray-500">124 Chapters</Text>
            </View>
          </>
        }
      />

      {/* --- FLOATING ACTION BUTTON --- */}
      <View className="absolute bottom-10 right-6">
        <Pressable
          className="bg-white w-14 h-14 rounded-full items-center justify-center shadow-2xl active:scale-90"
          style={{
            elevation: 10,
            shadowColor: "#000",
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Ionicons name="add" size={30} color="black" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});

export default MangaInfoScreen;
