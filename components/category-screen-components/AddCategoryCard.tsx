import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AddCategoryCardProps {}

const AddCategoryCard = ({}: AddCategoryCardProps) => {
  return (
    <View className="mt-10 p-8 border-2 border-muted border-dashed rounded-xl items-center justify-center">
      <Text className="text-white text-xl font-pbold">
        Create a New Category
      </Text>
      <Text className="text-gray-100 text-sm text-center mt-2 max-w-[240px] leading-5 font-pregular">
        Categories help you find exactly what you want to read.
      </Text>
      <TouchableOpacity
        className="mt-6 bg-white px-8 py-3.5 rounded-full"
        activeOpacity={0.8}
        onPress={() =>
          useCategoryScreenUIStore.getState().openModal("add_category")
        }
      >
        <Text className="text-black font-pextrabold text-[15px]">
          Add Category
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddCategoryCard;
