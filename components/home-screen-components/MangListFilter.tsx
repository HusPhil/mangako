import { useCategoryStore } from "@/stores/categories-store";
import { useLibraryStore } from "@/stores/library-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const MangaListFilter = () => {
  const selectedCategory = useLibraryStore((state) => state.selectedCategory);
  const setSelectedCategory = useLibraryStore(
    (state) => state.setSelectedCategory,
  );
  const categories = useCategoryStore((state) => state.categories);

  const handleCategoryPress = (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(id);
  };

  const handleAddPress = () => {
    useCategoryScreenUIStore.getState().openModal("add_category");
    requestAnimationFrame(() => {
      router.push("/(modals)/category-settings");
    });
  };

  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories]);

  return (
    <View className="bg-background pt-2 pb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, alignItems: "center" }}
      >
        {/* --- Unified Control Hub --- */}
        <View className="flex-row bg-white/5 rounded-xl p-1 border border-white/10 mr-4 items-center">
          {/* Add Category */}
          <Pressable
            onPress={handleAddPress}
            className="w-10 h-10 items-center justify-center rounded-xl active:bg-white/10"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>

          <View className="w-[1px] h-5 bg-white/10 mx-1" />

          {/* Manage Categories */}
          <Pressable
            onPress={() => router.push("/(modals)/category-settings")}
            className="w-10 h-10 items-center justify-center rounded-xl active:bg-white/10"
          >
            <Ionicons name="settings-outline" size={18} color="#A0A0A0" />
          </Pressable>

          <View className="w-[1px] h-5 bg-white/10 mx-1" />

          {/* "View All" Icon Button */}
          <Pressable
            onPress={() => handleCategoryPress(null)}
            className={`w-12 h-10 items-center justify-center rounded-lg  ${
              selectedCategory === null ? "bg-white" : "bg-transparent"
            }`}
          >
            <Ionicons
              name={selectedCategory === null ? "apps" : "apps-outline"}
              size={20}
              color={selectedCategory === null ? "#000000" : "#A0A0A0"}
            />
          </Pressable>
        </View>

        {/* Categories List */}
        <View className="flex-row gap-x-3">
          {categories.map((category) => (
            <FilterChip
              key={category.category_id}
              label={category.name}
              isActive={selectedCategory === category.category_id}
              onPress={() => handleCategoryPress(category.category_id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const FilterChip = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`px-6 h-11 rounded-xl justify-center border ${
      isActive ? "bg-white border-white" : "bg-white/5 border-white/5"
    }`}
    style={({ pressed }) => ({
      opacity: pressed ? 0.8 : 1,
      transform: [{ scale: pressed ? 0.96 : 1 }],
    })}
  >
    <Text
      className={`text-md ${isActive ? "text-black font-bold" : "text-muted "}`}
    >
      {label}
    </Text>
  </Pressable>
);

export default MangaListFilter;
