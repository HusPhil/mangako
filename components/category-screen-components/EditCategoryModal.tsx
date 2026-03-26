import { Colors } from "@/constants/colors";
import { useCategoryStore } from "@/stores/categories-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface EditCategoryModalProps {}

const EditCategoryModal = ({}: EditCategoryModalProps) => {
  const activeCategoryScreenModal = useCategoryScreenUIStore(
    (state) => state.activeModal,
  );

  const modalData = useCategoryScreenUIStore((state) => state.modalData);

  const [name, setName] = useState<string>("");

  const handleSave = useCallback(() => {
    useCategoryStore.getState().updateCategoryName(modalData?.categoryId, name);
    useCategoryScreenUIStore.getState().closeModal();
  }, [name]);

  useEffect(() => {
    setName(modalData?.categoryName ?? "");
  }, [modalData]);

  if (activeCategoryScreenModal !== "edit_category") return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="absolute inset-0 z-50 px-6 justify-center"
    >
      <TouchableWithoutFeedback
        onPress={useCategoryScreenUIStore.getState().closeModal}
      >
        <View className="absolute inset-0 bg-background/75" />
      </TouchableWithoutFeedback>

      <View className="w-full bg-secondary rounded-xl p-5 border border-white/5">
        <Text className="text-accent font-pbold uppercase tracking-wider mb-2 text-[10px]">
          Editing Category
        </Text>

        <TextInput
          className="text-white text-2xl font-pbold py-2 border-b-2   border-white/20"
          value={name}
          onChangeText={setName}
          autoFocus
          selectionColor={Colors.accent} // Accent color
          placeholder="Category Name"
          placeholderTextColor={Colors.muted}
        />

        <View className="flex-row items-center justify-end gap-8 mt-8">
          <TouchableOpacity
            className="bg-white px-5 py-3 rounded-2xl"
            onPress={handleSave}
          >
            <Text className="text-black font-pblack text-base">
              Save changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={useCategoryScreenUIStore.getState().closeModal}
          >
            <Text className="text-gray-100 font-pmedium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditCategoryModal;
