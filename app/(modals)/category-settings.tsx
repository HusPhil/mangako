import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Built-in Expo Icons
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Color Palette from your Design & Image Reference
const COLORS = {
  background: "#161618",
  surfaceContainerLow: "#1c1b1b",
  surfaceContainerHigh: "#2a2a2a",
  onSurfaceVariant: "#c6c6c6",
  delete: "#ff0000",
  primary: "#ffffff",
  outlineVariant: "#474747",
  headerBg: "rgba(19, 19, 19, 0.8)",
  // Drag Handle Colors from Image
  handleBg: "#232631",
  handleActive: "#FFFFFF",
  handleInactive: "rgba(255,255,255,0.3)",
  handleBorder: "rgba(255,255,255,0.1)",
};

interface CategoryItemProps {
  title: string;
  subtitle: string;
  isDefault?: boolean;
}

const CategoryItem = ({ title, subtitle, isDefault }: CategoryItemProps) => (
  <View style={styles.categoryItem}>
    <View style={styles.categoryLeft}>
      {/* The Requested Rearrange Handle */}
      <View style={styles.handleContainer}>
        <MaterialCommunityIcons
          name="arrow-up"
          size={18}
          color={COLORS.handleInactive}
        />
        <Text style={styles.handleSeparator}>|</Text>
        <MaterialCommunityIcons
          name="arrow-down"
          size={18}
          color={COLORS.handleActive}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.categoryTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>

    <View style={styles.categoryActions}>
      <TouchableOpacity activeOpacity={0.7} style={styles.actionButton}>
        <MaterialCommunityIcons
          name="pencil-outline"
          size={20}
          color={COLORS.onSurfaceVariant}
        />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} style={styles.actionButton}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={20}
          color={COLORS.delete}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function CategorySettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Categories</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructional Header */}
        <View style={styles.heroSection}>
          <Text style={styles.overline}>Organize Library</Text>
          <Text style={styles.heroTitle}>Categories</Text>
        </View>

        {/* Categories List */}
        <View style={styles.listContainer}>
          <CategoryItem title="Favorites" subtitle="142 titles" isDefault />
          <CategoryItem title="Completed" subtitle="43 titles" />
        </View>

        {/* Add Category Section (Dashed Card) */}
        <View style={styles.dashedCard}>
          <View style={styles.sparkleIcon}>
            <MaterialCommunityIcons
              name="auto-fix"
              size={24}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.cardTitle}>Create a New Collection</Text>
          <Text style={styles.cardBody}>
            Smart folders help you find exactly what you want to read next.
          </Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  heroSection: {
    marginBottom: 12,
  },
  overline: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  infoText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "400",
  },
  listContainer: {
    gap: 10,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  handleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.handleBorder,
  },
  handleSeparator: {
    color: COLORS.handleInactive,
    fontSize: 16,
    marginHorizontal: 4,
    fontWeight: "300",
    top: -1, // Visual alignment
  },
  textContainer: {
    flex: 1,
  },
  categoryTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  categorySubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 2,
  },
  actionButton: {
    padding: 8,
  },
  dashedCard: {
    marginTop: 40,
    padding: 32,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderStyle: "dashed",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  cardBody: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 240,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "black",
    fontWeight: "800",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 20,
    borderRadius: 20,
  },
  statLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statValue: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
});
