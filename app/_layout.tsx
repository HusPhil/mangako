// app/_layout.tsx (Root layout)
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

import { colors } from "@/constants";
import { MaterialIcons } from "@expo/vector-icons";
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
    <PaperProvider
      theme={{
        dark: true,
        colors: {
            primary: '#FC3B2C',
        }
      }}  
      settings={{
        icon: (props) => <MaterialIcons {...props} color={'#FC3B2C'}/>,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {/* <View>
        <ReactQueryDevtools />
      </View> */}
    </QueryClientProvider>
    </PaperProvider>
  );
}
