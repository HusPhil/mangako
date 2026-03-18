import { Stack } from "expo-router";
import React from "react";
import "../global.css";
const RootLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "simple_push",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          animation: "fade", // Fade often looks better for Tabs
        }}
      />

      <Stack.Screen
        name="manga/[id]/index"
        options={{
          animation: "simple_push",
        }}
      />

      {/*  
      <Stack.Screen
        name="manga/[id]/[chapterId]"
        options={{
          animation: "simple_push",
        }}
      />

      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          animation: "simple_push",
        }}
      /> */}
      <Stack.Screen
        name="(modals)/test-modal"
        options={{
          presentation: "transparentModal", // This allows the background to show through
          headerShown: false,
          animation: "fade_from_bottom", // Nicer entrance for Android
        }}
      />
    </Stack>
  );
};

export default RootLayout;
