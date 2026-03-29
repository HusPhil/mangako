import React from "react";
import { Text, View } from "react-native";

interface PageIndicatorProps {
  currentPageIndex: number;
  totalPages: number;
}

const PageIndicator = ({
  currentPageIndex,
  totalPages,
}: PageIndicatorProps) => {
  return (
    <View className="absolute bottom-0 right-0 w-full pb-10 items-center opacity-80">
      <View
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 2,
        }}
      >
        <Text className="text-white text-xs font-bold">
          {currentPageIndex + 1} / {totalPages}
        </Text>
      </View>
    </View>
  );
};

export default PageIndicator;
