import React from "react";
import { Text, View } from "react-native";

interface CategoryScreenHeaderProps {}

const CategoryScreenHeader = ({}: CategoryScreenHeaderProps) => {
  return (
    <View className="mb-3">
      <Text className="text-muted font-lg font-extrabold tracking-[1.2px] uppercase">
        Organize Library
      </Text>
      <Text className="text-white text-4xl font-black mt-1 tracking-tight">
        Categories
      </Text>
    </View>
  );
};

export default CategoryScreenHeader;
