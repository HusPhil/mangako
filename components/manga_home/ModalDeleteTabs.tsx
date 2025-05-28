import { colors } from "@/constants";
import { Tab } from "@/services/manga_list/types";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import HorizontalRule from "../HorizontalRule";
import TabListItem from "./TabListItem";

interface ModalDeleteTabsProps {
  tabs: Tab[];
  handleDeleteTab: () => void;
  handleSelectItem: (tab: Tab) => void;
  onClose: () => void;
}
interface RenderItemProps {
  item: Tab;
  index: number;
}

const ModalDeleteTabs = ({
  tabs,
  handleDeleteTab,
  handleSelectItem,
  onClose,
}: ModalDeleteTabsProps) => {
  const renderItem = ({ item, index }: RenderItemProps) => {
    return (
      <TabListItem
        item={item}
        onSelectItem={handleSelectItem}
        selected={false}
        iconComponent={
          <MaterialIcons
            name="delete-outline"
            size={18}
            color={colors.accent.DEFAULT}
          />
        }
      />
    );
  };

  return (
    <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-pregular text-center">
          Select the Tabs you want to delete
        </Text>
        <TouchableOpacity className="flex-1 items-end p-3" onPress={onClose}>
          <MaterialIcons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <HorizontalRule displayText={""} otherStyles={""} />

      {tabs.length > 0 ? (
        <>
          <FlatList
            className="mt-3"
            data={tabs}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderItem}
          />
          <TouchableOpacity
            className="bg-accent/10 mt-3 rounded-md py-2 px-4 self-center flex-row items-center"
            onPress={handleDeleteTab}
          >
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={colors.accent.DEFAULT}
            />
            <Text className="text-accent text-sm text-center font-pregular ml-2">
              Delete Selected Tabs
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text className="text-white font-pregular text-center text-xs mt-3">
          No tabs available
        </Text>
      )}
    </View>
  );
};

export default ModalDeleteTabs;
