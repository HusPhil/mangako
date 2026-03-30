import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface ReaderSettingReadModesProps {
  isVisible: boolean;
  onClose: () => void;
}
type ReadingMode = "Webtoon" | "Manga" | "Manhwa";
const ReaderSettingReadModes = ({
  isVisible,
  onClose,
}: ReaderSettingReadModesProps) => {
  const [selectedMode, setSelectedMode] = useState<ReadingMode>("Webtoon");
  const modes: {
    id: ReadingMode;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }[] = [
    { id: "Webtoon", icon: "reorder-three-outline", label: "Webtoon" },
    { id: "Manga", icon: "book-outline", label: "Manga" },
    { id: "Manhwa", icon: "document-text-outline", label: "Manhwa" },
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
              const isActive = selectedMode === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => console.log(mode.id)}
                  className={`flex-1 py-4 items-center rounded-xl transition-all ${
                    isActive ? "bg-[#3A3A3C] shadow-sm" : ""
                  }`}
                >
                  <Ionicons
                    name={mode.icon}
                    size={20}
                    color={isActive ? "#FFFFFF" : "#636366"}
                  />
                  <Text
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isActive ? "text-white" : "text-[#636366]"
                    }`}
                  >
                    {mode.label}
                  </Text>
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <View className="h-1 w-1 bg-blue-500 rounded-full mt-1" />
                  )}
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
