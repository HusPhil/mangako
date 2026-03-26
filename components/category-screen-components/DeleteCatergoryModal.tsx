import { useCategoryStore } from "@/stores/categories-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import React, { useCallback } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface DeleteCategoryModalProps {}

const DeleteCategoryModal = ({}: DeleteCategoryModalProps) => {
  const activeCategoryScreenModal = useCategoryScreenUIStore(
    (state) => state.activeModal,
  );

  const modalData = useCategoryScreenUIStore((state) => state.modalData);

  const handleDelete = useCallback(() => {
    if (modalData?.categoryId) {
      useCategoryStore.getState().removeCategory(modalData.categoryId);
      useCategoryScreenUIStore.getState().closeModal();
    }
  }, [modalData]);

  if (activeCategoryScreenModal !== "delete_confirm") return null;

  return (
    <View className="absolute inset-0 z-50 px-6 justify-center">
      {/* Backdrop */}
      <TouchableWithoutFeedback
        onPress={useCategoryScreenUIStore.getState().closeModal}
      >
        <View className="absolute inset-0 bg-background/75" />
      </TouchableWithoutFeedback>

      {/* Confirmation Card */}
      <View className="w-full bg-secondary rounded-xl p-6 border border-white/5">
        <Text className="text-accent font-pbold uppercase tracking-wider mb-2 text-[10px]">
          Delete Category
        </Text>

        <Text className="text-white text-2xl font-pbold mb-2">
          Are you sure?
        </Text>

        <Text className="text-gray-100 font-pregular text-sm leading-5 mb-8">
          You are about to delete{" "}
          <Text className="font-pbold text-white">
            "{modalData?.categoryName}"
          </Text>
          . This will remove all manga associations within this category. This
          action cannot be undone.
        </Text>

        <View className="flex-row items-center justify-end gap-6">
          <TouchableOpacity
            onPress={useCategoryScreenUIStore.getState().closeModal}
            className="py-2"
          >
            <Text className="text-gray-100 font-pmedium">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-accent px-6 py-3 rounded-2xl"
            activeOpacity={0.8}
            onPress={handleDelete}
          >
            <Text className="text-white font-pblack text-base">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DeleteCategoryModal;
