import HorizontalRule from "@/components/HorizontalRule";
import DropDownList from "@/components/modal/DropdownList";
import ModalPopup from "@/components/modal/ModalPopup";
import { ReaderMode } from "@/services/cache/types";
import { useReadChapters } from "@/services/cache/useReadChapters";
import { READER_MODES } from "@/services/cache/useReadingOptions";
import { MangaChapterPage } from "@/services/useGetChapterPages";
import { MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface ReaderOptionsSheetProps {
  visible: boolean;
  mangaId: string;
  chapterId: string;
  currentPage: number;
  totalPages: number;
  readingMode: ReaderMode;
  flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
  onClose: () => void;
  onShow?: () => void;
  onNavigate: (mode: { mode: string; jumpIndex?: number }) => void;
  onToggleReadingMode: (readingMode: ReaderMode) => void;
}

const ReaderOptionsSheet: React.FC<ReaderOptionsSheetProps> = ({
  visible,
  mangaId,
  chapterId,
  currentPage,
  totalPages,
  readingMode,
  onClose,
  onShow,
  onNavigate,
  onToggleReadingMode,
  flashListRef,
}) => {
  const [pageInput, setPageInput] = useState("");
  const [isChapterRead, setIsChapterRead] = useState(false);

  const readingModeOptions = [
    {
      label: "Vertical",
      value: "vertical",
      desc: "Scroll vertically through pages",
    },
    {
      label: "Horizontal",
      value: "horizontal",
      desc: "Swipe horizontally between pages",
    },
  ];

  // const [isChapterRead, setIsChapterRead] = useState(false);
  const { markChapterAsRead, checkIfChapterRead } = useReadChapters(
    mangaId as string
  );

  const handleJumpToPage = () => {
    const pageNumber = parseInt(pageInput);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) return;

    onNavigate({ mode: "jump", jumpIndex: pageNumber - 1 });
    setPageInput("");
  };

  const handleMarkAsRead = () => {
    markChapterAsRead(chapterId as string);
  };

  const handleCheckIfChapterRead = async () => {
    const isRead = await checkIfChapterRead(chapterId as string);
    return isRead;
  };

  useEffect(() => {
    const asyncEffect = async () => {
      const isRead = await handleCheckIfChapterRead();
      setIsChapterRead(isRead);
    };

    if (visible) {
      onShow?.();
      asyncEffect();
    }
  }, [visible]);

  const getReadingModeIndex = (readingMode: ReaderMode) => {
    return READER_MODES.findIndex(
      (mode) => mode.label === readingMode.label
    ) !== -1
      ? READER_MODES.findIndex((mode) => mode.label === readingMode.label)
      : 0;
  };

  return (
    <ModalPopup
      visible={visible}
      handleClose={onClose}
      otherStyles={{ backgroundColor: "transparent", alignSelf: "center" }}
    >
      {/* {isReadStatusLoading ? (
        <Text>Loading...</Text>
      ) : ( */}
      <View className="h-full w-full justify-end items-center px-3 bg-transparent">
        <View className="w-full bg-secondary rounded-t-xl p-4 pb-8">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-pregular text-lg">
              {chapterId}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color="white"
                className="p-2"
              />
            </TouchableOpacity>
          </View>

          <HorizontalRule displayText="" otherStyles="mx-0" />

          {/* Page Navigation */}
          <View className="my-4">
            <Text className="text-white font-pregular mb-2">
              Page Navigation
            </Text>
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
              listItems={READER_MODES}
              selectedIndex={getReadingModeIndex(readingMode)}
              onValueChange={(value: ReaderMode) => onToggleReadingMode(value)}
              otherContainerStyles="mx-0"
            />
          </View>

          {/* Mark as Read Button */}
          <TouchableOpacity
            className="bg-accent py-3 rounded-lg mt-2 disabled:opacity-50"
            onPress={handleMarkAsRead}
            disabled={isChapterRead}
          >
            <Text className="text-white font-pregular text-center">
              Mark Chapter as Read
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* )} */}
    </ModalPopup>
  );
};

export default ReaderOptionsSheet;
