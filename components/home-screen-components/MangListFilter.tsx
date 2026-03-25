import { useLibraryStore } from "@/stores/library-store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// Mapping your display names to the IDs used in the DB logic
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
      className="border-white/10 py-3 bg-background/75"
      style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {/* The Add Button */}
        <Pressable
          onPress={() => {
            /* Open your add category modal or logic here */
            console.log("Add category pressed");
          }}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderColor: pressed ? "white" : "rgba(255,255,255,0.1)",
          })}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>

        {/* The Categories */}
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;

          return (
            <Pressable
              key={category.name}
              onPress={() => loadLibrary(category.id!)}
              className={`px-5 py-2 rounded-full h-10 justify-center ${
                isActive
                  ? "bg-white/15 border border-white/10"
                  : "bg-transparent"
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
      </ScrollView>
    </View>
  );
};

export default MangaListFilter;
