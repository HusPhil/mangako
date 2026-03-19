import { Button } from "@react-navigation/elements";
import React from "react";
import { Text, View } from "react-native";

const MangaReaderScreen = () => {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>MangaReaderScreen</Text>
      <Button>Mark as read</Button>
      <Button>Mark as unread</Button>
    </View>
  );
};

export default MangaReaderScreen;
