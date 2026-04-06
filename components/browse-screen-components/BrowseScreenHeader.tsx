import { Colors } from "@/constants/colors";
import { Source } from "@/types/ResponseTypes";
import { AntDesign, Ionicons, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Pressable, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ramenIcon = require("@/assets/images/ramen_mini_icon.png");

const BrowseScreenHeader = ({
  currentSelectedSource,
}: {
  currentSelectedSource: Source | null;
}) => {
  const insets = useSafeAreaInsets();
  const handleManageSourcesPress = () => {
    router.push("/(modals)/source-settings");
  };

  return (
    <View className="w-full bg-background" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View className="flex-row items-center p-5 justify-between  ">
        <View className="flex-row items-center gap-3">
          <Image
            source={ramenIcon}
            style={{
              height: "undefined" as any,
              width: 35,
              aspectRatio: 1,
            }}
          />
          <Text className="text-primary text-3xl font-bold">Browse</Text>
        </View>
        {/* Source Switcher */}
        <Pressable
          onPress={handleManageSourcesPress}
          className="flex-row items-center bg-white/10 px-3 py-2 rounded-xl border border-white/5 active:opacity-50"
        >
          <Text className="text-white/80 text-xs font-bold uppercase  tracking-widest">
            {currentSelectedSource
              ? currentSelectedSource.sourceName
              : "Select Source"}
          </Text>
          {/* vertical separator */}
          <View className="border-l border-white/10 h-4 mx-2" />
          <AntDesign name="swap" size={16} color={Colors.primary} />
        </Pressable>
      </View>
      {/* Improved Search Section */}
      <View className="px-5 mb-5">
        <Pressable
          className="flex-row items-center bg-white/5 border border-white/10 py-2 px-4 rounded-xl active:opacity-50"
          onPress={() => router.push("/search")}
        >
          <Octicons
            name="triangle-right"
            size={30}
            style={{ marginLeft: -8 }}
            color="#A0A0A0"
          />

          <View className="flex-1">
            <Text className="text-white/50 text-base font-medium">
              Search your favorite manga...
            </Text>
          </View>

          {/* Filter Icon - Useful for UX */}
          <View className="pl-3 border-l border-white/10">
            <Ionicons name="search" size={20} color={Colors.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default BrowseScreenHeader;
