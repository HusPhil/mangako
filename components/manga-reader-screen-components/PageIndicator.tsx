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
      <Text
        className="text-white text-xs font-bold"
        style={{
          textShadowColor: "rgba(0, 0, 0, 1)",
          textShadowOffset: { width: 0, height: 0.5 },
          textShadowRadius: 1,
        }}
      >
        {currentPageIndex + 1} / {totalPages}
      </Text>
    </View>
  );
};

export default PageIndicator;
