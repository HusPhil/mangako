import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const CATEGORIES = [
  "All",
  "Reading",
  "Completed",
  "On Hold",
  "Dropped",
  "Plan to Read",
];

const MangListFilter = () => {
  const [active, setActive] = useState("All");

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
        {CATEGORIES.map((category) => {
          const isActive = active === category;

          return (
            <Pressable
              key={category}
              onPress={() => setActive(category)}
              className={`px-5 py-2 rounded-full ${
                isActive ? "bg-white/15" : "bg-transparent"
              }`}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: pressed ? "white" : "transparent",
              })}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-primary" : "text-muted"
                }`}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default MangListFilter;
