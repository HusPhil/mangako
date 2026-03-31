import { useReaderSettingsStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface HorizontalReaderProps {}

const HorizontalReader = ({}: HorizontalReaderProps) => {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>HorizontalReader</Text>
      <Pressable
        className="p-5 bg-white"
        onPress={() =>
          useReaderSettingsStore.getState().setReadingMode("vertical")
        }
      >
        <Text>Vertical</Text>
      </Pressable>
    </View>
  );
};

export default HorizontalReader;
