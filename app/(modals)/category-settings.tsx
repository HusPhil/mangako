import AddCategoryCard from "@/components/category-screen-components/AddCategoryCard";
import AddCategoryModal from "@/components/category-screen-components/AddCategoryModal";
import CategoryAppBar from "@/components/category-screen-components/CategoryAppBar";
import CategoryList from "@/components/category-screen-components/CategoryList";
import CategoryScreenHeader from "@/components/category-screen-components/CategoryScreenHeader";
import DeleteCategoryModal from "@/components/category-screen-components/DeleteCatergoryModal";
import EditCategoryModal from "@/components/category-screen-components/EditCategoryModal";
import { useCategoryStore } from "@/stores/categories-store";
import React from "react";
import { Platform, ScrollView, StatusBar, View } from "react-native";

export default function CategorySettingsScreen() {
  const categories = useCategoryStore((state) => state.categories);

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <View className="flex-1 bg-secondary">
        <StatusBar barStyle="light-content" />
        <CategoryAppBar />

        <ScrollView
          contentContainerClassName="px-8 pt-8 pb-20"
          showsVerticalScrollIndicator={false}
        >
          <CategoryScreenHeader />
          <CategoryList categories={categories} />
          <AddCategoryCard />
        </ScrollView>
      </View>

      {/* MODALS */}
      <AddCategoryModal />
      <EditCategoryModal />
      <DeleteCategoryModal />
    </View>
  );
}
