import { Colors } from "@/constants/colors";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import { Source, SourceStatus } from "@/types/ResponseTypes";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface SourceItemProps {
  source: Source;
}

const getStatusStyles = (status: SourceStatus) => {
  switch (status) {
    case SourceStatus.READY_TO_USE:
      return {
        container: "bg-emerald-500/10 border-emerald-500/20",
        text: "text-emerald-500",
        dot: "bg-emerald-500",
      };
    case SourceStatus.IN_DEVELOPMENT:
      return {
        container: "bg-amber-500/10 border-amber-500/20",
        text: "text-amber-500",
        dot: "bg-amber-500",
      };
    case SourceStatus.DEPRECATED:
      return {
        container: "bg-rose-500/10 border-rose-500/20",
        text: "text-rose-500",
        dot: "bg-rose-500",
      };
    default:
      return {
        container: "bg-white/5 border-white/10",
        text: "text-white/40",
        dot: "bg-white/20",
      };
  }
};

const SourceItem = ({ source }: SourceItemProps) => {
  const currentSource = useSourceSelectionStore(
    (state) => state.currentSelectedSource,
  );

  const handleOnSelectSource = () => {
    useSourceSelectionStore.getState().setCurrentSelectedSource(source);
    router.back();
  };

  const isSelected = currentSource?.sourceId === source.sourceId;

  const statusStyle = getStatusStyles(source.sourceStatus as SourceStatus);

  return (
    <Pressable
      onPress={handleOnSelectSource}
      style={({ pressed }) => [
        { opacity: pressed ? 0.9 : 1 },
        isSelected ? { borderColor: Colors.primary + "40" } : {},
      ]}
      className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl border ${
        isSelected
          ? "bg-primary/5 border-primary"
          : "bg-background border-white/5"
      }`}
    >
      <View className="flex-row items-center flex-1 gap-3">
        <View className="flex-1">
          <Text
            className={`text-lg font-bold ${isSelected ? "text-primary" : "text-white"}`}
            numberOfLines={1}
          >
            {source.sourceName}
          </Text>
          {/* Status Badge */}
          <View className="flex-row mt-1">
            <View
              className={`flex-row items-center px-2 py-0.5 rounded-full border ${statusStyle.container}`}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text}`}
              >
                {source.sourceStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {isSelected ? (
          <View className="bg-primary rounded-full p-1">
            <Ionicons name="checkmark" size={16} color="black" />
          </View>
        ) : (
          <Text className="text-white/20 text-xs font-medium">Select</Text>
        )}

        {/* Keep your existing Edit/Delete logic if needed, 
            though usually sources are managed by the system, not users */}
      </View>
    </Pressable>
  );
};

export default SourceItem;
