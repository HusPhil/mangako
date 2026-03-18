import { Colors } from "@/constants/colors";
import { Image } from "expo-image";
import React from "react";
import { StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ramenIcon = require("@/assets/images/ramen_mini_icon.png");

const BrowseScreenHeader = () => {
  const insets = useSafeAreaInsets();
  return (
    <View className="w-full bg-background" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View className="flex-row items-center p-5 gap-3">
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
    </View>
  );
};

export default BrowseScreenHeader;
