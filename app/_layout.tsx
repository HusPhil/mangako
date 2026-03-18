import { Colors } from "@/constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import "../global.css";

const queryClient = new QueryClient();

const RootLayout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 bg-background">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "simple_push",
            animationTypeForReplace: "push",
            contentStyle: { backgroundColor: Colors.background },
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
              animation: "fade_from_bottom",
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
      </View>
    </QueryClientProvider>
  );
};

export default RootLayout;
