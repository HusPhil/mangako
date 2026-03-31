import {
  ReadingMode,
  useReaderSettingsStore,
} from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface ReaderSettingReadModesProps {
  mangaId: string;
  isVisible: boolean;
  onClose: () => void;
}
const ReaderSettingReadModes = ({
  mangaId,
  isVisible,
  onClose,
}: ReaderSettingReadModesProps) => {
  const readingMode = useReaderSettingsStore((state) =>
    state.getReadingMode(mangaId),
  );
  const setReadingMode = useReaderSettingsStore(
    (state) => state.setReadingMode,
  );
  const modes: {
    id: ReadingMode;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }[] = [
    { id: "vertical", icon: "reorder-three-outline", label: "Webtoon" },
    { id: "horizontal-rtl", icon: "book-outline", label: "Manga" },
    { id: "horizontal-ltr", icon: "document-text-outline", label: "Manhua" },
  ];
  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 z-50 justify-center items-center px-3">
      {/* Backdrop */}
      <Pressable className="absolute inset-0 bg-black/80" onPress={onClose} />

      {/* Sheet / Dialog */}
      <View className="w-full max-w-sm bg-[#1C1C1E] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl">
        <View className="p-6">
          <Text className="text-white/40 text-[10px] text-center uppercase mb-6 font-black tracking-[2px]">
            Reading Direction
          </Text>

          {/* Segmented Control UI */}
          <View className="flex-row bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            {modes.map((mode) => {
              const isActive = readingMode === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => setReadingMode(mangaId, mode.id)}
                  className={`flex-1 py-3 items-center rounded-xl ${
                    isActive ? "bg-[#3A3A3C]" : ""
                  }`}
                >
                  <Ionicons
                    name={mode.icon}
                    size={20}
                    color={isActive ? "#FFFFFF" : "#636366"}
                  />
                  <Text
                    className={`text-[11px] font-semibold mt-1 ${
                      isActive ? "text-white" : "text-[#636366]"
                    }`}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Done Button */}
          <Pressable
            className="bg-white active:bg-gray-200 py-4 rounded-2xl shadow-lg"
            onPress={onClose}
          >
            <Text className="text-sm font-bold text-black text-center tracking-tight">
              Apply Settings
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default ReaderSettingReadModes;
