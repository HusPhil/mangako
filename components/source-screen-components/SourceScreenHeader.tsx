import React from "react";
import { Text, View } from "react-native";

interface SourceScreenHeaderProps {}

const CategoryScreenHeader = ({}: SourceScreenHeaderProps) => {
  return (
    <View className="mb-3">
      <Text className="text-muted font-lg font-extrabold tracking-[1.2px] uppercase">
        Manage & Select
      </Text>
      <Text className="text-white text-4xl font-black mt-1 tracking-tight">
        Sources
      </Text>
    </View>
  );
};

export default CategoryScreenHeader;
