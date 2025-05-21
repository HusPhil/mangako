// app/_layout.tsx (Root layout)
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import "../global.css";

import { colors } from "@/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="screens/manga_info"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
      </Stack>
      {/* <View>
        <ReactQueryDevtools />
      </View> */}
      <Toast position="bottom" />
    </QueryClientProvider>
  );
}
