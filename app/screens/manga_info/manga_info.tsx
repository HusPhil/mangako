import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChapterList from "./components/ChapterList";
import MangaDetailsContent from "./components/MangaDetailsContent";
import MangaHeader from "./components/MangaHeader";

type MangaDetails = {
  tags: string[];
  alternativeNames: string[];
  author: string;
  status: string;
  description: string;
};

type MangaInfo = {
  mangaDetails: MangaDetails;
  chapterList: number[];
};

type LocalSearchParams = {
  mangaId?: string;
  mangaCover?: string;
  mangaTitle?: string;
  mangaUrl?: string;
};

const MangaInfoScreen = () => {
  const router = useRouter();
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = useLocalSearchParams<LocalSearchParams>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tabsListed, setTabsListed] = useState<string[]>(["Chapters", "Details"]);
  const [activeTab, setActiveTab] = useState<"Details" | "Chapters">("Details");
  const [errorData, setErrorData] = useState<null | string>(null);
  const [numberOfReadChapters, setNumberOfReadChapters] = useState<number>(123);

  const [mangaInfo, setMangaInfo] = useState<MangaInfo>({
    mangaDetails: {
      tags: ["Action", "Adventure", "Fantasy", "Magic"],
      alternativeNames: ["Alt Title 1", "Alt Title 2"],
      author: "Unknown Author",
      status: "Ongoing",
      description:
        "Set in a fantasy world where magic and adventure abound, this manga follows the journey of a young protagonist discovering their powers while navigating through dangerous quests and powerful enemies.",
    },
    chapterList: Array.from({ length: 1000 }, (_, i) => i + 1),
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000); // Simulated loading
  };

  const handleSetLastReadChapterIndex = (index: number) => {
    console.log("Chapter read status changed:", index);
  };

  const handleReadingResume = () => {
    console.log("Resume reading...");
  };

  const handleClearMangaCache = () => {
    Alert.alert(
      "Clearing manga data",
      "All the saved data on this manga will be deleted, do you still wish to proceed?",
      [
        {
          text: "Yes",
          onPress: async () => {
            console.log("Cache cleared");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView className="h-full w-full bg-primary">
      <StatusBar backgroundColor={"transparent"} barStyle={"light-content"} />
      <View className="h-full w-full">
        {renderHeader(mangaTitle || "")}

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="white" size="large" />
            <Text className="font-pregular text-white text-md mt-3">
              Loading chapter list...
            </Text>
          </View>
        ) : !errorData ? (
          <>
          <View>
            <MangaHeader
              mangaCover={mangaCover as string}
              mangaId={(mangaId as string) || "loading"}
              mangaTitle={mangaTitle as string}
              mangaUrl={mangaUrl as string}
              details={mangaInfo.mangaDetails}
              isLoading={isLoading}
              tabsListed={tabsListed.length > 0}
              numberOfReadChapters={numberOfReadChapters}
              onReadingResume={handleReadingResume}
              chapterCount={mangaInfo.chapterList.length}
            />
          </View>
        
          <TabsNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            chapterCount={mangaInfo.chapterList.length}
          />
        
          {activeTab === "Details" ? (
            <ScrollView
              className="flex-1 bg-primary"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <MangaDetailsContent
                mangaInfo={mangaInfo}
                numberOfReadChapters={numberOfReadChapters}
                handleReadingResume={handleReadingResume}
                handleClearMangaCache={handleClearMangaCache}
              />
            </ScrollView>
          ) : (
            <View className="flex-1">
              <ChapterList
                mangaUrl={(mangaUrl as string) || ""}
                chaptersData={mangaInfo.chapterList.map(String)}
                listStyles={{ flex: 1 }}
                onRefresh={handleRefresh}
                onChapterReadStatusChange={handleSetLastReadChapterIndex}
                isListed={tabsListed.length > 0}
                numberOfReadChapters={numberOfReadChapters}
              />
            </View>
          )}
        </>
        
        ) : (
          <View className="h-full justify-center items-center">
            <Text className="font-pregular text-white text-base">
              Something went wrong
            </Text>
            <Text className="font-pregular text-white text-base">
              while loading the chapters
            </Text>
            <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">
              Swipe down to retry
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MangaInfoScreen;

const renderHeader = (mangaTitle: string) => {
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View className="bg-primary">
      <View className="flex-row justify-between items-center pt-3 mb-5 border-b border-gray-300 mx-4 rounded-lg">
        <Pressable
          onPress={handleBackPress}
          className="p-3 pr-5"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={26} color="white" />
        </Pressable>

        <View className="flex-1" >
          <Text className="text-white text-lg font-semibold line-clamp-1">{mangaTitle}</Text>
        </View>

        <View className="flex-row items-center">
          <Pressable className="p-3 mr-2">
            <Ionicons name="heart-outline" size={24} color="white" />
          </Pressable>
          <Pressable className="p-3">
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

type TabsNavigationProps = {
  activeTab: "Details" | "Chapters";
  setActiveTab: React.Dispatch<React.SetStateAction<"Details" | "Chapters">>;
  chapterCount: number;
};

const TabsNavigation = ({ activeTab, setActiveTab, chapterCount }: TabsNavigationProps) => {
  return (
    <View className="px-4 mb-4">
      <View className="flex-row justify-between bg-transparent rounded-lg overflow-hidden">
        <Pressable
          className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
            activeTab === "Details" ? "opacity-100" : "opacity-50"
          }`}
          onPress={() => setActiveTab("Details")}
        >
          <Ionicons name="information-circle" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className={`text-sm ${activeTab === "Details" ? "text-white" : "text-gray-300"}`}>
            Details
          </Text>
        </Pressable>

        <Pressable
          className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
            activeTab === "Chapters" ? "opacity-100" : "opacity-50"
          }`}
          onPress={() => setActiveTab("Chapters")}
        >
          <Ionicons name="list" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className={`text-sm ${activeTab === "Chapters" ? "text-white" : "text-gray-300"}`}>
            Chapters ({chapterCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
