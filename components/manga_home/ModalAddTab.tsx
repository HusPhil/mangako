import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../../constants/Colors";
import HorizontalRule from "../HorizontalRule";

interface ModalAddTabProps {
  handleAddTab: () => void;
  onClose: () => void;
  setTabTitleToAdd: (text: string) => void;
}

const ModalAddTab = ({
  handleAddTab,
  onClose,
  setTabTitleToAdd,
}: ModalAddTabProps) => {
  return (
    <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-pregular text-center">
          Add a new Tab on the List!
        </Text>
        <TouchableOpacity className="flex-1 items-end p-3" onPress={onClose}>
          <MaterialIcons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <HorizontalRule displayText={""} otherStyles={""} />
      <View className="flex-row px-4 pt-2 items-center mt-2">
        <TextInput
          placeholder="ex: Completed, Ongoing, etc"
          placeholderTextColor={colors.secondary[100]}
          className="bg-white rounded-lg py-1 px-3 text-primary font-pregular text-sm w-full"
          autoFocus={true}
          selectTextOnFocus
          textAlignVertical="center"
          onEndEditing={handleAddTab}
          onChangeText={(text) => setTabTitleToAdd(text)}
          selectionColor={colors.accent.DEFAULT}
        />
      </View>
      <TouchableOpacity
        className="flex-row justify-between border-2 border-white py-1 px-2  rounded-md mt-3 self-center"
        onPress={handleAddTab}
      >
        <View>
          <MaterialIcons name="add-circle-outline" size={15} color="white" />
        </View>
        <Text className=" text-center text-xs font-pregular text-white ml-1">
          Add Tab
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ModalAddTab;
