import {
    useReaderSessionStore,
    useReaderSettingsStore,
} from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Interface for Reading Mode structure

// Props Interface
interface ReaderSettingsOverlayProps {
  mangaId: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNavigateToPrev: () => void;
  onNavigateToNext: () => void;
  onJumpToPage: (page: number) => void;
}

const ReaderSettingsOverlay: React.FC<ReaderSettingsOverlayProps> = ({
  mangaId,

  canGoNext,
  canGoPrev,
  onNavigateToPrev,
  onNavigateToNext,
  onJumpToPage,
}) => {
  const insets = useSafeAreaInsets();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const currentChapter = useReaderSessionStore((state) => state.currentChapter);

  const chapterTitle = currentChapter?.chapterTitle;
  const chapterId = currentChapter?.chapterId;
  const chapterUrl = currentChapter?.chapterUrl;

  const currentPage = useReaderSessionStore((state) => state.currentPageIndex);
  const totalPages = useReaderSessionStore((state) => state.totalPages);
  const readingMode = useReaderSettingsStore((state) => state.readingMode);

  // State for slider interactions
  const [sliderValue, setSliderValue] = useState(currentPage);
  const isSliding = useRef(false);

  // Sync local slider with parent prop
  useEffect(() => {
    if (!isSliding.current && currentPage !== undefined) {
      setSliderValue(currentPage);
    }
  }, [currentPage]);

  // Check if we are in RTL / Inverted mode
  const isRTL = readingMode.includes("rtl");

  // Common class for the glass background
  const glassBackgroundClass = "bg-[#1C1C1E]/90";

  if (!currentChapter) {
    return null; // or a fallback UI
  }

  return (
    <>
      {/* --- TOP BAR --- */}
      <View
        className={`absolute top-0 w-full z-50 flex-row items-center justify-between p-5 border-b border-white/15 ${glassBackgroundClass}`}
        style={Platform.OS === "ios" ? { paddingTop: insets.top } : {}}
      >
        <Pressable className="p-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={25} color="white" />
        </Pressable>

        <View className="flex-1 mx-5">
          <Text
            numberOfLines={1}
            className="text-white text-center font-medium text-[15px]"
          >
            {chapterTitle}
          </Text>
        </View>

        <Pressable className="p-2" onPress={() => setSettingsVisible(true)}>
          <Ionicons name="options-outline" size={22} color="white" />
        </Pressable>
      </View>

      {/* --- BOTTOM AREA --- */}
      <View
        className={`absolute bottom-0 w-full z-50 border-t border-white/15 ${glassBackgroundClass}`}
        style={Platform.OS === "ios" ? { paddingBottom: insets.bottom } : {}}
      >
        {/* NATIVE SLIDER */}
        <View
          className="px-5 pt-5 pb-1"
          // We keep transform in style because dynamic scaling in NativeWind is verbose
          style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
        >
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={totalPages - 1}
            step={1}
            value={sliderValue}
            onSlidingStart={() => {
              isSliding.current = true;
            }}
            onValueChange={(val) => {
              setSliderValue(val);
            }}
            onSlidingComplete={(val) => {
              if (onJumpToPage) {
                onJumpToPage(val);
              }
              setTimeout(() => {
                isSliding.current = false;
              }, 100);
            }}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
            thumbTintColor="#FFFFFF"
            tapToSeek={true}
          />
        </View>

        {/* NAV BUTTONS */}
        <View className="flex-row items-center justify-between px-5 pb-4">
          {/* LEFT BUTTON (Prev or Next based on RTL) */}
          <Pressable
            onPress={isRTL ? onNavigateToNext : onNavigateToPrev}
            disabled={isRTL ? !canGoNext : !canGoPrev}
            className={`p-2 flex-row items-center`}
          >
            <MaterialCommunityIcons
              name={"skip-previous"}
              size={32}
              color="white"
              style={{
                opacity: isRTL
                  ? !canGoNext
                    ? 0.5
                    : 1.0
                  : !canGoPrev
                    ? 0.5
                    : 1.0,
              }}
            />
            <Text
              style={{
                opacity: isRTL
                  ? !canGoNext
                    ? 0.5
                    : 1.0
                  : !canGoPrev
                    ? 0.5
                    : 1.0,
              }}
              className="text-white font-bold ml-1"
            >
              {isRTL ? "Next" : "Prev"}
            </Text>
          </Pressable>

          {/* PAGE COUNT */}
          <Text className="text-white font-bold text-sm tracking-widest">
            {Math.round(sliderValue) + 1}{" "}
            <Text className="text-white/40 font-normal">/</Text> {totalPages}
          </Text>

          {/* RIGHT BUTTON (Next or Prev based on RTL) */}
          <Pressable
            onPress={isRTL ? onNavigateToPrev : onNavigateToNext}
            disabled={isRTL ? !canGoPrev : !canGoNext}
            className={`p-2 flex-row items-center`}
          >
            <Text
              className={`text-white font-bold mr-1 `}
              style={{
                opacity: isRTL
                  ? !canGoPrev
                    ? 0.5
                    : 1.0
                  : !canGoNext
                    ? 0.5
                    : 1.0,
              }}
            >
              {isRTL ? "Prev" : "Next"}
            </Text>
            <MaterialCommunityIcons
              name={"skip-next"}
              size={32}
              color="white"
              style={{
                opacity: isRTL
                  ? !canGoPrev
                    ? 0.5
                    : 1.0
                  : !canGoNext
                    ? 0.5
                    : 1.0,
              }}
            />
          </Pressable>
        </View>
      </View>

      {/* --- MODAL --- */}
      <Modal
        animationType="fade"
        transparent
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/70 px-5 active:opacity-90"
          onPress={() => setSettingsVisible(false)}
        >
          <Pressable
            className="max-w-md w-full bg-primary/95 rounded-md border border-white/30"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-8">
              <Text className="text-white/75 text-md text-center uppercase mb-5 font-bold">
                Settings
              </Text>

              {/* Reading Mode Row */}
              {/* <View className="flex-row bg-black/50 p-3 rounded-md mb-3">
                {["Manga", "Normal", "Vertical"].map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() =>
                      onSelectReadingMode?.(
                        READER_MODES.find(
                          (m) => m.label === mode,
                        ) as ReaderMode,
                      )
                    }
                    disabled={mode === readingMode.label}
                    className={`flex-1 py-3 items-center rounded-2xl ${
                      mode === readingMode.label ? "bg-white" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        mode === readingMode.label
                          ? "text-black"
                          : "text-white/75"
                      }`}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                ))}
              </View> */}

              {/* Toggles Grid */}
              {/* <View className="flex-row gap-3 mb-5">
                <Pressable
                  className={`flex-1 p-3 rounded-lg border items-center justify-center border-white/20 ${
                    imageDownscalingAllowed ? "bg-white/15" : ""
                  }`}
                  onPress={onToggleImageDownscaling}
                >
                  <MaterialIcons
                    name={imageDownscalingAllowed ? "hd" : "hdr-off"}
                    size={24}
                    color="white"
                  />
                  <Text className="text-xs font-bold mt-2 text-white/75">
                    HD (Unstable)
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 p-3 rounded-lg border items-center justify-center border-white/20 ${
                    isChapterRead ? "bg-white/15" : ""
                  }`}
                  onPress={handleMarkAsRead}
                >
                  <MaterialCommunityIcons
                    name={isChapterRead ? "bookmark-check" : "bookmark-outline"}
                    size={24}
                    color="white"
                  />
                  <Text className="text-xs font-bold mt-2 text-white/75">
                    Finished
                  </Text>
                </Pressable>
              </View> */}

              <Pressable
                className="bg-white p-3 rounded-lg"
                onPress={() => setSettingsVisible(false)}
              >
                <Text className="text-md font-bold text-black text-center">
                  DONE
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default ReaderSettingsOverlay;
