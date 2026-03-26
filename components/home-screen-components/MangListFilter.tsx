import { useCategoryStore } from "@/stores/categories-store";
import { useLibraryStore } from "@/stores/library-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const MangaListFilter = () => {
  const selectedCategory = useLibraryStore((state) => state.selectedCategory);
  const setSelectedCategory = useLibraryStore(
    (state) => state.setSelectedCategory,
  );
  const categories = useCategoryStore((state) => state.categories);

  useEffect(() => {
    if (categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategory]);

  return (
    <View
      className="border-white/10 py-4 bg-background/75"
      style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: "center" }}
      >
        {/* 2. Add Category Button */}
        <Pressable
          onPress={() => {
            router.push("/(modals)/category-settings");
            useCategoryScreenUIStore.getState().openModal("add_category");
          }}
          className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center border border-white/10 ml-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderColor: pressed ? "white" : "rgba(255,255,255,0.1)",
          })}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>

        {/* 3. The Vertical Separator */}

        <Text className="text-muted text-2xl mx-5 font-plight -top-0.5">|</Text>
        {/* 4. The Categories */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {categories.map((category) => {
            const isActive = selectedCategory === category.category_id;

            return (
              <Pressable
                key={category.name}
                onPress={() => setSelectedCategory(category.category_id)}
                className={`px-5 py-2 rounded-xl h-10 justify-center ${
                  isActive
                    ? "bg-white/10 border border-white/10"
                    : "bg-transparent border border-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? "text-primary" : "text-muted"
                  }`}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default MangaListFilter;
