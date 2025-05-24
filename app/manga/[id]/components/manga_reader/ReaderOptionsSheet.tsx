import HorizontalRule from "@/components/HorizontalRule";
import DropDownList from "@/components/modal/DropdownList";
import ModalPopup from "@/components/modal/ModalPopup";
import { colors } from "@/constants";
import { MangaChapterPage } from "@/services/useGetChapterPages";
import { MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import React, { useState } from "react";
import { Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ReaderOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  currentPage: number;
  totalPages: number;
  onNavigate: (mode: { mode: string; jumpIndex?: number }) => void;
  horizontal: boolean;
  inverted: boolean;
  flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
  onToggleReadingMode: () => void;
  onToggleInverted: () => void;
}

const ReaderOptionsSheet: React.FC<ReaderOptionsSheetProps> = ({
  visible,
  onClose,
  currentPage,
  totalPages,
  onNavigate,
  horizontal,
  inverted,
  onToggleReadingMode,
  onToggleInverted,
  flashListRef,
}) => {
  const [pageInput, setPageInput] = useState("");
  
  const readingModeOptions = [
    { label: "Vertical", value: "vertical", desc: "Scroll vertically through pages" },
    { label: "Horizontal", value: "horizontal", desc: "Swipe horizontally between pages" },
  ];

  const handleJumpToPage = () => {
    const pageNumber = parseInt(pageInput);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) return;
    
    onNavigate({ mode: "jump", jumpIndex: pageNumber - 1 });
    setPageInput("");
  };

  return (
    <ModalPopup
      visible={visible}
      handleClose={onClose}
      otherStyles={{ backgroundColor: "transparent", alignSelf: "center" }}
    >
      <View className="h-full w-full justify-end items-center px-3 bg-transparent">
        <View className="w-full bg-secondary rounded-t-xl p-4 pb-8">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-pregular text-lg">Reader Options</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="white" className="p-2"/>
            </TouchableOpacity>
          </View>
          
          <HorizontalRule displayText="" otherStyles="mx-0" />

          {/* Page Navigation */}
          <View className="my-4">
            <Text className="text-white font-pregular mb-2">Page Navigation</Text>
            <View className="flex-row justify-between items-center">
              <View className="px-4 flex-1">
                <Text className="text-white font-pregular text-center mb-2">
                  Current: {currentPage + 1} / {totalPages}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-center items-center mt-2">
              <TextInput
                className="bg-primary text-white px-4 py-2 rounded-l-lg flex-1"
                placeholder="Enter page number"
                placeholderTextColor="#666"
                // keyboardType="twitter"
                value={pageInput}
                onChangeText={setPageInput}
                maxLength={4}
              />
              <TouchableOpacity 
                className="bg-accent px-4 py-2 rounded-r-lg"
                onPress={handleJumpToPage}
              >
                <Text className="text-white font-pregular">Jump</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reading Mode */}
          <View className="mb-4">
            <DropDownList
              title="Reading Mode"
              listItems={readingModeOptions}
              selectedIndex={horizontal ? 1 : 0}
              onValueChange={() => onToggleReadingMode()}
              otherContainerStyles="mx-0"
            />
          </View>
          
          {/* Inverted Reading */}
          <View className="mb-4 flex-row justify-between items-center">
            <Text className="text-white font-pregular">Reverse Reading Direction</Text>
            <Switch
              trackColor={{ false: "#767577", true: colors.accent.DEFAULT }}
              thumbColor={inverted ? "#fff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={onToggleInverted}
              value={inverted}
            />
          </View>
        </View>
      </View>
    </ModalPopup>
  );
};

export default ReaderOptionsSheet; 