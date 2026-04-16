import MangaGrid from "@/components/MangaGrid";
import { Colors } from "@/constants/colors";
import { useSearchMangaMutation } from "@/hooks/api/useSearchManga";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import {
  MangaResponse,
  MangaSearchResponse,
  mapResponseListToRenderList,
} from "@/types/ResponseTypes";
import { AntDesign, Ionicons, Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MangaResponse[]>([]);
  const insets = useSafeAreaInsets();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestQuery = useRef<string>("");

  const currentSelectedSource = useSourceSelectionStore(
    (state) => state.currentSelectedSource,
  );

  const {
    mutate: searchManga,
    isPending,
    reset: resetMutation,
  } = useSearchMangaMutation();

  const performSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setResults([]);
        resetMutation();
        return;
      }

      activeRequestQuery.current = trimmedQuery;
      searchManga(
        {
          source: currentSelectedSource?.sourceId || "",
          keyword: trimmedQuery,
        },
        {
          onSuccess: (data: MangaSearchResponse) => {
            if (activeRequestQuery.current === trimmedQuery) {
              setResults(data.results);
            }
          },
          onError: () => {
            if (activeRequestQuery.current === trimmedQuery) {
              setResults([]);
            }
          },
        },
      );
    },
    [currentSelectedSource, searchManga, resetMutation],
  );

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setResults([]);
      activeRequestQuery.current = "";
      resetMutation();
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch, resetMutation]);

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    activeRequestQuery.current = "";
    resetMutation();
  };

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.container}>
        {/* Modern Header Section */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* GO BACK BUTTON */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 12, paddingBottom: 4 }}
            >
              <Octicons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Search</Text>
            </View>
          </View>

          {/* Source Switcher */}
          <Pressable
            onPress={() => router.push("/(modals)/source-settings")}
            className="flex-row items-center bg-white/10 px-3 py-2 mb-1 rounded-xl border border-white/5 active:opacity-50"
          >
            <Text className="text-white/80 text-xs font-bold uppercase  tracking-widest">
              {currentSelectedSource
                ? currentSelectedSource.sourceName
                : "Select Source"}
            </Text>
            {/* vertical separator */}
            <View className="border-l border-white/10 h-4 mx-2" />
            <AntDesign name="swap" size={16} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Search Input Group */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#555"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search titles or authors..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              autoFocus
              selectionColor={Colors.primary}
            />

            <View style={styles.rightActionContainer}>
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} hitSlop={15}>
                    <Ionicons name="close-circle" size={22} color="#444" />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>

        {/* Content View Logic */}
        <View style={styles.content}>
          {searchQuery.length > 0 && results.length === 0 && !isPending ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={40} color="#333" />
              </View>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your keywords for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <MangaGrid
              mangaList={mapResponseListToRenderList(results)}
              listEmptyComponent={<></>}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: -2,
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2c2c2e",
    maxWidth: 150,
  },
  sourceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginHorizontal: 6,
    textTransform: "uppercase",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161618",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1,
    borderColor: "#262629",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
  },
  rightActionContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default Search;
