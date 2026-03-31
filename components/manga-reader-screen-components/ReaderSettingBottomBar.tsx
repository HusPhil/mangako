import {
  useReaderSessionStore,
  useReaderSettingsStore,
} from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReaderSettingBottomBarProps {
  onOpenSettings: () => void;
  onNavigateToPrev: () => void;
  onNavigateToNext: () => void;
  onJumpToPage: (page: number) => void;
}

const ReaderSettingBottomBar = ({
  onOpenSettings,
  onNavigateToPrev,
  onNavigateToNext,
  onJumpToPage,
}: ReaderSettingBottomBarProps) => {
  const insets = useSafeAreaInsets();
  const currentPage = useReaderSessionStore((s) => s.currentPageIndex);
  const totalPages = useReaderSessionStore((s) => s.totalPages);
  const readingMode = useReaderSettingsStore((s) => s.readingMode);

  const [sliderValue, setSliderValue] = useState(currentPage);
  const isSliding = useRef(false);
  const isRTL = readingMode.includes("rtl");

  const canGoNext = useReaderSessionStore((s) => s.canGoNext);
  const canGoPrev = useReaderSessionStore((s) => s.canGoPrev);

  useEffect(() => {
    if (!isSliding.current) setSliderValue(currentPage);
  }, [currentPage]);

  return (
    <>
      <View
        className="absolute right-6 z-50 pb-10"
        style={{
          // Dynamic positioning based on safe areas
          bottom: Platform.OS === "ios" ? insets.bottom + 105 : 120,
          // Add a native shadow for Android, tailwind shadow-xl for iOS
        }}
      >
        <Pressable
          // Trigger your reading mode settings or cycle logic here
          onPress={() => onOpenSettings()}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.92 : 1 }],
            opacity: pressed ? 0.9 : 1,
          })}
          className="w-14 h-14 rounded-full items-center justify-center bg-[#2C2C2E] border border-white/20"
        >
          <Octicons name="gear" size={22} color="white" />
        </Pressable>
      </View>

      <View
        className="absolute bottom-0 w-full z-50 border-t border-white/15 bg-[#1C1C1E]/90"
        style={
          Platform.OS === "ios"
            ? { paddingBottom: insets.bottom }
            : { paddingBottom: 12 }
        }
      >
        <View
          className="px-5 pt-5 pb-1"
          style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
        >
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={Math.max(totalPages - 1, 1)}
            step={1}
            value={sliderValue}
            onSlidingStart={() => {
              isSliding.current = true;
            }}
            onValueChange={setSliderValue}
            onSlidingComplete={(val) => {
              onJumpToPage(val);
              setTimeout(() => {
                isSliding.current = false;
              }, 100);
            }}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#FFFFFF"
            tapToSeek
          />
        </View>

        <View className="flex-row items-center justify-between px-5 pb-4">
          <Pressable
            onPress={isRTL ? onNavigateToNext : onNavigateToPrev}
            disabled={isRTL ? !canGoNext : !canGoPrev}
            className="p-2 flex-row items-center"
          >
            <MaterialCommunityIcons
              name="skip-previous"
              size={32}
              color="white"
              style={{ opacity: (isRTL ? !canGoNext : !canGoPrev) ? 0.5 : 1 }}
            />
            <Text
              className="text-white font-bold ml-1"
              style={{ opacity: (isRTL ? !canGoNext : !canGoPrev) ? 0.5 : 1 }}
            >
              {isRTL ? "Next" : "Prev"}
            </Text>
          </Pressable>

          <Text className="text-white font-bold text-sm tracking-widest">
            {Math.round(sliderValue) + 1}{" "}
            <Text className="text-white/40 font-normal">/</Text> {totalPages}
          </Text>

          <Pressable
            onPress={isRTL ? onNavigateToPrev : onNavigateToNext}
            disabled={isRTL ? !canGoPrev : !canGoNext}
            className="p-2 flex-row items-center"
          >
            <Text
              className="text-white font-bold mr-1"
              style={{ opacity: (isRTL ? !canGoPrev : !canGoNext) ? 0.5 : 1 }}
            >
              {isRTL ? "Prev" : "Next"}
            </Text>
            <MaterialCommunityIcons
              name="skip-next"
              size={32}
              color="white"
              style={{ opacity: (isRTL ? !canGoPrev : !canGoNext) ? 0.5 : 1 }}
            />
          </Pressable>
        </View>
      </View>
    </>
  );
};

export default ReaderSettingBottomBar;
