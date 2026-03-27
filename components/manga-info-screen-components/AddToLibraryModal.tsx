import { AssignedCategory } from "@/services/db/types";
import { useCategoryStore } from "@/stores/categories-store";
import { useLibraryStore } from "@/stores/library-store";
import useMangaInfoScreenUIStore from "@/stores/ui-stores/manga-info-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const AddToLibraryModal = () => {
  const activeMangaInfoScreenModal = useMangaInfoScreenUIStore(
    (state) => state.activeModal,
  );
  const modalData = useMangaInfoScreenUIStore((state) => state.modalData);
  const closeModal = useMangaInfoScreenUIStore((state) => state.closeModal);

  // Store actions
  const globalAssignedCategories = useCategoryStore(
    (state) => state.assignedCategories,
  );
  const loadMangaAssignments = useCategoryStore(
    (state) => state.loadMangaAssignments,
  );
  const updateMangaAssignments = useCategoryStore(
    (state) => state.updateMangaAssignments,
  );

  // Local state to track "pending" selections before saving to DB
  const [localAssignments, setLocalAssignments] = useState<AssignedCategory[]>(
    [],
  );

  // 1. Initial Load from DB
  useEffect(() => {
    if (activeMangaInfoScreenModal === "add_to_library" && modalData?.mangaId) {
      loadMangaAssignments(modalData.mangaId);
    }
  }, [activeMangaInfoScreenModal, modalData?.mangaId]);

  // 2. Sync local state when global store updates
  useEffect(() => {
    setLocalAssignments(globalAssignedCategories);
  }, [globalAssignedCategories]);

  if (activeMangaInfoScreenModal !== "add_to_library" || modalData === null)
    return null;

  // 3. Handle toggling a category locally
  const handleToggle = (categoryId: string) => {
    setLocalAssignments((prev) =>
      prev.map((cat) =>
        cat.category_id === categoryId
          ? { ...cat, is_assigned: !cat.is_assigned }
          : cat,
      ),
    );
  };

  // 4. Save changes to DB
  const handleSave = () => {
    if (modalData?.mangaId) {
      updateMangaAssignments(
        {
          manga_id: modalData.mangaId,
          title: modalData.mangaTitle,
          cover_url: modalData.mangaCover,
          manga_url: modalData.mangaUrl,
          source_id: modalData.mangaSourceId,
        },
        localAssignments,
      );
      useLibraryStore.getState().loadLibrary();

      closeModal();
    }
  };

  return (
    <View className="absolute inset-0 z-50 px-6 justify-center">
      <TouchableWithoutFeedback onPress={closeModal}>
        <View className="absolute inset-0 bg-background/80" />
      </TouchableWithoutFeedback>

      <View className="w-full bg-secondary rounded-[28px] p-6 border border-white/10 shadow-2xl">
        <Text className="text-white text-2xl font-pblack mb-1">
          Add to Library
        </Text>
        <Text className="text-muted font-pmedium mb-6">
          Select categories for this manga
        </Text>

        <ScrollView
          className="max-h-80 mb-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            {localAssignments.map((category) => (
              <TouchableOpacity
                key={category.category_id}
                onPress={() => handleToggle(category.category_id)}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                  category.is_assigned
                    ? "bg-accent/10 border-accent"
                    : "bg-background border-white/5"
                }`}
              >
                <Text
                  className={`font-pbold ${category.is_assigned ? "text-accent" : "text-white"}`}
                >
                  {category.name}
                </Text>
                <Ionicons
                  name={category.is_assigned ? "checkbox" : "square-outline"}
                  size={22}
                  color={category.is_assigned ? "#FC3B2C" : "#3E414A"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row items-center justify-end gap-4">
          <TouchableOpacity onPress={closeModal} className="px-4 py-2">
            <Text className="text-gray-100 font-pbold">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-white px-8 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-black font-pblack text-base">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddToLibraryModal;
