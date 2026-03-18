import MangaInfoLoader from "@/components/MangaInfoScreenComponents/MangaInfoLoader";
import MangaStickyHeader from "@/components/MangaInfoScreenComponents/MangaInfoStickyHeader";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
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
  // const listHeader = useMemo(
  //   () => (
  //     <ListHeader
  //       mangaCover={mangaCover}
  //       mangaTitle={mangaTitle}
  //       heroScale={heroScale}
  //       onBack={handleBack}
  //     />
  //   ),
  //   [mangaCover, mangaTitle, heroScale, handleBack],
  // );

  if (!isReady) return <MangaInfoLoader />;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <MangaStickyHeader
        mangaCover={mangaCover}
        mangaTitle={mangaTitle}
        stickyHeaderOpacity={stickyHeaderOpacity}
      />

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
        // ListHeaderComponent={listHeader}
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

export default MangaInfoScreen;
