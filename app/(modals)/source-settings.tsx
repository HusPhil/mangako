import AddCategoryModal from "@/components/category-screen-components/AddCategoryModal";
import DeleteCategoryModal from "@/components/category-screen-components/DeleteCatergoryModal";
import EditCategoryModal from "@/components/category-screen-components/EditCategoryModal";
import SourceAppBar from "@/components/source-screen-components/SourceAppBar";
import SourceList from "@/components/source-screen-components/SourceList";
import SourceScreenHeader from "@/components/source-screen-components/SourceScreenHeader";
import { useSourceSelectionStore } from "@/stores/source-selection-store";
import React from "react";
import { Platform, ScrollView, StatusBar, View } from "react-native";

export default function SourceSettingsScreen() {
  const availableSources = useSourceSelectionStore(
    (state) => state.availableSources,
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <View className="flex-1 bg-secondary">
        <StatusBar barStyle="light-content" />
        <SourceAppBar />

        <ScrollView
          contentContainerClassName="px-8 pt-8 pb-20"
          showsVerticalScrollIndicator={false}
        >
          <SourceScreenHeader />
          <SourceList sources={availableSources} />
        </ScrollView>
      </View>

      {/* MODALS */}
      <AddCategoryModal />
      <EditCategoryModal />
      <DeleteCategoryModal />
    </View>
  );
}
