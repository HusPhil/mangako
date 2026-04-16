import { Colors } from "@/constants/colors";
import { initializeDB } from "@/services/db/init";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import React, { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

const queryClient = new QueryClient();

const RootLayout = () => {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <SQLiteProvider
        databaseName="app.db"
        onInit={initializeDB}
        useSuspense={true}
      >
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
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
                  name="search"
                  options={{ animation: "fade_from_bottom" }}
                />

                <Stack.Screen
                  name="manga/[id]/index"
                  options={{ animation: "fade_from_bottom" }}
                />
                <Stack.Screen
                  name="manga/[id]/[chapterId]"
                  options={{
                    animation: "simple_push",
                    autoHideHomeIndicator: true,
                    navigationBarHidden: true,
                  }}
                />
                <Stack.Screen
                  name="(modals)/test-modal"
                  options={{
                    presentation: "transparentModal",
                    headerShown: false,
                    animation: "fade_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="(modals)/category-settings"
                  options={{
                    presentation: "pageSheet",
                    headerShown: false,
                    animation: "fade_from_bottom",
                  }}
                />

                <Stack.Screen
                  name="(modals)/source-settings"
                  options={{
                    presentation: "pageSheet",
                    headerShown: false,
                    animation: "fade_from_bottom",
                  }}
                />
              </Stack>
            </View>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </SQLiteProvider>
    </Suspense>
  );
};

export const LoadingOverlay = ({
  message = "Loading...",
}: {
  message?: string;
}) => (
  <View className="flex-1 justify-center items-center bg-background">
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text className="text-white/50 mt-4 font-medium tracking-widest uppercase text-xs">
      {message}
    </Text>
  </View>
);

export const ErrorOverlay = ({
  message = "An error occurred.",
}: {
  message?: string;
}) => (
  <View className="flex-1 justify-center items-center bg-background">
    <ActivityIndicator size="large" color={"red"} />
    <Text className="text-red-500 mt-4 font-medium tracking-widest uppercase text-xs">
      {message}
    </Text>
  </View>
);

export default RootLayout;
