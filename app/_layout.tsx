import { Colors } from "@/constants/colors";
import { runMigrations } from "@/services/db/migration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

const queryClient = new QueryClient();

const RootLayout = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider
        databaseName="app.db"
        onInit={runMigrations}
        useSuspense={true}
      >
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
      </SQLiteProvider>
    </Suspense>
  );
};

const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    }}
  >
    <ActivityIndicator size="large" color="#fff" />
  </View>
);

export default RootLayout;
