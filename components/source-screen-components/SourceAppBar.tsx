import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SourceAppBarProps {}

const SourceAppBar = ({}: SourceAppBarProps) => {
  return (
    <View className="h-16 flex-row items-center justify-between px-4 bg-background border-b border-white/5">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full justify-center items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-pbold tracking-tight">
          Manage Sources
        </Text>
      </View>
    </View>
  );
};

export default SourceAppBar;
