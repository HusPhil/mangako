import React from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";

const MangaInfoLoader = () => {
  return (
    <View style={styles.container}>
      {/* Ensures the bar is dark during the transition */}
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <ActivityIndicator
        size="small"
        color="#818cf8" // Aligned with your indigo-400 accent
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MangaInfoLoader;
