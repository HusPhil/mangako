import { useLibraryStore } from "@/stores/library-store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const CATEGORIES = [
  { id: null, name: "All" },
  { id: "favorites", name: "Favorites" },
  { id: "test", name: "Test" },
  { id: "reading", name: "Reading" },
  { id: "completed", name: "Completed" },
  { id: "on-hold", name: "On Hold" },
  { id: "dropped", name: "Dropped" },
  { id: "plan-to-read", name: "Plan to Read" },
];

const MangaListFilter = () => {
  const selectedCategory = useLibraryStore((state) => state.selectedCategory);
  const loadLibrary = useLibraryStore((state) => state.loadLibrary);

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
          onPress={() => router.push("/(modals)/category-settings")}
          className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center border border-white/10 ml-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderColor: pressed ? "white" : "rgba(255,255,255,0.1)",
          })}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>

        {/* 3. The Vertical Separator */}
        <View className="w-[1px] h-6 bg-white/10 mx-5" />

        {/* 4. The Categories */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <Pressable
                key={category.name}
                onPress={() => loadLibrary(category.id!)}
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
