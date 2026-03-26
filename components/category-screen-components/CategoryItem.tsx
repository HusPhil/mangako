import { useCategoryStore } from "@/stores/categories-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CategoryItemProps {
  id: string;
  title: string;
  isFirst: boolean;
  isLast: boolean;
}

const CategoryItem = ({ id, title, isFirst, isLast }: CategoryItemProps) => {
  const moveCategory = useCategoryStore((state) => state.moveCategory);
  return (
    <View className="flex-row items-center justify-between p-3 bg-background rounded-2xl border border-white/5">
      <View className="flex-row items-center flex-1 gap-3">
        {/* Rearrange Handle */}
        <View className="flex-row items-center py-1 px-1.5 rounded-xl border border-white/10 bg-secondary">
          <TouchableOpacity
            onPress={() => moveCategory(id, "up")}
            disabled={isFirst}
            className="disabled:opacity-35"
          >
            <MaterialCommunityIcons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white/30 text-base mx-1 font-plight -top-0.5">
            |
          </Text>

          <TouchableOpacity
            onPress={() => moveCategory(id, "down")}
            disabled={isLast}
            className="disabled:opacity-35"
          >
            <MaterialCommunityIcons
              name="arrow-down"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className="text-white text-lg font-pbold" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-0.5">
        <TouchableOpacity
          activeOpacity={0.7}
          className="p-2"
          onPress={() =>
            useCategoryScreenUIStore.getState().openModal("edit_category", {
              categoryId: id,
              categoryName: title,
            })
          }
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color="#CDCDE0"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="p-2"
          onPress={() =>
            useCategoryScreenUIStore.getState().openModal("delete_confirm", {
              categoryId: id,
              categoryName: title,
            })
          }
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color="#FC3B2C"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryItem;
