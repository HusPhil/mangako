import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { Colors } from "@/constants/colors";
import { useGetAvailableSources } from "@/hooks/api/useGetAvailableSources";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import { SourceStatus } from "@/types/ResponseTypes";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Call the hook at the top level
  const { data: sources, isLoading: isFetchingSources } =
    useGetAvailableSources();

  const currentSelectedSource = useSourceSelectionStore(
    (state) => state.currentSelectedSource,
  );
  useEffect(() => {
    const hydrate = async () => {
      await useSourceSelectionStore.persist.rehydrate();
      setIsHydrated(true);
    };
    hydrate();
  }, []);

  // 3. Sync and Validate Sources
  useEffect(() => {
    // Only run once we have data from the API and the store is hydrated
    if (isHydrated && sources) {
      useSourceSelectionStore.getState().setAvailableSources(sources);

      // Check if the saved source still exists in the fresh list
      if (currentSelectedSource) {
        const sourceExists = sources.some(
          (s) => s.sourceId === currentSelectedSource.sourceId,
        );

        if (!sourceExists) {
          // If the saved source is gone (e.g., site was removed),
          // default to the first available source

          const readyToUseSource =
            sources.find((s) => s.sourceStatus === SourceStatus.READY_TO_USE) ||
            sources[0] ||
            null;

          useSourceSelectionStore
            .getState()
            .setCurrentSelectedSource(readyToUseSource);
        }
      } else if (sources.length > 0) {
        // If no source was saved, set the first one as default
        const readyToUseSource =
          sources.find((s) => s.sourceStatus === SourceStatus.READY_TO_USE) ||
          sources[0] ||
          null;
        useSourceSelectionStore
          .getState()
          .setCurrentSelectedSource(readyToUseSource);
      }
    }
  }, [isHydrated, sources]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.accent,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0.25,
          borderColor: "rgb(255 255 255 / 0.1)",
          height: 60 + 10 + insets.bottom,
          paddingTop: 10, // Your desired top spacing
        },
        tabBarItemStyle: {
          height: 50,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "library-sharp" : "library-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
