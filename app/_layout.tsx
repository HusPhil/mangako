import { Colors } from "@/constants/colors";
import { initializeDB } from "@/services/db/init";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

const queryClient = new QueryClient();

// --- 1. Create the Bridge Component ---
const DrizzleDbStudio = () => {
  const db = useSQLiteContext();
  useDrizzleStudio(db);
  return null; // This doesn't render anything, it just activates the plugin
};

const RootLayout = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider
        databaseName="app.db"
        onInit={initializeDB}
        useSuspense={true}
      >
        {/* --- 2. Place the Bridge inside the Provider --- */}
        <DrizzleDbStudio />

        <QueryClientProvider client={queryClient}>
          <View className="flex-1 bg-background">
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "simple_push",
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen
                name="manga/[id]/index"
                options={{ animation: "fade_from_bottom" }}
              />
              <Stack.Screen
                name="(modals)/test-modal"
                options={{
                  presentation: "transparentModal",
                  headerShown: false,
                  animation: "fade_from_bottom",
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
