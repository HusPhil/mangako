import MangaInfoLoader from "@/components/MangaInfoLoader";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants (computed once at module level, never on render) ───────────────
const SCREEN_HEIGHT = Dimensions.get("window").height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.7;
const ESTIMATED_CHAPTER_ROW_HEIGHT = 72;
const TRANSITION_DEFER_MS = 300; // wait for push animation to finish

// ─── Types ────────────────────────────────────────────────────────────────────
type Chapter = {
  id: string;
  title: string;
  sub: string;
  date: string;
  isNew: boolean;
  isRead: boolean;
};

// ─── Sub-components (defined outside parent to avoid recreation on re-render) ─

const ChapterRow = React.memo(({ item }: { item: Chapter }) => (
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
));

// ─── List Header (memoized so FlashList never remounts it on re-render) ───────
type ListHeaderProps = {
  mangaCover: string;
  mangaTitle: string;
  heroScale: Animated.AnimatedInterpolation<number>;
  onBack: () => void;
};

const ListHeader = React.memo(
  ({ mangaCover, mangaTitle, heroScale, onBack }: ListHeaderProps) => (
    <>
      {/* HERO CONTAINER */}
      <View
        style={{ height: HERO_HEIGHT }}
        className="relative w-full overflow-hidden"
      >
        <Animated.View style={{ flex: 1, transform: [{ scale: heroScale }] }}>
          <Image
            source={mangaCover}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={15}
            recyclingKey="hero-blur"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "black"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Back & Fav Buttons */}
        <View className="absolute top-14 left-0 right-0 z-20 flex-row justify-between px-6">
          <Pressable
            onPress={onBack}
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
              source={mangaCover}
              style={{ width: "100%", height: "100%" }}
              recyclingKey="hero-cover"
            />
          </View>
          <Text
            numberOfLines={3}
            className="w-[75%] max-w-md text-xl font-bold text-white text-center mt-6 tracking-tight"
          >
            {mangaTitle}
          </Text>
          <Text className="text-xs text-gray-400 uppercase mt-2 font-medium">
            By Haruki Yoshida
          </Text>
          <Pressable
            className="w-4/5 max-w-xs bg-white py-4 rounded-full mt-8 active:scale-95 shadow-lg"
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text className="text-black text-center font-bold text-lg">
              Read Chapter 1
            </Text>
          </Pressable>

          {/* PROGRESS SECTION */}
          <View className="w-full max-w-[280px] mt-6 px-1">
            <View className="flex-row justify-between mb-2">
              <Text className="text-[10px] font-bold text-muted/85 uppercase">
                Progress
              </Text>
              <Text className="text-[10px] font-bold text-muted uppercase">
                53 / 124
              </Text>
            </View>
            <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
        <Text className="text-[10px] font-bold text-gray-500 uppercase mb-3">
          Synopsis
        </Text>
        <Text className="text-gray-200 leading-6 font-light text-sm">
          In a world where memories can be harvested and sold, a young scavenger
          discovers a forbidden fragment belonging to the last king...
        </Text>

        {/* METADATA GRID */}
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
            <Text className="text-sm font-semibold text-white">Ongoing</Text>
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
            <Text className="text-sm font-semibold text-white">Sci-Fi</Text>
          </View>
        </View>
      </View>

      {/* CHAPTERS HEADER */}
      <View className="px-6 pb-4 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-white">Chapters</Text>
        <Text className="text-xs text-gray-500">124 Chapters</Text>
      </View>
    </>
  ),
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MangaInfoScreen = () => {
  const router = useRouter();
  const {
    mangaTitle,
    mangaUrl,
    mangaCover,
    id: mangaId,
  } = useLocalSearchParams<{
    mangaTitle: string;
    mangaUrl: string;
    mangaCover: string;
    id: string;
  }>();

  const insets = useSafeAreaInsets();

  // ── Deferred render: let push animation finish before mounting heavy UI ──
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), TRANSITION_DEFER_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── Scroll tracking ──────────────────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;

  const stickyHeaderOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 50],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const heroScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.3, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY],
  );

  // ── Chapter data (memoized — never rebuilt unless deps change) ───────────
  const chapters = useMemo<Chapter[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: (124 - i).toString(),
        title: `Chapter ${124 - i}`,
        sub: i === 0 ? "The Final Threshold" : "Broken Vows",
        date: i === 0 ? "Today" : "Oct 24, 2023",
        isNew: i === 0,
        isRead: i > 3,
      })),
    [],
  );

  // ── Stable render function (memoized so FlashList rows don't re-render) ──
  const renderItem = useCallback(
    ({ item }: { item: Chapter }) => <ChapterRow item={item} />,
    [],
  );

  // ── Stable key extractor ─────────────────────────────────────────────────
  const keyExtractor = useCallback((item: Chapter) => item.id, []);

  // ── Stable back handler ──────────────────────────────────────────────────
  const handleBack = useCallback(() => router.back(), [router]);

  // ── Memoized list header (stable reference = FlashList never remounts it) ─
  const listHeader = useMemo(
    () => (
      <ListHeader
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        heroScale={heroScale}
        onBack={handleBack}
      />
    ),
    [mangaCover, mangaTitle, heroScale, handleBack],
  );

  if (!isReady) return <MangaInfoLoader />;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* STICKY MINI HEADER */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { opacity: stickyHeaderOpacity },
          { paddingTop: insets.top + 15 },
        ]}
        className="z-50 flex-row items-center px-6 p-5 border-b border-white/10 bg-black"
      >
        <Image
          source={mangaCover}
          style={{ width: 50, height: 50, borderRadius: 4 }}
          recyclingKey="sticky-cover"
        />
        <View className="flex-1 mx-5">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {mangaTitle}
          </Text>
          <Text className="text-[10px] text-gray-400 uppercase">
            Chapter 124 • Today
          </Text>
        </View>
        <Pressable
          onPress={() => console.log("Pressed")}
          className="bg-white px-5 py-2 rounded-full active:scale-95"
        >
          <Text className="text-black text-xs font-bold">Read</Text>
        </Pressable>
      </Animated.View>

      {/*
       * FLASH LIST — only mounts after the push animation completes.
       * Until then the screen shows just the black bg, which is imperceptible
       * during the ~300ms slide transition.
       */}
      <FlashList
        data={chapters}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
      />

      {/* FLOATING ACTION BUTTON */}
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
