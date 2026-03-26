import { useCategoryStore } from "@/stores/categories-store";
import useCategoryScreenUIStore from "@/stores/ui-stores/category-screen-ui-store";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface AddCategoryModalProps {}

const AddCategoryModal = ({}: AddCategoryModalProps) => {
  const activeCategoryScreenModal = useCategoryScreenUIStore(
    (state) => state.activeModal,
  );
  const [name, setName] = useState<string>("");

  const handleSave = useCallback(() => {
    useCategoryStore.getState().addCategory(name);
    useCategoryScreenUIStore.getState().closeModal();
    setName("");
  }, [name]);

  if (activeCategoryScreenModal !== "add_category") return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="absolute inset-0 z-50 px-6 justify-center"
    >
      <TouchableWithoutFeedback
        onPress={() => useCategoryScreenUIStore.getState().closeModal()}
      >
        <View className="absolute inset-0 bg-background/75" />
      </TouchableWithoutFeedback>

      {/* The Content Area */}
      <View className="px-8 pb-20 w-full bg-secondary p-5">
        {/* Label with Accent Color */}
        <Text className="text-accent font-pbold uppercase tracking-[3px] text-[10px] mb-2">
          New Category Name
        </Text>

        {/* The Underline Input */}
        <View className="border-b-2 border-white/20 pb-2">
          <TextInput
            className="text-white text-4xl font-pbold"
            value={name}
            onChangeText={setName}
            autoFocus
            placeholder="Favorites..."
            placeholderTextColor="#3E414A"
            selectionColor="#FC3B2C" // Accent color for the cursor
            cursorColor="#FC3B2C"
            style={{
              includeFontPadding: false,
              minHeight: 60, // Space for descenders
            }}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-10">
          <View className="flex-row items-center gap-6">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              className="bg-white px-8 py-4 rounded-2xl shadow-xl shadow-black"
            >
              <Text className="text-black font-pblack text-base">Create</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => useCategoryScreenUIStore.getState().closeModal()}
              className="py-2"
            >
              <Text className="text-gray-100 font-pmedium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {/* Icon hint */}
          <Ionicons name="sparkles-outline" size={24} color="#FC3B2C" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddCategoryModal;
